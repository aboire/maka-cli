var path = require('path');
var _ = require('underscore');

Generator.create({
  name: 'package',
  aliases: ['p'],
  usage: 'maka {generate, g}:{package, p} [path/]<name>',
  description: 'Generate scaffolding for a Package.',
  examples: [
    'maka g:package todos:package'
  ]
}, function (args, opts) {

  var file = this.cssCase(opts.resourceName);

  var pathToTemplate = this.pathFromApp('packages', opts.dir, file);

  var pathFromApp = this.pathFromAppWithNoReWrite('packages', opts.dir, file, 'package.js');

  var config = (opts.config) ? opts.config : CurrentConfig.get();

  var context = {
    name: opts.resourceName,
    myPath: path.relative(this.pathFromProject(), pathToTemplate),
    cssCaseName: this.cssCase(opts.resourceName),
    className: this.classCase(opts.resourceName),
    camelCaseName: this.camelCase(opts.resourceName),
    fileName: file,
    client: config.engines.client,
    graphql: config.engines.graphql,
    ssr: config.engines.ssr,
    isComponent: _.has(opts, 'component'),
    isLayout: _.has(opts, 'layout'),
    isStore: _.has(opts, 'store'),
    features: config.features,    
  };

  context.noRename = true;

  this.template(
    'package/package.js',
    pathFromApp,
    context
  );

  context.noRename = false;

  var clientPackageFile = pathToTemplate + '/client/' + file + '.js';
  this.template(
      'template/template.js',
      clientPackageFile,
      context
  );

  var that = this;
  _.each(['lib', 'server', 'tests/client', 'tests/server'], function(folder) {
    var packageFile = pathToTemplate + '/' + folder + '/' + file + '.js';
    that.template(
      'package/' + folder + '/package.js',
      packageFile,
      context
    );
  });

});
