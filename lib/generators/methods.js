var path = require('path');

var MethodGenerator = Generator.create({
  name: 'method',
  aliases: ['m'],
  usage: 'maka {generate, g}:{method, m} name [--where]',
  description: 'Generate scaffolding for a Method.',
  examples: [
    'maka g:method todos --where "server"'
  ]
}, function (args, opts) {
  var config = CurrentConfig.get();

  var context = {
    name: this.classCase(opts.resourceName),
    fileName: this.fileCase(opts.resourceName),
    camelCase: this.camelCase(opts.resourceName),
    where: opts.where
  };

  // todo: logic to either create a file or append a method

  this.template(
    'method/method.js',
    this.pathFromApp('imports/startup', opts.appPathPrefix, 'methods', opts.dir, this.fileCase(opts.resourceName) + '-rpc-method' + '.' + config.engines.js),
    context
  );

  var destPath = this.pathFromApp('imports/startup', opts.appPathPrefix, 'index.' + config.engines.js);
  this.injectAtEndOfFile(destPath, '\nimport \'./methods/' + opts.dir + '/' + this.fileCase(opts.resourceName) + '-rpc-method' + '.' + config.engines.js + '\';');

  // just in to be sure we get the import file working
  this.createFile(this.pathFromApp('lib/main.' + config.engines.js), 'import \'/imports/startup/lib\';', {ignore: true});
});
