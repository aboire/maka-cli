var fs = require('fs');

module.exports.ec2create = function ec2create(opts) {
  try {
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
    var result = this.execSync(command, { cwd: cwd, toFile: opts.toFile }, false);
    return result;
  } catch (e) {
    this.logError(e);
    return {};
  }
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

    try {
      fs.statSync(opts.toFile);
      this.execSync('rm -f ' + opts.toFile);
    } catch (e) {}

    var command = 'aws ' + args.join(' ');
    var result = this.execSync(command, { cwd: cwd, toFile: opts.toFile }, true);
    var rawPem = JSON.parse(fs.readFileSync(opts.toFile, 'utf8'));
    var key = rawPem.KeyMaterial;
    this.createFile(opts.toFile, key, { force: true });

    this.execSync('chmod 400 ' + opts.toFile);

    this.logSuccess('[+] Pem key saved to ' + opts.toFile);
    return true;
  } catch(e) {
    this.logError(e);
    return false;
  }
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

module.exports.ec2describeKeys = function ec2describeKeys(opts) {
  var cwd = (opts.cwd) ? opts.cwd : process.cwd();
  var self = this;

  var args = [
    'ec2',
    'describe-key-pairs',
    '--query',
    '"KeyPairs[*].{name:KeyName}"'
  ];
  var command = 'aws ' + args.join(' ');
  var keysDef = this.execSync(command, { cwd }, false);
  var keysDefJson = JSON.parse(keysDef);
  var keysList = [];
  if (keysDefJson) {
  keysDefJson.forEach(function(item, index) {
    keysList.push({ id: index, name: item.name });
  });

  keysList.forEach(function(item) {
    if (item.name === opts.suggestion) {
      self.logNotice('ID: ' + item.id + ' NAME: ' + item.name);
    } else {
      console.log('ID: ' + item.id + ' NAME: ' + item.name);
    }
  });
  } else {
    this.logError('[!] You have no key-pairs, please create one. (maka aws create-key-pair --env).');
  }
  return keysList;
};

module.exports.ec2describeInstances = function ec2describeInstances(opts) {
  var cwd = (opts.cwd) ? opts.cwd : process.cwd();
  var self = this;

  var args = [
    'ec2',
    'describe-instances',
    '--filters',
    '"Name=tag:created-by,Values=maka-cli"',
    '--query',
    '"Reservations[*].Instances[*].{instanceId:InstanceId,publicIp:PublicIpAddress,privateIp:PrivateIpAddress,status:State.Name}"'
  ];
  var command = 'aws ' + args.join(' ');
  var defs = this.execSync(command, { cwd }, false);
  var defsJson = JSON.parse(defs);
  if (defsJson.length > 0) {
    var list = [];
    defsJson.forEach(function(item, index) {
      var item = item[0];
      list.push({ id: index, instanceId: item.instanceId, privateIp: item.privateIp, publicIp: item.publicIp, status: item.status });
    });

    list.forEach(function(item) {
      var printLine = 'ID: ' + item.id + ' STATUS: ' + item.status + ' INSTANCE_ID: ' + item.instanceId + ' PUB_IP: ' + item.publicIp + ' PRIV_IP: ' + item.privateIp;
      if (item.status === 'terminated') {
        self.logError(printLine);
      } else if (item.status === 'running') {
        self.logSuccess(printLine);
      } else {
        console.log(printLine);
      }
    });
  } else {
    this.logError('[!] You have no instances created by maka-cli.  Please reivew your AWS console manually!!!');
  }
  return list;
};

