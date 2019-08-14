var path = require('path');
var Future = require('fibers/future');
var _ = require('underscore');
var fs = require('fs');

Command.create({
  name: 'deploy',
  usage: 'maka deploy [--env] [--ssl]',
  description: 'Deploy your app to a server.'
}, function (args, opts) {
  if (opts.help)
    throw new Command.UsageError;

  if (!opts.env)
    throw new Command.UsageError;

  if (!this.findProjectDirectory())
    throw new Command.MustBeInProjectError;

  try {
    var configPath = this.checkConfigExists(opts.env);

    var sshConfig = JSON.parse(fs.readFileSync(configPath + '/ssh.json'));
    console.log(sshConfig);


    // remove deploy and any platforms
    //var r = args.concat(_.without(process.argv.slice(2), 'deploy', args[0]));
    //return this.invokeMeteorCommand('deploy', r);
  } catch (e) {
    this.logError(e);
  }
});
