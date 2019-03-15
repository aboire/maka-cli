var path = require('path');
var fs = require('fs');
var _ = require('underscore');

var MUP_COMMAND_DESCRIPTION = 'Deploy an app using maka and mup. \n\n' +
    'You can set up a custom maka mup deploy \n' +
    'command and project in .maka/config.json\n\n' + 
    'NEW: You may invoke any mup command anywhere in your project by passing \n' +
    'the mup command as an argument.  Example: \n\n' + 
    ' $ maka mup dev --ssh \n\n';;

Command.create({
  name: 'mup',
  usage: 'maka mup <environment>',
  description: MUP_COMMAND_DESCRIPTION,
  examples: [
    'maka mup dev --init',
    'maka mup dev --setup',
    'maka mup dev (Maps to development. Deploys the project.)',
    'maka mup staging --init',
    'maka mup staging --setup',
    'maka mup staging (Maps to staging. Deploys the project.)',
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

  if (destinationKey === 'dev') {
    destinationKey = 'development';
  } else if (destinationKey === 'staging') {
    destinationKey = 'staging';
  }

  if (destinationKey !== 'development' && destinationKey !== 'staging') {
    throw new Command.UsageError;
  }


  // Default to config directory
  var destination = mupConfig && mupConfig[destinationKey] || 'config/' + destinationKey;
  var cwd = path.join(this.pathFromProject(), destination);

  var mupCommand;

  if (opts.init) {

    if (this.isFile(destination + '/mup.js')) {
      this.logError("MUP already initialized.");
      return false;
    }
    if (this.isFile(destination + '/settings.json')) {
      if (!this.confirm("This will temporarily back up your settings.json file, and replace it after MUP is initialized. Continue?")) {
        return false;
      } else {
        fs.renameSync(destination + '/settings.json', destination + '/settings.bak');
      }
    }

    mupCommand = mupVersion + ' init';
  } else if (opts.setup) {
    mupCommand = mupVersion + ' setup';
  } else if (opts.reconfig) {
    mupCommand = mupVersion + ' reconfig';
  } else if (opts.deploy) {
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
      var mupJson = fs.readFileSync(destination + '/mup.js', 'utf8');
      mupJson = mupJson.replace('"enableUploadProgressBar": true', '"enableUploadProgressBar": false');
      fs.writeFileSync(destination + '/mup.js', mupJson);

      if (this.isFile(destination + '/settings.bak')) {
        fs.unlinkSync(destination + '/settings.json');
        fs.renameSync(destination + '/settings.bak', destination + '/settings.json');
      }
    }
  }

});
