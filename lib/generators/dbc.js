var path = require('path');

var DbcGenerator = Generator.create({
  name: 'dbc',
  aliases: ['dbc'],
  usage: 'maka {generate, g}:{dbc} <connection-name> --type= pgsql | mssql | sqlite',
  description: 'Generate scaffolding for a database connection.',
  examples: [
    'maka g:dbc geoserver --type=pgsql'
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

  var validDbc = ['mssql', 'pgsql', 'sqlite'];

  if (validDbc.indexOf(context.type) < 0) {
    var type = (context.type) ? context.type : '(blank)';
    this.logError('[!] Invalid type ' + type + ', you must provide a valid type as an argument.  Usage:');
    this.logUsage();
    return;
  }

  if (opts.type === 'pgsql' && !this.checkNpmPackage('pg')) {
    this.logWarn('[!] Npm package "pg" not installed, installing...');
    this.installNpmPackage('pg', {cwd: appDirectory});
  }

  if (opts.type === 'mssql' && !this.checkNpmPackage('mssql')) {
    this.logWarn('[!] Npm package "mssql" not installed, installing...');
    this.installNpmPackage('mssql', {cwd: appDirectory});
  }

  if (opts.type === 'sqlite' && !this.checkNpmPackage('better-sqlite3')) {
    this.logWarn('[!] Npm package "better-sqlite3" not installed, installing...');
    this.installNpmPackage('better-sqlite3', {cwd: appDirectory});
  }
  

  this.template(
    'dbc/config.js',
    this.pathFromApp('imports/startup/server/dbc/', opts.dir, this.fileCase(opts.resourceName), 'config.' + config.engines.js),
    context
  );
  this.template(
    'dbc/conn.js',
    this.pathFromApp('imports/startup/server/dbc/', opts.dir, this.fileCase(opts.resourceName), 'conn.' + config.engines.js),
    context
  );


  this.template(
    'dbc/register-dbc.js',
    this.pathFromApp('imports/startup/server', 'register-' + this.fileCase(opts.resourceName) + '-dbc.' + config.engines.js),
    context
  );

  var destPath = this.pathFromApp('imports/startup/server/index.' + config.engines.js);
  this.injectAtEndOfFile(destPath, 'import \'./register-' + this.fileCase(opts.resourceName) + '-dbc.' + config.engines.js + '\';');
});
