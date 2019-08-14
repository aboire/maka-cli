var path = require('path');
var fs = require('fs');
var _ = require('underscore');

var SSH_COMMAND_DESCRIPTION = 'Connect to your server.\n\n';

Command.create({
  name: 'ssh',
  usage: 'maka ssh [command] --env <env>',
  description: SSH_COMMAND_DESCRIPTION,
  examples: [
    'maka ssh --env dev',
    'maka ssh --env staging',
    'maka ssh --env prod',
    'maka ssh ls --env prod',
  ]
}, function (args, opts) {
  if (opts.help)
    throw new Command.UsageError;

  if (!opts.env)
    throw new Command.UsageError;

  var cwd = this.checkConfigExists(opts.env);

  var pathToConfig = cwd + '/ssh.json';
  var sshConfig = fs.readFileSync(pathToConfig);
  var sshOpts = JSON.parse(sshConfig);
  Object.assign(sshOpts, { env: opts.env });

  this.ssh(sshOpts, cmd);
});
