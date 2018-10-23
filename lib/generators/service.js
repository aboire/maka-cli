var path = require('path');

var ServiceGenerator = Generator.create({
  name: 'service',
  aliases: ['s'],
  usage: 'maka {generate, g}:{service} <service-name> --type=logger',
  description: 'Generate service to run alongside your meteor application.',
  examples: [
    'maka g:s --type=logger'
  ]
}, function (args, opts) {
  var config = CurrentConfig.get();
  var appDirectory = this.pathFromApp();

  var context = {
    name: this.classCase(opts.resourceName),
    fileName: this.fileCase(opts.resourceName),
    camelCase: this.camelCase(opts.resourceName),
    type: opts.type,
    engine: config.engines.js,
  };

  var validService = ['logger'];

  if (validService.indexOf(context.type) < 0) {
    var type = (context.type) ? context.type : '(blank)';
    this.logError('[!] Invalid type ' + type + ', you must provide a valid type as an argument.  Usage:');
    this.logUsage();
    return;
  }

  // START LOGGER SERVICE CONFIGURATION

  if (opts.type === 'logger' && !this.checkNpmPackage('winston')) {
    this.logWarn('[!] Npm package "winston" not installed, installing...');
    this.installNpmPackage('winston winston-transport setimmediate', {cwd: appDirectory});
  }

  // Create the logs collection on the server.
  Maka.findGenerator('collection').invoke(['logs'], {_: ['g:s', 'logger'], where: 'both', appPathPrefix: 'lib', dir: ''});

  this.template(
    'service/logger/logger.js',
    this.pathFromApp('imports/startup/lib/services/logger.' + config.engines.js),
    context
  );

  var loggerDestPath = this.rewriteDestinationPathForEngine(this.pathFromApp('imports/startup/lib/services/logger.' + config.engines.js));
  this.injectAtBeginningOfFile(loggerDestPath, "import { MongoTransport } from '" +  this.rewriteDestinationPathForEngine('/imports/startup/lib/services/logger-transports') + "';");

  this.template(
    'service/logger/transports.js',
    this.pathFromApp('imports/startup/lib/services/logger-transports.' + config.engines.js),
    context
  );

  var transportsDestPath = this.rewriteDestinationPathForEngine(this.pathFromApp('imports/startup/lib/services/logger-transports.' + config.engines.js));
  this.injectAtBeginningOfFile(transportsDestPath, "import Logs from '" +  this.rewriteDestinationPathForEngine('/imports/startup/lib/collections/logs') + "';");

  // END LOGGER SERVICE CONFIGURATION

});
