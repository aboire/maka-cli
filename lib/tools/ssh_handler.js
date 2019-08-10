module.exports.ssh = function ssh(opts, cmd) {
  var conn = opts.user + '@' + opts.host;
  var cwd = (opts.cwd) ? opts.cwd : process.cwd();
  var cmd = cmd || '';

  var args = [
    '-i',
    opts.pem,
    '-p',
    opts.port,
    conn,
    cmd
  ];

  this.spawnSync('ssh', args, cwd);
}

module.exports.scp = function scp(opts) {
  var conn = opts.user + '@' + opts.host + ':' + opts.dest;
  var cwd = (opts.cwd) ? opts.cwd : process.cwd();

  var args = [
    '-i',
    opts.pem,
    '-p',
    opts.port,
    opts.source,
    conn
  ];

  this.spawnSync('scp', args, cwd);
}

