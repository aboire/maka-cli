var path = require('path');

var ServiceGenerator = Generator.create({
  name: 'configuration',
  aliases: ['config'],
  usage: 'maka {generate, g}:{config} <name> --ssl',
  description: 'Generate configuration settings.',
  examples: [
    'maka g:config production'
  ]
}, function (args, opts) {
  var config = CurrentConfig.get();
  var appDirectory = this.pathFromApp();

  if (opts.help)
    throw new Command.UsageError;

  var context = {
    app: config.appName,
    name: this.classCase(opts.resourceName),
    fileName: this.fileCase(opts.resourceName),
    camelCase: this.camelCase(opts.resourceName),
    userName: 'ubuntu' // TODO: Break this out based on type of deployment.
  };

  var destinationKey = args[0];
  if(destinationKey === 'dev') {
    destinationKey = 'development';
  } else if (destinationKey === 'prod') {
    destinationKey = 'production';
  }

  this.template(
    'config/ssh.json',
    this.pathFromApp('../config/', destinationKey, '/ssh.json'),
    context
  );

  this.template(
    'config/pm2.config.js',
    this.pathFromApp('../config/', destinationKey, '/pm2.config.js'),
    context
  );

  this.template(
    'config/settings.json',
    this.pathFromApp('../config/', destinationKey, '/settings.json'),
    context
  );

  if (opts.ssl) {
    this.template(
      'config/nginx.ssl.conf',
      this.pathFromApp('../config/', destinationKey, '/nginx.ssl.conf'),
      context
    );
  } else {
    this.template(
      'config/nginx.default.conf',
      this.pathFromApp('../config/', destinationKey, '/nginx.default.conf'),
      context
    );
  }
});
