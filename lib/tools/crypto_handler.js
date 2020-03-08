module.exports.ssh = function ssh(opts, cmd) {
  var conn = opts.user + '@' + opts.host;
  var cwd = (opts.cwd) ? opts.cwd : process.cwd();
  var cmd = cmd || '';
  var fullPath = opts.env + '/' + opts.pem;

  var args = [
    '-o',
    'ConnectTimeout=2',
    '-i',
    fullPath,
    '-p',
    opts.port,
    conn,
    cmd
  ];

  this.spawnSync('ssh', args, cwd);
}

module.exports.sshPing = function sshPing(opts, cmd) {
  var conn = opts.user + '@' + opts.host;
  var cwd = (opts.cwd) ? opts.cwd : process.cwd();
  var cmd = cmd || '';
  var fullPath = opts.env + '/' + opts.pem;

  var args = [
    '-o',
    'ConnectTimeout=2',
    '-i',
    fullPath,
    '-p',
    opts.port,
    conn,
    cmd
  ];

  try {
    var command = 'ssh ' + args.join(' ');
    return this.execSync(command, { cwd: cwd }, true);
  } catch (e) {
    this.logError(e);
    return false;
  }
}

module.exports.scp = function scp(opts) {
  var conn = opts.user + '@' + opts.host + ':' + opts.dest;
  var cwd = (opts.cwd) ? opts.cwd : process.cwd();
  var fullPath = opts.env + '/' + opts.pem;

  var args = [
    '-i',
    fullPath,
    '-P',
    opts.port,
    opts.source,
    conn
  ];

  return this.spawnSync('scp', args, cwd);
}

module.exports.genCSR = function genCSR(opts) {
  var cwd = (opts.cwd) ? opts.cwd : process.cwd();
  var fullPath = opts.env + '/' + opts.pem;

  var args = [
    'req',
    '-new',
    '-newkey',
    'rsa:2048',
    '-nodes',
    '-keyout',
    opts.keyName,
    '-out',
    opts.csrName
  ];

  this.spawnSync('openssl', args, cwd);
}

module.exports.genSSC = function genSSC(opts) {
  var cwd = (opts.cwd) ? opts.cwd : process.cwd();
  var fullPath = opts.env + '/' + opts.pem;

  var args = [
    'req',
    '-x509',
    '-new',
    '-key',
    opts.keyName,
    '-out',
    opts.crtName
  ];

  this.spawnSync('openssl', args, cwd);
}
