var path = require('path');
var fs = require('fs');
var _ = require('underscore');

var MUP_COMMAND_DESCRIPTION = 'Deploy an app using maka and mup. \n\n' +
  'You can set up a custom maka mup deploy \n' +
  'command and project in .maka/config.json\n\n' + 
  'NEW: You may invoke any mup command anywhere in your\n' +
  'project by passing \n' +
  'the mup command as an argument.  Example: \n\n' + 
  ' $ maka mup dev --ssh \n\n';;

Command.create({
  name: 'mup',
  usage: 'maka mup <environment>',
  description: MUP_COMMAND_DESCRIPTION,
  examples: [
    'maka mup dev --init',
    'maka mup dev --setup',
    'maka mup dev --deploy',
    'maka mup staging --init',
    'maka mup staging --setup',
    'maka mup staging --deploy',
    'maka mup prod --init',
    'maka mup prod --setup',
    'maka mup prod --deploy',
    'maka mup help (displays mup help page)',
  ]
}, function (args, opts) {

  if (args[0] === 'help') {
    this.execSync('mup help', {cwd: cwd});
    return;
  }


  if (args.length < 1)
    throw new Command.UsageError;


  var config = CurrentConfig.withConfigFile(function() {
    return this.CurrentConfig.get();
  });

  var mupConfig;
  var mupConfigKeys;
  var destinationKey = args[0];
  var mupVersion = 'mup';

  if (config && config.mup) {
    mupConfig = config.mup;
    mupConfigKeys = _.keys(mupConfig);
    if (mupConfig.version) {
      mupVersion = mupConfig.version;
    }
  }

  if (destinationKey === 'staging') {
    destinationKey = 'staging';
  } else if (destinationKey === 'prod') {
    destinationKey = 'production';
  } else if (destinationKey === 'dev') {
    destinationKey = 'development';
  }

  if (destinationKey !== 'development' && destinationKey !== 'staging' && destinationKey !== 'production') {
    throw new Command.UsageError;
  }


  // Default to config directory
  var destination = mupConfig && mupConfig[destinationKey] || 'config/' + destinationKey;
  var cwd = path.join(this.pathFromProject(), destination);

  var mupCommand;

  if (opts.init) {

    if (this.isFile(cwd + '/mup.js')) {
      this.logError("MUP already initialized.");
      return false;
    }
    if (this.isFile(cwd + '/settings.json')) {
      if (!this.confirm("This will temporarily back up your settings.json file, and replace it after MUP is initialized. Continue?")) {
        return false;
      } else {
        fs.renameSync(cwd + '/settings.json', cwd + '/settings.bak');
      }
    }

    mupCommand = mupVersion + ' init';
  } else if (opts.setup) {
    mupCommand = mupVersion + ' setup';
  } else if (opts.reconfig) {
    mupCommand = mupVersion + ' reconfig';
  } else if (opts.deploy) {
    //this.maybeProxyCommandToMeteor('npm', 'audit');
    mupCommand = mupVersion + ' deploy';
  } else {
    this.maybeProxyCommandToMup();
  }

  var spinHandle = this.logWithSpinner();

  try {
    this.execSync(mupCommand, {cwd: cwd});
  } catch(e) {
    this.logError(e);
  } finally {
    spinHandle.stop();
    if (opts.init) {
      var mupJson = fs.readFileSync(cwd + '/mup.js', 'utf8');
      mupJson = mupJson.replace('path: \'.\/\'', 'path: \'..\/..\/app\'');
      mupJson = mupJson.replace('version: \'3.4.1\'', 'version: \'4.0.2\'');
      mupJson = mupJson.replace('abernix/meteord:node-8.4.0-base', 'zodern/meteor:root');

      try {
        fs.statSync(cwd + '/ssh.json');
        var sshConfig = fs.readFileSync(cwd + '/ssh.json', 'utf8');
        var sshConfigJson = JSON.parse(sshConfig);
        mupJson = mupJson.replace('1.2.3.4', sshConfigJson.host);
        mupJson = mupJson.replace('root', sshConfigJson.user);
        mupJson = mupJson.replace('\/\/ pem: \'./path\/to\/pem\'', 'pem: \'' +sshConfigJson.pem + '\'');

      } catch (e) {

      }

      fs.writeFileSync(cwd + '/mup.js', mupJson);

      if (this.isFile(cwd + '/settings.bak')) {
        fs.unlinkSync(cwd + '/settings.json');
        fs.renameSync(cwd + '/settings.bak', cwd + '/settings.json');
      }

    }
  }
});
