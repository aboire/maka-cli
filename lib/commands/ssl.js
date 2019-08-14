var path = require('path');
var fs = require('fs');
var _ = require('underscore');

var SSH_COMMAND_DESCRIPTION = 'Create and manage your SSL operations.\n\n';

Command.create({
  name: 'ssl',
  usage: 'maka ssl --env <env> [command]',
  description: SSH_COMMAND_DESCRIPTION,
  examples: [
    'maka ssl --env dev generate-csr',
    'maka ssl --env dev generate-ssc // Self-Signed Certificate'
  ]
}, function (args, opts) {
  var self = this;
  var config = CurrentConfig.withConfigFile(function() {
    return this.CurrentConfig.get();
  });
  
  if (opts.help)
    throw new Command.UsageError;

  if (!opts.env)
    throw new Command.UsageError;

  var env = this.checkConfigExists(opts.env);
  var keyDir = env + '/_keys/';

  if (args) {
    cmd = args[0];
  }
  try {
    if (cmd === 'generate-csr') {
      this.genCSR({ keyName: keyDir + config.appName + '.key', csrName: keyDir + config.appName + '.csr' });

    } else if (cmd === 'generate-ssc') {
      try {
        fs.statSync(keyDir + config.appName + '.key');
        fs.statSync(keyDir + config.appName + '.csr');
      } catch (e) {
        throw '[-] Either the KEY or CSR file are missing from: ' + keyDir;
      }
      this.genSSC({ keyName: keyDir + config.appName + '.key', crtName: keyDir + config.appName + '.crt' });

    } else {
      throw new Command.UsageError;
    }
  } catch (e) {
    this.logError(e);
  }
});
