var path = require('path');
var fs = require('fs');
var spawn = require('child_process').spawn;
var source = require('shell-source');
var Future = require('fibers/future');

var syncSource = function (filepath) {
  var future = new Future;
  source(filepath, future.resolver());
  return future.wait();
};

Command.create({
  name: 'debug',
  usage: 'maka debug',
  description: 'Debug your app for a given environment.',
  examples: [
    'maka debug --env prod',
    'maka debug --env dev',
  ]
}, function (args, opts) {
  var appEnv = opts.env || process.env.NODE_ENV || 'development';
  if (opts.help)
    throw new Command.UsageError;

  if (!this.findProjectDirectory())
    throw new Command.MustBeInProjectError;

  var destinationKey = appEnv;
  if(destinationKey === 'dev') {
    destinationKey = 'development';
  } else if (destinationKey === 'prod') {
    destinationKey = 'production';
  }

  var configPath = this.pathFromProject('config', destinationKey);
  var settingsPath = path.join(configPath, 'settings.json');

  // source the env file into the process environment

  if (this.isFile(settingsPath)) {
    args = args.concat([
      '--settings',
      settingsPath
    ]);
  }

  return this.invokeMeteorCommand('debug', args.concat(process.argv.slice(3)));
});
