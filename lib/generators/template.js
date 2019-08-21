var path = require('path');
var _ = require('underscore');
var slash = require('slash');

Generator.create({
  name: 'template',
  aliases: ['t'],
  usage: 'maka {generate, g}:{template, t} [path/]<name> [--component] [--layout] [--store]',
  description: 'Generate scaffolding for a template.',
  examples: [
    'maka g:template todos/todos-item'
  ]
}, function(args, opts) {

  var projectPath = 'imports/ui/pages';

  if (opts.component) {
    projectPath = 'imports/ui/components';
  }

  if (opts.layout) {
    projectPath = 'imports/ui/layouts';
  }

  if (opts.store) {
    projectPath = 'imports/ui/stores';
  }

  if(opts.layout && opts.component) {
    this.logError("A template can not be a component and a layout at the same time.");
    throw new Command.UsageError();
  }

  var pathToTemplate = this.pathFromApp(
    projectPath,
    opts.dir,
    this.fileCase(opts.resourceName),
    this.fileCase(opts.resourceName)
  );

  var config = (opts.config) ? opts.config : CurrentConfig.get();

  if (typeof(config.template.html) === 'string') {
      config.template.html = (config.template.html === 'true') ? true : false;
  }

  if (typeof(config.template.test) === 'string') {
      config.template.test = (config.template.test === 'true') ? true : false;
  }

  if (typeof(config.template.css) === 'string') {
      config.template.css = (config.template.css === 'true') ? true : false;
  }

  if (!config.features) {
    config.features = {};
  }

  var context = {
    name: this.fullCamelCase(opts.resourceName),
    myPath: path.relative(this.pathFromProject(), pathToTemplate),
    cssCaseName: this.cssCase(opts.resourceName),
    className: this.classCase(opts.resourceName),
    camelCaseName: this.camelCase(opts.resourceName),
    fileName: this.fileCase(opts.resourceName),
    graphql: config.engines.graphql,
    features: config.features,
    client: config.engines.client,
    api: config.engines.api,
    ssr: config.engines.ssr,
    isStore: _.has(opts, 'store'),
    isComponent: _.has(opts, 'component'),
    isLayout: _.has(opts, 'layout'),
    test: config.engines.test,
  };

  if (opts.layout) {
      if (config.template.html) {
          this.template(
              'layout/layout.html',
              pathToTemplate + '.html',
              context
          );
      }

      if (config.template.css) {
        this.template(
          'layout/layout.css',
          pathToTemplate + '.css',
          _.extend({}, context, { className: this.cssCase(opts.resourceName) })
        );
      }

      this.template(
          'layout/layout.js',
          pathToTemplate + '.js',
          context
      );
  } else {
      if (config.template.html) {
          this.template(
              'template/template.html',
              pathToTemplate + '.html',
              context
          );
      }

      if (config.template.css) {
        this.template(
          'template/template.css',
          pathToTemplate + '.css',
          _.extend({}, context, { className: this.cssCase(opts.resourceName) })
        );
      }

      this.template(
        'template/template.js',
        pathToTemplate + '.js',
        context
      );

      if (config.engines.test !== 'none' && !opts.layout && !opts.store) {
          this.template(
              'template/template-tests.js',
              pathToTemplate + '.tests.js',
              context
          );
      }
  }
  // Import the HTML and CSS
  if (config.engines.client !== 'react' && config.engines.client !== 'reflux' && config.engines.client !== 'vanilla') {
      if (config.template.css) {
          this.injectAtBeginningOfFile(
              pathToTemplate + "." + config.engines.js,
              "import './" + this.fileCase(opts.resourceName) + "." + config.engines.html + "';\n" +
              "import './" + this.fileCase(opts.resourceName) + "." + config.engines.css + "';"
          );

      }

      if (!config.template.css) {
          this.injectAtBeginningOfFile(
              pathToTemplate + "." + config.engines.js,
              "import './" + this.fileCase(opts.resourceName) + "." + config.engines.html + "';"
          );
      }

  } else {
      if (config.template.css && !opts.store) {
        this.injectAtBeginningOfFile(
          pathToTemplate + "." + config.engines.js,
          "import './" + this.fileCase(opts.resourceName) + "." + config.engines.css + "';"
        );
      }
  }

  // Import the template in the templates.js file
  var appPathToTemplate = path.join(
    '/',
    projectPath,
    opts.dir,
    this.fileCase(opts.resourceName),
    this.fileCase(opts.resourceName)
  );

  // Add the template to templates.js
  var templateJSPath;
  if (config.engines.ssr === 'true') {
      templateJSPath = this.rewriteDestinationPathForEngine(this.pathFromApp('imports/startup/lib/templates.js'));
  } else {
      templateJSPath = this.rewriteDestinationPathForEngine(this.pathFromApp('imports/startup/client/templates.js'));
  }

  if (config.engines.client === 'react' || config.engines.client === 'reflux') {
    if (config.engines.js === 'tsx') {
      this.injectAtBeginningOfFile(
        templateJSPath,
        "import { "+  context.className + " } from '" + slash(appPathToTemplate) + "';\n"
      );
    } else {
      this.injectAtBeginningOfFile(
        templateJSPath,
        "import { " + context.className + " } from '" + slash(appPathToTemplate) + "." + config.engines.js + "';\n"
      );
    }
    this.injectAtEndOfFile(
      templateJSPath,
      "export { " + context.className + " };\n"
    );

  } else {
      this.injectAtEndOfFile(
          templateJSPath,
          "import '" + slash(appPathToTemplate) + "." + config.engines.js + "';\n"
      );
  }

});

