var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var Future = require('fibers/future');
var path = require('path');
var fs = require('fs');
var _ = require('underscore');
var del = require('delete');
var spawnargs = require('spawn-args');

module.exports = {};

/**
 * Creates an empty meteor project with the given name
 * at the given opts.cwd.
 */
module.exports.createEmptyMeteorProject = function createEmptyMeteorProject(name, opts) {
  opts = opts || {};
  opts.cwd = opts.cwd || '.';

  var appPath = path.join(opts.cwd, name);
  var meteorPath = path.join(appPath, '.meteor');

  // only do this if a meteor project doesn't already exist at
  // the given location.
  if (this.isDirectory(meteorPath)) {
    this.logWarn('Meteor project already exists at ' + JSON.stringify(appPath));
    return false;
  }

  var spinHandle;

  try {
    spinHandle = this.logWithSpinner('Creating project ', name);
    var appDirectory = path.join(opts.cwd, name);
    this.execSync('meteor create ' + name, {cwd: opts.cwd, silent: true});
    _.each(fs.readdirSync(appDirectory), function (entryPath) {
      if (entryPath === '.git') return;
      if (entryPath === '.meteor') return;
      // depreciate fs and use del instead.
      //fs.unlinkSync(path.join(appDirectory, entryPath));
      del.sync(path.join(appDirectory, entryPath));
    });
 } finally {
    // stop the spinny thing
    spinHandle.stop();
  }

  // if we got this far we're good to go
  this.logSuccess('Meteor app created');
  return true;
};

/**
 * Installs a meteor package in the app directory for the project. It doesn't
 * matter where the cwd directory is, as long as you're in an maka project
 * and there's an app folder. If the app folder isn't a meteor project the
 * meteor cli will throw an error.
 */
module.exports.installMeteorPackage = function installMeteorPackage(pkg, opts) {
  opts = opts || {};
  opts.cwd = opts.cwd || '.';

  // If this is a self test, no need to actually install anything.
  if (opts.isSelfTest) {
      return;
  }
  
  var appDirectory = this.findAppDirectory(opts.cwd);

  if (!appDirectory) {
    this.logError("Couldn't find an app directory to install " + JSON.stringify(pkg) + " into.");
    return false;
  }

  var spinHandle = this.logWithSpinner('Installing the package ', pkg);

  try {
    this.execSync('meteor add ' + pkg, {cwd: appDirectory});
  } finally {
    spinHandle.stop();
  }

  this.logSuccess('\u2714', pkg);
};


/**
 * Uninstalls a meteor package in the app directory for the project. It doesn't
 * matter where the cwd directory is, as long as you're in an maka project
 * and there's an app folder. If the app folder isn't a meteor project the
 * meteor cli will throw an error.
 */
module.exports.removeMeteorPackage = function installMeteorPackage(pkg, opts) {
  opts = opts || {};
  opts.cwd = opts.cwd || '.';

  // If this is a self test, no need to actually install anything.
  if (opts.isSelfTest) {
      return;
  }
  
  var appDirectory = this.findAppDirectory(opts.cwd);

  if (!appDirectory) {
    this.logError("Couldn't find an app directory to install " + JSON.stringify(pkg) + " into.");
    return false;
  }

  var spinHandle = this.logWithSpinner('Removing the package ', pkg);

  try {
    this.execSync('meteor remove ' + pkg, {cwd: appDirectory});
  } finally {
    spinHandle.stop();
  }

  this.logSuccess('\u2714', pkg);
};

/**
 * Installs a npm package in the app directory for the project. It doesn't
 * matter where the cwd directory is, as long as you're in an maka project
 * and there's an app folder. If the app folder isn't a meteor project the
 * meteor cli will throw an error.
 */
module.exports.initNpm = function initNpm(opts) {
  opts = opts || {};
  opts.cwd = opts.cwd || '.';

  // If this is a self test, no need to actually install anything.
  if (opts.isSelfTest) {
      return;
  }

  var appDirectory = this.findAppDirectory(opts.cwd);

  if (!appDirectory) {
    this.logError("Couldn't find an app directory to install " + JSON.stringify(pkg) + " into.");
    return false;
  }

  var spinHandle = this.logWithSpinner('Calling down the npm init thunder ... ', 'init');

  try {
    this.execSync('npm init -f ', {cwd: appDirectory});
  } finally {
    spinHandle.stop();
  }

  this.logSuccess('\u2714', 'init');
};


/**
 * Installs a npm package in the app directory for the project. It doesn't
 * matter where the cwd directory is, as long as you're in an maka project
 * and there's an app folder. If the app folder isn't a meteor project the
 * meteor cli will throw an error.
 */
