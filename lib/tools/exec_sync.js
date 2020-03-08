var Future = require('fibers/future');
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var _ = require('underscore');
var fs = require('fs');

module.exports.execSync = function execSync(command, opts, immediate) {
  var future = new Future;

  opts = opts || {};
  immediate = (immediate !== undefined) ? immediate : true;

  var child = exec(command, opts, function(err, stdout, stderr) {
    if (err) {
      future.throw(err);
    } else if (immediate) {
      future.return(true);
    }
  });

  child.stdout.on('data', function(data) {
    if (opts.toFile) {
      fs.writeFileSync(opts.toFile, data.toString(), function(err) {
        if (err) {
          future.throw(err);
        }
        console.log("File saved to: " + opts.toFile);
      });
    } else {
      if (!immediate) {
        future.return(data.toString());
      } else if(!opts.silent) {
        console.log(data.toString());
      }
    }
  });

  return future.wait();
};

module.exports.spawnSync = function spawnSync(command, args, cwd) {
  var future = new Future;
  var cwd = (cwd) ? cwd : process.cwd();

  var child = spawn(command, args, {
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

  child.on('exit', function() {
    future.return();
  });

  future.wait();
};
