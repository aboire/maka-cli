var fs = require('fs');

module.exports.ec2create = function ec2create(opts) {
  var cwd = (opts.cwd) ? opts.cwd : process.cwd();

  var args = [
    'ec2',
    'run-instances',
    '--image-id',
    opts.imageId,
    '--count',
    opts.count,
    '--instance-type',
    opts.type,
    '--key-name',
    opts.key,
    '--security-group-ids',
    opts.sgIds,
    '--subnet-id',
    opts.subnet,
    '--tag-specifications',
    opts.tags
  ];

  var command = 'aws ' + args.join(' ');
  this.execSync(command, { cwd: cwd, toFile: opts.toFile });
};

module.exports.ec2term = function ec2term(opts) {
  var cwd = (opts.cwd) ? opts.cwd : process.cwd();
  var args = [
    'ec2',
    'terminate-instances',
    '--instance-ids',
    opts.instanceId
  ];

  var command = 'aws ' + args.join(' ');
  this.execSync(command, { cwd: cwd, toFile: opts.toFile });

};

module.exports.ec2key = function ec2key(opts) {
  try {
    var cwd = (opts.cwd) ? opts.cwd : process.cwd();
    var args = [
      'ec2',
      'create-key-pair',
      '--key-name',
      opts.name,
    ];

    var command = 'aws ' + args.join(' ');
    var result = this.execSync(command, { cwd: cwd, toFile: opts.toFile });
    console.log(result);
    this.logSuccess('[+] Pem key saved to ' + opts.toFile);
    return true;
  } catch(e) {
    this.logError(e);
    return false;
  }
};

module.exports.ec2describe = function ec2describe(opts) {
  var cwd = (opts.cwd) ? opts.cwd : process.cwd();
  //var tagKey = "Name=tag-key,Values=" + opts.tags;

  var args = [
    'ec2',
    'describe-instances',
    '--filters',
    opts.filter,
    '--query',
    opts.query
  ];

  var command = 'aws ' + args.join(' ');
  this.execSync(command, { cwd: cwd, toFile: opts.toFile });
};

module.exports.ec2createSG = function ec2createSG(opts) {
  try {
  var cwd = (opts.cwd) ? opts.cwd : process.cwd();
  //var tagKey = "Name=tag-key,Values=" + opts.tags;

  var args = [
    'ec2',
    'create-security-group',
    '--description',
    opts.description,
    '--group-name',
    opts.name,
    '--vpc-id',
    opts.vpcId
  ];

  var command = 'aws ' + args.join(' ');
    this.execSync(command, { cwd: cwd, toFile: opts.toFile });
    this.logSuccess('[+] Default security group created: ' + opts.toFile);
    return true;
  } catch(e) {
    this.logError(e);
    return false;
  }
};
