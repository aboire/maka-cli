var path = require('path');
var fs = require('fs');
var spawn = require('child_process').spawn;
var source = require('shell-source');
var Future = require('fibers/future');
var _ = require('underscore');

var syncSource = function (filepath) {
  var future = new Future;
  source(filepath, future.resolver());
  return future.wait();
};

Command.create({
  name: 'run',
  usage: 'maka run [--use-build] [--env]',
  description: 'Run your app for a given environment.'
}, function (args, opts) {
  if (opts.help)
    throw new Command.UsageError;

  if (!this.findProjectDirectory())
    throw new Command.MustBeInProjectError;



  var appEnv = opts.env;
  switch (appEnv) {
    case 'dev':
      appEnv = 'development';
      break;
    case 'prod':
      appEnv = 'production';
      break;
    default:
      appEnv = 'development';
  }


  var configPath = this.pathFromProject('config', appEnv),
    envPath = path.join(configPath, 'env.sh'),
    settingsPath;


  if (process.platform === 'win32') {
    envPath = path.join(configPath, 'env.bat');
  }

  if (opts.env) {
    configPath = this.pathFromProject('config', appEnv);
  }

  // allow settings override
  if (opts.settings) {
    settingsPath = opts.settings;
  } else {
    settingsPath = path.join(configPath, 'settings.json');
  }

  // source the env file into the process environment
  if (this.isFile(envPath)) {
      this.logNotice('[+] Node Env Config: ' + envPath);
      if (process.platform === 'win32') {
          this.execSync(envPath);
      } else {
        syncSource(envPath);
      }
  } else {
    this.logError('[!] Cannot find Node Environment File: ' + envPath);
    return false;
  }

  if (this.isFile(settingsPath)) {
    this.logNotice('[+] Meteor Settings: ' + settingsPath);
    args = args.concat([
      '--settings',
      settingsPath
    ]);
  } else {
    this.logError('[!] Cannot find Meteor Settings File: ' + settingsPath);
    return false;
  }

  // remove run and any platforms
  var r = args.concat(_.without(process.argv.slice(2), 'run', args[0]));
  return this.invokeMeteorCommand('run', r);
});
