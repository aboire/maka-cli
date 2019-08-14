var path = require('path');
var fs = require('fs');
var _ = require('underscore');

var SSH_COMMAND_DESCRIPTION = 'Connect to your server.\n\n';

Command.create({
  name: 'ssh',
  usage: 'maka ssl --env <env> [command]',
  description: SSH_COMMAND_DESCRIPTION,
  examples: [
    'maka ssh --env dev',
    'maka ssh --env staging',
    'maka ssh --env prod',
    'maka ssh --env prod "ls -la"',
    'maka ssh --env prod "pm2 status'
  ]
}, function (args, opts) {
  if (opts.help)
    throw new Command.UsageError;

  if (!opts.env)
    throw new Command.UsageError;

  var env = this.checkConfigExists(opts.env);

  if (args) {
    cmd = args[0];
  }

  var pathToConfig = env + '/ssh.json';
  var sshConfig = fs.readFileSync(pathToConfig);
  var sshOpts = JSON.parse(sshConfig);
  Object.assign(sshOpts, { env });

  this.ssh(sshOpts, cmd);
});
