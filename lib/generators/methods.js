var path = require('path');

var MethodGenerator = Generator.create({
  name: 'method',
  aliases: ['m'],
  usage: 'maka {generate, g}:{method, m} name',
  description: 'Generate scaffolding for a Method.',
  examples: [
    'maka g:method todos'
  ]
}, function (args, opts) {
  var config = CurrentConfig.get();

  var context = {
    name: this.classCase(opts.resourceName),
    fileName: this.fileCase(opts.resourceName),
    camelCase: this.camelCase(opts.resourceName),
  };
  var appDirectory = this.pathFromApp();

  if (!this.checkMeteorPackage('check') || !this.checkMeteorPackage('ddp-rate-limiter') || !this.checkMeteorPackage('mdg:validated-method')) {
    this.logWarn('[!] Meteor package "check" or "ddp-rate-limiter" or "mdg:validated-method" is not installed, installing...');
    this.installMeteorPackage('check ddp-rate-limiter mdg:validated-method', {cwd: appDirectory});
  }

  // todo: logic to either create a file or append a method

  this.template(
    'method/method.js',
    this.pathFromApp('imports/startup/server/methods', opts.dir, this.fileCase(opts.resourceName) + '-rpc-method' + '.' + config.engines.js),
    context
  );

  var destPath = this.pathFromApp('imports/startup/server/index.' + config.engines.js);
  this.injectAtEndOfFile(destPath, '\nimport \'./methods/' + opts.dir + '/' + this.fileCase(opts.resourceName) + '-rpc-method' + '.' + config.engines.js + '\';');

  // just in to be sure we get the import file working
  this.createFile(this.pathFromApp('server/main.' + config.engines.js), 'import \'/imports/startup/server\';', {ignore: true});
});
