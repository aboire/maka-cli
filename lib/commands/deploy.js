var path = require('path');
var Future = require('fibers/future');
var _ = require('underscore');
var fs = require('fs');

Command.create({
  name: 'deploy',
  usage: 'maka deploy <server-kernel-type> [--env] [--ssl]',
  description: 'Deploy your app to a server.'
}, function (args, opts) {
  var self = this;
  var config = CurrentConfig.withConfigFile(function() {
    return this.CurrentConfig.get();
  });

  if (opts.help)
    throw new Command.UsageError;

  if (!opts.env)
    throw new Command.UsageError;

  if (!this.findProjectDirectory())
    throw new Command.MustBeInProjectError;

  var NODE_VER = this.execSync('maka node --version', {}, false).replace('v','');
  var PKG_MGR = '';

  var validKernels = [
    'ubuntu',
  ];

  if (validKernels.includes(args[1])) {
    switch(args[1]) {
      case 'ubuntu':
        PKG_MGR = 'apt';
        break;
      case 'amazon':
        PKG_MGR = 'yum';
        break;
      default:
        PKG_MGR = 'apt';
    }
  } else {
    PKG_MGR = 'apt';
  }

  try {
    var configPath = this.checkConfigExists(opts.env);

    var SSH_CONFIG = JSON.parse(fs.readFileSync(configPath + '/ssh.json'));
    var SSH = { env: configPath, user: SSH_CONFIG.user, host: SSH_CONFIG.host, port: SSH_CONFIG.port, pem: SSH_CONFIG.pem };
    var SCP = {};
    Object.assign(SCP, { dest: '~/' }, SSH);

    var sslKey = '';
    var sslCrt = '';
    if (opts.ssl) {
        sslKey = configPath + '/_keys/' + config.appName + '.key';
        try {
          fs.statSync(sslKey);
        } catch (e) {
          throw '[-] You do not have a valid ssl key.  Looking for: ' + sslKey;
        }

        sslCrt = configPath + '/_keys/' + config.appName + '.crt';
        try {
          fs.statSync(sslCrt);
        } catch (e) {
          throw '[-] You do not have a valid ssl crt.  Looking for: ' + sslCrt;
        }
    }

    this.logNotice('[+] Building deployment script ...');
    try {
      var future = new Future();

      // df is deployFile
      var df = fs.createWriteStream(configPath + '/deploy.sh', { flags: 'w' });
      df.on('open', function() {
        df.write('# install git and nginx\n');
        df.write('sudo apt-get update\n');
        df.write('sudo ' + PKG_MGR + ' install git nginx -y\n');
        df.write('# setup node and npm with the proper node version using nvm\n');
        df.write('git clone https://gist.github.com/c427ccd6f4377b39299b9d402f5d51fe.git ~/maka-env/nvm-install\n');
        df.write('rm -rf ~/.bash_profile ~/.bashrc\n');
        df.write('touch ~/.bash_profile ~/.bashrc\n');
        df.write('chmod +x ~/maka-env/nvm-install/nvm-install.sh && ~/maka-env/nvm-install/nvm-install.sh\n');
        df.write('source ~/.bashrc\n');
        df.write('nvm install ' + NODE_VER + '\n');
        df.write('nvm alias default ' + NODE_VER + '\n');
        df.write('npm install -g pm2\n');
        df.write('rm -rf ~/maka-env/nvm-install\n');
        df.write('# Prepare nginx\n');
        df.write('sudo mkdir /etc/systemd/system/nginx.service.d\n');
        df.write('printf "[Service]\\nExecStartPost=/bin/sleep 0.1\\n" > override.conf\n');
        df.write('sudo cp override.conf /etc/systemd/system/nginx.service.d/override.conf\n');
        df.write('sudo systemctl daemon-reload\n');
        df.write('sudo systemctl stop nginx\n');
        df.write('sudo nginx -s stop\n');
        if (opts.ssl === true) {
          df.write('sudo cp ~/nginx.ssl.conf /etc/nginx/sites-enabled/default\n');
          df.write('sudo mkdir -p /etc/nginx/ssl/\n');
          df.write('sudo mv ~/' + config.appName + '.key /etc/nginx/ssl/' + config.appName +'.key\n');
          df.write('sudo mv ~/' + config.appName + '.crt /etc/nginx/ssl/' + config.appName +'.crt\n');
        } else {
          df.write('sudo cp ~/nginx.default.conf /etc/nginx/sites-enabled/default\n');
        }
        df.write('# Decompress the bundle\n');
        df.write('tar -xf app.tar.gz\n');
        df.write('cd bundle/programs/server\n');
        df.write('npm install\n');
        df.write('npm audit fix --force\n');
        df.write('cd ~\n');
        df.write('# Reset pm2 \n');
        df.write('pm2 delete all\n');
        df.write('# Bring up pm2 with environment\n');
        df.write('pm2 start ~/pm2.config.js\n');
        df.write('# Configure pm2 to start on boot\n');
        df.write('pm2 startup\n')
        df.write('pm2 startup systemd -u ' + SSH_CONFIG.user + ' --hp /home/' + SSH_CONFIG.user + '\n');
        df.write('pm2 save\n');
        df.write('# remove tar bundle\n');
        df.write('rm -f ~/app.tar.gz\n');
      });
      df.on('finish', function() {
        df.end();
      });

      self.logSuccess('[+] Deployment script written to: ' + configPath + '/deploy.sh');
      var confirm = self.confirm('[?] Please review the deployment script.  Are you ready to deploy?');
      if (!confirm) {
        throw '[-] Aborted deployment!';
      }

      var bundle = path.join(this.pathFromProject(), 'build') + '/app.tar.gz';
      try {
        fs.statSync(bundle);
      } catch (e) {
        var rebuildQ = this.confirm('[?] Found existing bundle, would you like to rebuild it?');
        if (rebuildQ) {
          this.logNotice('[+] Preparing bundle ...');
          var buildArgs = ['build', '--architecture=os.linux.x86_64'];
          this.spawnSync('maka', buildArgs);
        }
      }

      this.logNotice('[^] Pushing up bundle ...');
      var bundleSCP = {}
      Object.assign(bundleSCP, { source: bundle }, SCP);
      this.scp(bundleSCP);

      this.logNotice('[^] Pushing up deploy scripts ...');
      var deploySh =  configPath + '/deploy.sh';
      var deployShSCP = {};
      Object.assign(deployShSCP, { source: deploySh }, SCP);
      this.scp(deployShSCP);

      var nginxConf = (opts.ssl) ? configPath + '/nginx.ssl.conf' : configPath + '/nginx.default.conf';
      var nginxConfSCP = {};
      Object.assign(nginxConfSCP, { source: nginxConf }, SCP);
      this.scp(nginxConfSCP);

      var pm2Conf = configPath + '/pm2.config.js';
      var pm2ConfSCP = {};
      Object.assign(pm2ConfSCP, { source: pm2Conf }, SCP);
      this.scp(pm2ConfSCP);

      var settings = configPath + '/settings.json';
      var settingsSCP = {};
      Object.assign(settingsSCP, { source: settings }, SCP);
      this.scp(settingsSCP);

      if (opts.ssl) {
        var sslKey = configPath + '/_keys/' + config.appName + '.key';
        var sslKeySCP = {};
        Object.assign(sslKeySCP, { source: sslKey }, SCP);
        this.scp(sslKeySCP);

        var sslCrt = configPath + '/_keys/' + config.appName + '.crt';
        var sslCrtSCP = {};
        Object.assign(sslCrtSCP, { source: sslCrt }, SCP);
        this.scp(sslCrtSCP);
      }

      this.logNotice('[>] Running deployment scripts on remote server ...');
      var deployCmd = 'chmod +x ~/deploy.sh && ./deploy.sh';
      var deployCmdSSH = {};
      Object.assign(deployCmdSSH, SSH);
      this.ssh(deployCmdSSH, deployCmd);

      this.logNotice('[>] Verifying deployment ...');
      var verNginx = 'sudo systemctl daemon-reload && sudo systemctl start nginx && sudo systemctl status nginx | grep Active';
      var verNginxCmdSSH = {};
      Object.assign(verNginxCmdSSH, SSH);
      this.ssh(verNginxCmdSSH, verNginx);

      var verPm2 = 'source ~/.bashrc && pm2 status';
      var verPm2CmdSSH = {};
      Object.assign(verPm2CmdSSH, SSH);
      this.ssh(verPm2CmdSSH, verPm2);

      this.logNotice('[>] Cleaning up remote server...');

      future.wait();
    } catch (e) {
      this.logError(e);
    }
    // remove deploy and any platforms
    //var r = args.concat(_.without(process.argv.slice(2), 'deploy', args[0]));
    //return this.invokeMeteorCommand('deploy', r);
  } catch (e) {
    this.logError(e);
  }
});