module.exports.installNpmPackage = function installNpmPackage(pkg, opts) {
  opts = opts || {};
  opts.cwd = opts.cwd || '.';

  // If this is a self test, no need to actually install anything.
  if (opts.isSelfTest) {
      return;
  }

  var appDirectory = this.findAppDirectory(opts.cwd);

  if (!appDirectory) {
    this.logError("Couldn't find an app directory to install " + JSON.stringify(pkg) + " into.");
    return false;
  }

  var spinHandle = this.logWithSpinner('Installing the npm package ', pkg);

  try {
    if (opts.dev) {
      this.execSync('maka npm i --save-dev -q ' + pkg, {cwd: appDirectory});
    } else {
      this.execSync('maka npm i --save -q ' + pkg, {cwd: appDirectory});
    }
  } finally {
    spinHandle.stop();
  }

  this.logSuccess('\u2714', pkg);
};

/**
 * run npm install on a newly cloned or node_module-less project
 */
module.exports.setupNpm = function setupNpm(opts) {
  var appDirectory = this.findAppDirectory(opts.cwd);

  if (!appDirectory) {
    this.logError("Couldn't find an app directory to install " + JSON.stringify(pkg) + " into.");
    return false;
  }

  this.logWarn('[!] Cannot find your node_modules folder.  Reinstalling npm deps.');
  var spinHandle = this.logWithSpinner('Installing npm packages');

  try {
      this.execSync('meteor npm install', {cwd: appDirectory});
  } finally {
    spinHandle.stop();
  }

  this.logSuccess('\u2714', 'Node modules setup!');
};


/**
 * Checks the presence of a npm package.
 */
module.exports.checkNpmPackage = function checkNpmPackage(pkg, opts) {
  opts = opts || {};
  opts.cwd = opts.cwd || '.';

  // If this is a self test, no need to actually install anything.
  if (opts.isSelfTest) {
      return;
  }

  var appDirectory = this.pathFromApp(opts.cwd);

  if (!appDirectory) {
    this.logError("Couldn't find an app directory to install " + JSON.stringify(pkg) + " into.");
    return false;
  }

  var packageJSON = JSON.parse(fs.readFileSync(appDirectory + '/package.json'));

  return (packageJSON.dependencies[pkg]) ? true : false;

};

/**
 * Checks the presence of a meteor package.
 */
module.exports.checkMeteorPackage = function checkMeteorPackage(pkg, opts) {
  opts = opts || {};
  opts.cwd = opts.cwd || '.';

  // If this is a self test, no need to actually install anything.
  if (opts.isSelfTest) {
      return;
  }

  var appDirectory = this.pathFromApp(opts.cwd);

  if (!appDirectory) {
    this.logError("Couldn't find an app directory to install " + JSON.stringify(pkg) + " into.");
    return false;
  }

  var lines = require('fs').readFileSync(appDirectory + '/.meteor/packages', 'utf-8')
    .split('\n')
    .filter(Boolean);

  var packageExists = false;
  for (var i=0; i < lines.length; i++) {
    if (lines[i] === pkg) {
      packageExists = true;
    }
  }

  return packageExists;

};


/**
 * Returns true if a package has been installed.
 */
module.exports.hasMeteorPackage = function hasMeteorPackage(pkg, opts) {
  var self = this;
  var packageFilePath = this.appPathFor(path.join('.meteor', 'packages'), opts);

  // if this happens we didn't find a meteor
  // directory
  if (!packageFilePath)
    return false;

  var packageLines = this.getLines(packageFilePath);
  var packages = [];
  _.each(packageLines, function (line) {
    line = self.trimLine(line);
    if (line !== '')
      packages.push(line);
  });

  return ~packages.indexOf(name);
};

/**
 * Proxy valid meteor commands to the meteor command line tool. The meteor
 * command will be run inside the app directory.
 */
module.exports.maybeProxyCommandToMeteor = function maybeProxyCommandToMeteor() {
  var validMeteorCommands = [
    'npm',
    'run',
    'debug',
    'update',
    'add',
    'remove',
    'list',
    'add-platform',
    'install-sdk',
    'remove-platform',
    'list-platforms',
    'configure-android',
    'build',
    'shell',
    'mongo',
    'reset',
    'deploy',
    'logs',
    'authorized',
    'claim',
    'login',
    'logout',
    'whoami',
    'test-packages',
    'admin',
    'list-sites',
    'publish-release',
    'publish',
    'publish-for-arch',
    'search',
    'show',
    'test',
    'node',
  ];

  var allArgs = process.argv.slice(2);
  var cmd = allArgs[0];
  var args = allArgs.slice(1);

  if (!_.contains(validMeteorCommands, cmd))
    throw new Command.UsageError();

  if (!this.findAppDirectory())
    throw new Command.UsageError();

  return this.invokeMeteorCommand(cmd, args);
};

