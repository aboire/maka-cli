var path = require('path');
var _ = require('underscore');

// --css=css|scss|less
// --js=js|coffee|ts|jsx
// --html=html|jade
// --client=blaze|react

// --skip-template-css=true|false
// --skip-template-js=true|false
// --skip-template-html=true|false

// --skip-route-template

Command.create({
  name: 'init',
  usage: 'maka init',
  description: 'Initialize your project structure.'
}, function (args, opts) {
  // the app name is either the first argument to the
  // generator or inferred from the current directory.
  // if no appname is provided, we assume we're already
  // in the project directory.
  var appName = args[0] || path.basename(process.cwd());
  var projectDirectory = args[0] || process.cwd();
  var orbitDirectory = path.join(projectDirectory, 'app', 'client');
  var isSelfTest = _.has(opts, 'self-test');

  var config = {
    engines: { // these are not boolean, only strings
      html: opts.html || 'html',
      js: opts.js || 'js',
      css: opts.css || 'css',
      api: opts.api || 'none',
      client: opts.client || 'react',
      test: opts.test || 'none',
      graphql: opts.graphql || 'none',
      theme: opts.theme || 'none',
      ssr: opts.ssr || 'false'
    },
    template: { // these are boolean
      html: !_.has(opts, 'skip-template-html') && !_.has(opts, 'skip-html'),
      js: !_.has(opts, 'skip-template-js') && !_.has(opts, 'skip-js'),
      css: !_.has(opts, 'skip-template-css') && !_.has(opts, 'skip-css'),
      test: !_.has(opts, 'skip-testing') && !_.has(opts, 'skip-tests')
    },
    features: { // these are strings
      withTracker: (!_.has(opts, 'skip-tracker')) ? 'true' : 'false'
    },
    route: {
      template: !_.has(opts, 'skip-route-template')
    },
    generator: {
      comments: !_.has(opts, 'skip-generator-comments')
    }
  };

  if (config.engines.api === 'graphql') {
    config.engines.graphql = 'apollo';
  }

  if (config.engines.client === 'react' || config.engines.client === 'reflux') {
    if (config.engines.js === 'ts') {
      config.engines.js = 'tsx';
    }

    if (config.engines.js === 'js') {
        config.engines.js = 'jsx';
    }

    config.template.html = 'false';
  } else {
    if (config.engines.js === 'tsx') {
      config.engines.js = 'ts';
    }

    if (config.engines.js === 'jsx') {
        config.engines.js = 'js';
    }
  }

  // SSR isn't supported on any client other than react.
  if (config.engines.ssr === 'true') {
    if (config.engines.client !== 'react' && config.engines.client !== 'reflux') {
      config.engines.ssr = 'false';
    }
  }

  if (config.engines.ssr === 'true') {
    config.template.css = false;
  }

  var context = {
    app: appName,
    config: config,
    appPath: process.cwd() + '/' + projectDirectory + '/app/'
  };


  var self = this;
  var ignore = [];
  // For ssr, we need to ignore a few templates.
  if (config.engines.ssr === 'true') {
    ignore = ['app/imports/startup/client/templates.js.jsx', 'app/imports/startup/client/routes.js.jsx', 'app/imports/startup/client/templates.js.tsx', 'app/imports/startup/client/routes.js.tsx' ];
  } else {
    ignore = ['app/imports/startup/lib/templates.js.jsx', 'app/imports/startup/lib/routes.js.jsx', 'app/imports/startup/lib/templates.js.tsx', 'app/imports/startup/lib/routes.js.tsx'];
  }

  if (config.engines.js !== 'ts' && config.engines.js !== 'tsx') {
    ignore.push('app/meteor.d.ts');
    ignore.push('app/tsconfig.json');
    //config.features.withTracker = 'false';
  }

  return CurrentConfig.withValue(config, function () {
    // copy the project template directory to the project directory
    self.copyTemplateDirectory('project', projectDirectory, context, ignore);

    // create an empty meteor project in the app folder
    self.createEmptyMeteorProject('app', {cwd: projectDirectory});

    var appDirectory = path.join(projectDirectory, 'app');

    // copy the meteor app folder template to our new app
    self.copyTemplateDirectory('app', appDirectory, context, ignore);

    // invoke the right generators for some default files
    Maka.findGenerator('template').invoke(['MasterLayout'], {cwd: projectDirectory, root: true, config, layout: true});
    Maka.findGenerator('route').invoke(['Home', '/'], {cwd: projectDirectory, root: true, config});
    Maka.findGenerator('template').invoke(['Home'], {cwd: projectDirectory, root: true, config});
    Maka.findGenerator('template').invoke(['NotFound'], {cwd: projectDirectory, root: true, config});
    // invoke npm install
    self.initNpm({cwd: appDirectory, isSelfTest: isSelfTest});

    if (!_.has(opts, 'skip-flow-router') && context.config.engines.client === 'blaze') {
      // install the flow router package
      // kadira:flow-router
      // kadira:blaze-layout
      self.installMeteorPackage('kadira:flow-router kadira:blaze-layout', {cwd: appDirectory, isSelfTest: isSelfTest});
    }

    // Security procedures
    self.removeMeteorPackage('autopublish insecure', {cwd: appDirectory, isSelfTest: isSelfTest});
    self.installMeteorPackage('check', {cwd: appDirectory, isSelfTest: isSelfTest});
    self.installMeteorPackage('ddp-rate-limiter', {cwd: appDirectory, isSelfTest: isSelfTest});
    self.installMeteorPackage('accounts-password alanning:roles', {cwd: appDirectory, isSelfTest: isSelfTest});

    if (config.engines.test === 'jasmine') {
      // install the jasmine driver package and html/console reporter and coverage
      self.installMeteorPackage('sanjo:jasmine maka:html-reporter velocity:console-reporter dburles:factory lmieulet:meteor-coverage', {cwd: appDirectory, isSelfTest: isSelfTest});
      self.installNpmPackage('enzyme sinon enzyme-adapter-react-16 chai', {cwd: appDirectory, isSelfTest: isSelfTest, dev: true});
      self.installNpmPackage('jquery', {cwd: appDirectory, isSelfTest: isSelfTest, dev: true});
    } else if (config.engines.test === 'mocha') {
      self.installMeteorPackage('jquery meteortesting:mocha meteortesting:mocha xolvio:cleaner hwillson:stub-collections practicalmeteor:chai dburles:factory velocity:meteor-stubs practicalmeteor:sinon', {cwd: appDirectory, isSelfTest: isSelfTest});
      self.installNpmPackage('nightmare phantomjs-prebuilt enzyme sinon enzyme-adapter-react-16 chai', {cwd: appDirectory, isSelfTest: isSelfTest, dev: true});
      self.installNpmPackage('jquery', {cwd: appDirectory, isSelfTest: isSelfTest, dev: true});
    }

    if (config.engines.api !== 'none') {

      if (config.engines.api === 'rest') {
        self.installMeteorPackage('maka:rest', {cwd: appDirectory, isSelfTest: isSelfTest});
      }

      if (config.engines.api === 'restivus') {

        if (!_.has(opts, 'skip-restivus') || !_.has(opts, 'maka-rest')) {
          // install the RESTful api package, restivus
          self.installMeteorPackage('accounts-password nimble:restivus', {cwd: appDirectory, isSelfTest: isSelfTest});
        }
      }

      if (config.engines.api === 'graphql') {
        config.engines.graphql = 'apollo';
      }
    }

    if (!_.has(opts, 'skip-validated-methods')) {
      self.installMeteorPackage('mdg:validated-method', {cwd: appDirectory, isSelfTest: isSelfTest});
    }

    if (config.template.css) {
      if (config.engines.css == 'scss')
        self.installMeteorPackage('fourseven:scss', {cwd: appDirectory, isSelfTest: isSelfTest});

      if (config.engines.css == 'less')
        self.installMeteorPackage('less', {cwd: appDirectory, isSelfTest: isSelfTest});
    }

    if (config.template.js) {
      if (config.engines.js == 'coffee')
        self.installMeteorPackage('coffeescript', {cwd: appDirectory, isSelfTest: isSelfTest});
    }

    if (config.template.html) {
      if (config.engines.html === 'jade')
        self.installMeteorPackage('mquandalle:jade', {cwd: appDirectory, isSelfTest: isSelfTest});
    }

    if (config.template.js) {
      if (config.engines.js === 'ts' || config.engines.js === 'tsx')
        self.installMeteorPackage('barbatus:typescript', {cwd: appDirectory, isSelfTest: isSelfTest});
        self.installNpmPackage('meteor-node-stubs', {cwd: appDirectory, isSelfTest: isSelfTest});
    }

    if (opts.orbit) {
      // copy the orbit directory
      self.copyTemplateDirectory('orbit', orbitDirectory, context);
      // install rainhaven:orbit
      self.installMeteorPackage('scottmcpherson:orbit', {cwd: appDirectory, isSelfTest: isSelfTest});
    }

    if ('js' in opts && opts['js'].toLowerCase() === 'es6') {
      // install the Babel package for Meteor.
      self.installMeteorPackage('grigio:babel', {cwd: appDirectory, isSelfTest: isSelfTest});
    }

    self.installNpmPackage('@babel/runtime@latest', {cwd: appDirectory, isSelfTest: isSelfTest});
    self.installNpmPackage('bcrypt', {cwd: appDirectory, isSelfTest: isSelfTest});

    // install react and react router if using...react.
    if (config.engines.client === 'react' || config.engines.client === 'reflux') {
      if (config.features.withTracker !== 'false') {
        self.installMeteorPackage('react-meteor-data', {cwd: appDirectory, isSelfTest: isSelfTest});
      }
      // Because Enzyme needs a stable version of react to keep up with, we're currently clamping React at version:
      // @16.4.0
      if (config.engines.test !== 'none') {
        self.installNpmPackage('react@16.4.0', {cwd: appDirectory, isSelfTest: isSelfTest});
        self.installNpmPackage('react-dom@16.4.0', {cwd: appDirectory, isSelfTest: isSelfTest});
        self.installNpmPackage('react-test-renderer@16.4.0', {cwd: appDirectory, isSelfTest: isSelfTest});
      } else {
        self.installNpmPackage('react', {cwd: appDirectory, isSelfTest: isSelfTest});
        self.installNpmPackage('react-dom', {cwd: appDirectory, isSelfTest: isSelfTest});
        self.installNpmPackage('react-test-renderer', {cwd: appDirectory, isSelfTest: isSelfTest});
      }

      self.installNpmPackage('react-router@3.2.1', {cwd: appDirectory, isSelfTest: isSelfTest});
      self.installNpmPackage('react-addons-pure-render-mixin', {cwd: appDirectory, isSelfTest: isSelfTest});
      self.installNpmPackage('prop-types', {cwd: appDirectory, isSelfTest: isSelfTest});
      self.installNpmPackage('babel-plugin-transform-decorators-legacy', {cwd: appDirectory, isSelfTest: isSelfTest});
    }

    if (config.engines.client === 'reflux') {
      self.installNpmPackage('reflux', {cwd: appDirectory, isSelfTest: isSelfTest});
    }

    if (config.engines.graphql === 'apollo') {
      self.installMeteorPackage('apollo', {cwd: appDirectory, isSelfTest: isSelfTest});
      self.installNpmPackage('apollo-boost', {cwd: appDirectory, isSelfTest: isSelfTest});
      self.installNpmPackage('apollo-cache-inmemory', {cwd: appDirectory, isSelfTest: isSelfTest});
      self.installNpmPackage('apollo-client', {cwd: appDirectory, isSelfTest: isSelfTest});
      self.installNpmPackage('apollo-link', {cwd: appDirectory, isSelfTest: isSelfTest});
      self.installNpmPackage('apollo-link-http', {cwd: appDirectory, isSelfTest: isSelfTest});
      self.installNpmPackage('apollo-server-express', {cwd: appDirectory, isSelfTest: isSelfTest});
      self.installNpmPackage('express', {cwd: appDirectory, isSelfTest: isSelfTest});
      self.installNpmPackage('body-parser', {cwd: appDirectory, isSelfTest: isSelfTest});
      self.installNpmPackage('graphql', {cwd: appDirectory, isSelfTest: isSelfTest});
      self.installNpmPackage('merge-graphql-schemas', {cwd: appDirectory, isSelfTest: isSelfTest});
      self.installNpmPackage('react-apollo', {cwd: appDirectory, isSelfTest: isSelfTest});
    }

    if (config.engines.theme === 'material') {
      self.installNpmPackage('material-ui@1.0.0-beta.36', {cwd: appDirectory, isSelfTest: isSelfTest});
      self.installNpmPackage('material-ui-icons@1.0.0-beta.36', {cwd: appDirectory, isSelfTest: isSelfTest});
      self.installNpmPackage('typeface-roboto', {cwd: appDirectory, isSelfTest: isSelfTest});
    }

    if (config.engines.ssr === 'true') {
      self.installMeteorPackage('server-render', {cwd: appDirectory, isSelfTest: isSelfTest});
      self.installNpmPackage('react-router-dom', {cwd: appDirectory, isSelfTest: isSelfTest});
      self.installNpmPackage('styled-components', {cwd: appDirectory, isSelfTest: isSelfTest});
      self.installNpmPackage('history@3.3.0', {cwd: appDirectory, isSelfTest: isSelfTest});
    }

    // if (config.engines.ssr === 'true' || config.engines.client === 'react' || config.engines.client === 'reflux') {
    if (config.engines.test === 'jasmine' || config.engines.ssr === 'true' || config.engines.client === 'react' || config.engines.client === 'reflux') {
      self.removeMeteorPackage('blaze-html-templates', {cwd: appDirectory, isSelfTest: isSelfTest});
      self.installMeteorPackage('static-html', {cwd: appDirectory, isSelfTest: isSelfTest});
    }

    if (config.engines.ssr === 'true' && config.engines.theme === 'material') {
      self.installNpmPackage('jss', {cwd: appDirectory, isSelfTest: isSelfTest});
      self.installNpmPackage('react-jss', {cwd: appDirectory, isSelfTest: isSelfTest});
      self.installNpmPackage('jss-preset-default', {cwd: appDirectory, isSelfTest: isSelfTest});
    }

    self.logSuccess('Created ' + appName + '!');
    return true;
  });
});
