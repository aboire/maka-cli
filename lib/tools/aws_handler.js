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
    var sgJson = JSON.parse(this.execSync(command, { cwd: cwd }, false));

    function ingressRule(port, grpId) {
      var sgDefArgs = [
        'ec2',
        'authorize-security-group-ingress',
        '--group-id',
        grpId,
        '--protocol',
        'tcp',
        '--port',
        port,
        '--cidr',
        '0.0.0.0/0'
      ];
      return sgDefArgs;
    }

    if (opts.ssl) {
      var httpSRule = 'aws ' + ingressRule(443, sgJson.GroupId).join(' ');
      this.execSync(httpSRule, { cwd: cwd });
      this.logNotice('[!] Port 443 opened!');
    }

    var httpRule = 'aws ' + ingressRule(80, sgJson.GroupId).join(' ');
    this.execSync(httpRule, { cwd: cwd });
    this.logNotice('[!] Port 80 opened!');

    var sshRule = 'aws ' + ingressRule(22, sgJson.GroupId).join(' ');
    this.execSync(sshRule, { cwd: cwd });
    this.logNotice('[!] Port 22 opened!');

    this.logSuccess('[+] Created: ' + sgJson.GroupId);
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
    '"Reservations[*].Instances[*].{instanceId:InstanceId,publicIp:PublicIpAddress,privateIp:PrivateIpAddress,status:State.Name,name:Tags[?Key==\'Name\'].Value,env:Tags[?Key==\'environment\'].Value}[*]"'
  ];
  var command = 'aws ' + args.join(' ');
  var defs = this.execSync(command, { cwd }, false);
  var defsJson = JSON.parse(defs);
  if (defsJson.length > 0) {
    var list = [];
    defsJson = [].concat.apply([], defsJson);
    defsJson.forEach(function(item, index) {
      list.push({ id: index, instanceId: item.instanceId, privateIp: item.privateIp, publicIp: item.publicIp, status: item.status, name: item.name, env: item.env[0] });
    });

    list.forEach(function(item) {
      var printLine = 'ID: ' + item.id + ' NAME: ' + item.name + ' ENV: ' + item.env + ' STATUS: ' + item.status + ' INSTANCE_ID: ' + item.instanceId + ' PUB_IP: ' + item.publicIp + ' PRIV_IP: ' + item.privateIp;
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

module.exports.ec2terminateInstance = function ec2terminateInstance(opts) {
  var cwd = (opts.cwd) ? opts.cwd : process.cwd();
  var self = this;
  var args = [
    'ec2',
    'terminate-instances',
    '--instance-id',
    opts.instanceId
  ];
  var command = 'aws ' + args.join(' ');
  var resp = this.execSync(command, { cwd });
  return resp;
}

module.exports.ec2rebootInstance = function ec2rebootInstance(opts) {
  var cwd = (opts.cwd) ? opts.cwd : process.cwd();
  var self = this;
  var args = [
    'ec2',
    'reboot-instances',
    '--instance-id',
    opts.instanceId
  ];
  var command = 'aws ' + args.join(' ');
  var resp = this.execSync(command, { cwd });
  return resp;
}