/**
 * Proxy valid meteor commands to the meteor command line tool. The meteor
 * command will be run inside the app directory.
 */
module.exports.maybeProxyCommandToMup = function maybeProxyCommandToMup() {
  var validMupCommands = [
    'logs',
    'restart',
    'start',
    'stop',
    'ssh',
    'validate',
    'status',
    'docker',
    'meteor',
    'mongo',
    'proxy',
    'help'
  ];

  var allArgs = process.argv.slice(2);
  var cmd = allArgs[1];
  var args = allArgs.slice(2);
  var mupArgs = allArgs.slice(3);
  args = args && args[0] && args[0].split('--').join('');

  if (!_.contains(validMupCommands, args))
    throw new Command.UsageError();

  if (!this.findAppDirectory())
    throw new Command.UsageError();

  return this.invokeMupCommand(cmd, args, mupArgs);
};

module.exports.invokeMupCommand = function invokeMupCommand(cmd, args, mupArgs) {
  var future = new Future();
  
  var config = CurrentConfig.withConfigFile(function() {
    return this.CurrentConfig.get();
  });

  var destinationKey = cmd;
  if (destinationKey === 'dev')
    destinationKey = 'development';

  if (destinationKey === 'staging')
    destinationKey = 'staging';

  if (destinationKey === 'prod')
    destinationKey = 'production';

  
  var destination = 'config/' + destinationKey;
  var cwd = path.join(this.pathFromProject(), destination);

  var child = spawn('mup', [args].concat(mupArgs), {
    cwd: cwd,
    env: process.env,
    stdio: 'inherit',
  });

  _.each(['SIGINT', 'SIGHUP', 'SIGTERM'], function (sig) {
    process.once(sig, function () {
      process.kill(child.pid, sig);
      process.kill(process.pid, sig);
    });
  });

  future.wait();
};

/**
 * Invoke a meteor command with given array arguments. Does not
 * check whether the command is valid. Useful when we know we want
 * to run a command and we can skip the valid meteor commands
 * check.
 */
module.exports.invokeMeteorCommand = function invokeMeteorCommand(cmd, args) {
  var driver = 'none';

  if (args.indexOf('--test') > -1 && args.indexOf('create') < 0) {
    var config = JSON.parse(fs.readFileSync(this.findProjectDirectory() + '/.maka/config.json', 'utf8'));
    if (config.engines.test === 'jasmine') {
      driver = 'sanjo:jasmine';
    } else if (config.engines.test === 'mocha') {
      driver = 'meteortesting:mocha';
    }
  }

  var future = new Future();
  // don't pass env to Meteor
  var env = args.indexOf('--env');
  if (env != -1) {
    args = _.without(args, '--env', args[env + 1]);
  }

  var test = args.indexOf('--test');
  if (test != -1) {
      cmd = 'test';
      args = _.without(args, '--test');
      if (driver !== 'none' && args.indexOf('--ci') === -1) {
        args = spawnargs('--full-app --driver-package ' + driver + ' ' + args.join(' '));
      } else if (driver !== 'none' && args.indexOf('--ci') > -1) {
        args = _.without(args, '--ci');
        args = spawnargs('--once --driver-package ' + driver + ' ' + args.join(' '));
      }
  }


  var test = args.indexOf('--test-packages');
  if (test != -1) {
      cmd = 'test-packages';
      args = _.without(args, '--test-packages');
      args = spawnargs(args.join(' ') + ' ' + '--driver-package ' + driver);
  }

  // check if npm has been run
  var appDirectory = this.findAppDirectory(process.env['PWD']);
  var modulesExist = fs.existsSync(appDirectory + '/node_modules');
  var validRunCmds = ['run', 'test', 'debug'];
  var isValidCmd = validRunCmds.indexOf(cmd) >= 0;
  
  if (!modulesExist && isValidCmd) {
    var projectDirectory = process.cwd();
    this.setupNpm({cwd: projectDirectory + '/app'});
  }
  
  var meteor = process.platform === "win32" ? 'meteor.bat' : 'meteor';
  //this.logSuccess("> " + meteor + " " + [cmd].concat(args).join(' '));

  var child = spawn(meteor, [cmd].concat(args), {
    cwd: this.findAppDirectory(),
    env: process.env,
    stdio: 'inherit',
  });

  _.each(['SIGINT', 'SIGHUP', 'SIGTERM'], function (sig) {
    process.once(sig, function () {
      process.kill(child.pid, sig);
      process.kill(process.pid, sig);
    });
  });

  child.on('exit', function() {
    future.return();
  });

  future.wait();
};
