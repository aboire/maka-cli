var Future = require('fibers/future');
var exec = require('child_process').exec;

module.exports.execSync = function execSync(command, opts) {
  var future = new Future;

  opts = opts || {};

  var child = exec(command, opts, function(err, stdout, stderr) {
    if (err) {
      future.throw(err);
    } else {
      if (opts.silent !== true) {
        process.stderr.write(stderr);
        process.stdout.write(stdout);
      }

      future.return(true);
    }
  });

  child.stdout.on('data', function(data) {
    console.log(data.toString());
  });

  return future.wait();
};
