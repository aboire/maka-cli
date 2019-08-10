var path = require('path');
var fs = require('fs');
var _ = require('underscore');

var SSH_COMMAND_DESCRIPTION = 'Connect to your deployment server.\n\n';

Command.create({
  name: 'ssh',
  usage: 'maka ssh <environment>',
  description: SSH_COMMAND_DESCRIPTION,
  examples: [
    'maka ssh dev',
    'maka ssh staging',
    'maka ssh prod',
  ]
}, function (args, opts) {
  try {

    var cmd = '';
    if (typeof opts._[1] === 'string') {
      cmd = opts._[1];
    }

    var destinationKey = args[0];
    switch (args[0]) {
      case 'dev' || 'development':
        destinationKey = 'development';
        break;
      case 'staging':
        destinationKey = 'staging';
        break;
      case 'prod' || 'production':
        destinationKey = 'production';
        break;
      default:
        destinationKey = 'development';
        break;
    }

    var destination = 'config/' + destinationKey;
    var cwd = path.join(this.pathFromProject(), destination);

    var pathToConfig = cwd + '/ssh.json';
    var sshConfig = fs.readFileSync(pathToConfig);
    var sshOpts = JSON.parse(sshConfig);

    this.ssh(sshOpts, cmd);

  } catch (err) {

    console.log(err);
  }
});
