var path = require('path');
var Future = require('fibers/future');
var _ = require('underscore');
var fs = require('fs');

Command.create({
  name: 'deploy',
  usage: 'maka deploy <server-kernel-type> [--env] [--ssl] [--mongo]',
  description: 'Deploy your app to a server.'
}, function (args, opts) {
  var self = this;

  if (opts.help)
    throw new Command.UsageError;

  if (!opts.env)
    throw new Command.UsageError;

  var config = CurrentConfig.withConfigFile(function() {
    return this.CurrentConfig.get();
  });

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

  // If force was passed
  var useForce = opts.force;

  try {
    var configPath = this.checkConfigExists(opts.env);

    var SSH_CONFIG = JSON.parse(fs.readFileSync(configPath + '/ssh.json'));
    var SSH = { env: configPath, user: SSH_CONFIG.user, host: SSH_CONFIG.host, port: SSH_CONFIG.port, pem: SSH_CONFIG.pem };
    var SCP = {};
    Object.assign(SCP, { dest: '~/' }, SSH);

    var sslKey = '';
    var sslCrt = '';
    if (opts.ssl) {
        sslKey = config.appName + '.key';
        try {
          fs.statSync(configPath + '/_keys/' + sslKey);
        } catch (e) {
          //throw '[-] You do not have a valid ssl key.  Looking for: ' + sslKey;
          sslKey = this.ask('[!] I could not find a valid SSL file, please provide the name of the SSL file in the _keys/ directory:');
          try {
            fs.statSync(configPath + '/_keys/' + sslKey);
          } catch (e) {
            throw '[-] You do not have a valid SSL file: ' + configPath + '/_keys/' + sslKey;
          }
        }

        sslCrt = config.appName + '.crt';
        try {
          fs.statSync(configPath + '/_keys/' + sslCrt);
        } catch (e) {
          sslCrt = this.ask('[!] I could not find a valid CRT file, please provide the name of the CRT file in the _keys/ directory:');
          try {
            fs.statSync(configPath + '/_keys/' + sslCrt);
          } catch (e) {
            throw '[-] You do not have a valid ssl crt.  Looking for: ' + sslCrt;
          }
        }
    }

    this.logNotice('[+] Checking remote host is available (IP is correct, SSH port is open, and credentials are correct) ...');
    this.logNotice('[+] If this takes more than a few seconds, check your ssh.json config. (consider running "maka aws set-host --env <env>")');
    try {
      var resp = this.sshPing(SSH, 'uname -a');
      if (!resp) throw '[-] Could not connect to remote host. Please check your ssh.json config file.';
      if (resp) this.logSuccess('[+] Remote host connection successful, continuing!');
    } catch (e) {
      this.logError(e);
      return;
    }

    this.logNotice('[+] Building deployment script ...');
    try {
      var future = new Future();

      try {
        var deployConfig = fs.readFileSync(configPath + '/deploy.sh');
        var confirm = true; // default to true
        if (deployConfig && !useForce) {
          confirm = self.confirm('[?] Would you like to replace the current deployment script?');
        }
      } catch(e) {
        //this.logNotice('[+] No previous deplopyment script found');
      }

      if (confirm || useForce) {
        // df is deployFile
        var df = fs.createWriteStream(configPath + '/deploy.sh', { flags: 'w' });
        df.on('open', function() {
          df.write('sudo apt-get update\n');
          df.write('# install git and nginx\n');
          df.write('sudo ' + PKG_MGR + ' install git nginx -y\n');
          if (opts.mongo === true) {
            df.write('# install and configure local mongo\n');
            df.write('wget -qO - https://www.mongodb.org/static/pgp/server-4.2.asc | sudo apt-key add -\n');
            df.write('echo "deb [ arch=amd64 ] https://repo.mongodb.org/apt/ubuntu bionic/mongodb-org/4.2 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.2.list\n');
            df.write('sudo apt-get update\n');
            df.write('sudo apt-get install -y mongodb-org\n');
            df.write('sudo service mongod start\n');
            df.write('sudo systemctl enable mongod.service\n');
          }
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
          df.write('# Nginx will be restarted just before completing the deployment.\n');
          if (opts.ssl === true) {
            df.write('sudo cp ~/nginx.ssl.conf /etc/nginx/sites-enabled/default\n');
            df.write('sudo mkdir -p /etc/nginx/ssl/\n');
            df.write('sudo mv ~/' + sslKey + ' /etc/nginx/ssl/' + sslKey +'\n');
            df.write('sudo mv ~/' + sslCrt + ' /etc/nginx/ssl/' + sslCrt +'\n');
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
          df.write('sudo env PATH=$PATH:$(which npm) $(which pm2) startup systemd -u ' + SSH_CONFIG.user + ' --hp /home/' + SSH_CONFIG.user + '\n');
          //df.write('pm2 startup systemd -u ' + SSH_CONFIG.user + ' --hp /home/' + SSH_CONFIG.user + '\n');
          df.write('pm2 save\n');
          df.write('# remove tar bundle\n');
          df.write('rm -f ~/app.tar.gz\n');
        });
        df.on('finish', function() {
          df.end();
        });

        self.logSuccess('[+] Deployment script written to: ' + configPath + '/deploy.sh');
      }


      if (!useForce) {
        var confirmScript = self.confirm('[?] Please review the deployment script.  Are you ready to deploy?');
        if (!confirmScript) {
          throw '[-] Aborted deployment!';
        }
      }

      var buildArgs = ['build', '--architecture=os.linux.x86_64'];

      // Make sure to set the server option if this is a mobile platform.  Basically, because browser
      // and server are required for a mobile platform, if there are more than two items in
      // the platforms file, we can assume it's a mobile build.
      try { 
        var platforms = this.readFileLines(path.join(this.pathFromProject(), 'app/.meteor/platforms'));
        var isMobile = (platforms.length > 2) ? true : false;
        if (isMobile) {

          var server = (config.serverName) ? config.serverName : this.ask('[?] Mobile server IP or fully qualified domain name (FQDN): ');
          var port = (config.serverPort) ? config.serverPort : this.ask('[?] Mobile server port: ');
          if (server.length == 0 || port.length == 0) throw '[!] Server name or port number are not long enough!';

          var httpPort = (port == '443') ? 'https' : 'http';

          buildArgs.push('--server='+httpPort+'://'+server+':'+port);

          if (!config.serverName && !config.serverPort) {
            var confirm = this.ask('[?] Would you like to save the server config in your .maka/config.json file? [yn]');
            if (confirm) {
              CurrentConfig.withConfigFile(function() {
                this.CurrentConfig.set('serverName', server);
                this.CurrentConfig.set('serverPort', port);
              });
              this.logNotice('[+] Stored server config to .maka/config.json');
            }
          }
        }
      } catch(e) {
        this.logError(e);
        return;
      }

      var bundle = path.join(this.pathFromProject(), 'build') + '/app.tar.gz';
      try {
        if (useForce) throw 'ball';

        fs.statSync(bundle);
        var rebuildQ = this.confirm('[?] Found existing bundle, would you like to rebuild it?');
        if (rebuildQ) {
          this.logNotice('[+] Preparing bundle ...');
        this.logNotice('[*] maka ' + buildArgs.join(' '));
          this.spawnSync('maka', buildArgs);
        }
      } catch (e) {
        this.logNotice('[+] Preparing bundle ...');
        this.logNotice('[*] maka ' + buildArgs.join(' '));
        this.spawnSync('maka', buildArgs);
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
        var sslKey = configPath + '/_keys/' + sslKey;
        var sslKeySCP = {};
        Object.assign(sslKeySCP, { source: sslKey }, SCP);
        this.scp(sslKeySCP);

        var sslCrt = configPath + '/_keys/' + sslCrt;
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
      this.logNotice('** Nginx status is:');
      var verNginx = 'sudo systemctl daemon-reload && sudo systemctl start nginx && sudo systemctl status nginx | grep Active';
      var verNginxCmdSSH = {};
      Object.assign(verNginxCmdSSH, SSH);
      this.ssh(verNginxCmdSSH, verNginx);

      this.logNotice('** PM2 Status is:');
      var verPm2 = 'source ~/.bashrc && pm2 status';
      var verPm2CmdSSH = {};
      Object.assign(verPm2CmdSSH, SSH);
      this.ssh(verPm2CmdSSH, verPm2);
      this.logNotice('** If your PM2 has more than 1 restart, that is in indication that your node process is failing.  Consider running: maka ssh --env <env> "pm2 logs"');
      this.logNotice('** Most cases, there is not MongoDB instance configured in pm2.config.js.');
      this.logNotice('** Consider a standalone mongo server or deploying with a local mongo install: maka deploy --env <env> --mongo');

      //this.logNotice('[>] Cleaning up remote server...');
      this.logSuccess('[+] Deployed to: ' + SSH_CONFIG.host);

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
