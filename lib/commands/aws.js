var path = require('path');
var fs = require('fs');
var _ = require('underscore');

var AWS_COMMAND_DESCRIPTION = 'Create, view, and terminate EC2 instances. Assign key-pairs and host IPs,\n' +
  'Describe commands do not need an environment (env) option.\n\n' +
  'Example Workflow: \n' +
  ' $ maka aws create-key-pair --env dev\n' +
  ' $ maka aws create-sg\n' +
  ' $ maka aws create-instance --env dev\n' +
  ' $ maka aws set-host --env dev\n' +
  ' $ maka deploy --env dev\n\n' +
  'In order to deploy to an instance with NGINX using SSL, you must create a new configuration that has the NGINX SSL config file:\n' +
  ' Example Workflow for SSL: \n' +
  ' $ maka g:config staging --ssl\n' +
  ' $ maka ssl generate-csr --env staging # generate certificate signing request (also creates the secret key)\n' +
  ' $ maka ssl generate-ssc --env staging # generate self-signed certificate.\n' +
  ' $ maka aws create-key-pair --env staging\n' +
  ' $ maka aws create-sg --ssl\n' +
  ' $ maka aws create-instance --env staging\n' +
  ' $ maka aws set-host --env staging\n' +
  ' $ maka deploy --env staging --ssl';

var createKey = function(config, cwd, destinationKey, context) {
  /**
   * createKey
   * Creates a new pem key, and will ask to update the ssh.json file with the path.
   */
  var keyName = config.appName;

  var fileNameFull = cwd + '/_keys/' + keyName + '.pem.txt';
  var success = context.ec2key({ cwd, name: keyName + '-' + destinationKey, toFile: fileNameFull });
  if (!success) return false;

  // update the ssh file.
  if (!context.confirm('[?] Would you like to update the ssh.json config file?')) {
    return false;
  } else {
    try {
      var sshConfig = fs.readFileSync('config/' + destinationKey + '/ssh.json', 'utf8');
      var sshConfigJson = JSON.parse(sshConfig);
      sshConfigJson.pem = '_keys/' + keyName + '.pem.txt';
      fs.writeFileSync('config/' + destinationKey + '/ssh.json', JSON.stringify(sshConfigJson, null, 2));
    } catch(e) {
      context.logError(e);
      context.logError('[-] You will need to update the ssh.json file yourself.');
    }
  }
};

var getVpc = function(context) {
  var VPC_ID = '';
  context.logNotice('** Available  VPCs **');
  var vpcDef = context.execSync('aws ec2 describe-vpcs', {}, false);
  var vpcDefJson = JSON.parse(vpcDef);
  var vpcList = [];
  Object.keys(vpcDefJson).forEach(function (key) {
    vpcDefJson[key].forEach(function(item, index) {
      vpcList.push({ id: index, vpcId: item.VpcId, cidr: item.CidrBlock });
    });
  });

  vpcList.forEach(function(item) {
    console.log('ID: ' + item.id + ' VPCID: ' + item.vpcId + ' CIDR: ' + item.cidr);
  });

  var vpcIdRes = context.ask('[?] Please choose a VPC to assign the security-group to: [0] ') || 0;
  vpcList.forEach(function(item) {
    if (item.id === parseInt(vpcIdRes)) {
      VPC_ID = item.vpcId;
      context.logSuccess('[+] Setting VPC ID to: ' + VPC_ID + '\n');
    } 
  });

  if (VPC_ID === '') {
    context.logError('[-] That was not an id in the list.');
    return false;
  }
  return VPC_ID;
};

Command.create({
  name: 'aws',
  usage: 'maka aws <command> [--env <env-name>]',
  description: AWS_COMMAND_DESCRIPTION,
  examples: [
    'maka aws describe-key-pairs',
    'maka aws describe-instances',
    'maka aws terminate-instance',
    'maka aws create-instance --env prod',
    'maka aws create-key-pair --env staging',
    'maka aws create-sg [--ssl]',
    'maka aws set-host --env prod',
    'maka aws set-key-pair --env prod',
  ]
}, function (args, opts) {

  if (args.length < 1)
    throw new Command.UsageError;


  var validCommands = [
    'describe-key-pairs', 'dkp',
    'describe-instances', 'di',
    'create-instance', 'ci',
    'create-key-pair', 'ckp',
    'create-sg', 'csg',
    'set-host',
    'set-key-pair', 'skp',
    'terminate-instance', 'ti',
  ];

  var nonEnvCommands = [
    'describe-key-pairs', 'dkp',
    'describe-instances', 'di',
    'terminate-instance', 'ti',
    'create-sg', 'csg',
  ];

  if (!validCommands.includes(args[0])) {
    this.logError('[-] Invalid command.');
    throw new Command.UsageError;
  }

  if (opts.help)
    throw new Command.UsageError;

  /**
   * describe-key-pairs
   * Just a simple wrapper for the aws cli
   */
  if (args[0].includes('describe-key-pairs') || args[0].includes('dks')) {
    this.ec2describeKeys({ cwd });
    return;
  }

  /**
   * Describe Instances
   */
  var shouldDescribeInstances = args[0].includes('describe-instances');
  if (args[0].includes('describe-instances') || args[0].includes('di')) {
    this.ec2describeInstances({ cwd });
    return;
  }

  /** 
   * Terminate Instance
   */
  if (args[0].includes('terminate-instance') || args[0].includes('ti')) {
    var instances = this.ec2describeInstances({cwd});
    var choice = this.ask('[?] Please choose an instance ID: ') || null;
    choice = (choice !== null) ? parseInt(choice) : choice;
    if (choice !== null && typeof choice === 'number') {
      var instance = {};
      instances.forEach(function(item) {
        if (item.id === choice) {
          instance = item;
        }
      });
      if (instance.status === 'running') {
        var confirm = this.confirm('[!!] You are about to terminate (lose all data) on instance: ' + instance.name + ' Ready?');
        if (confirm) {
          this.ec2terminateInstance({ cwd, instanceId: instance.instanceId });
        } else {
          this.logError('[-] You have aborted the termination.  The instance: ' + instance.name + ' is still running.  (Charges are still being applied).');
        }
      } else {
        this.logError('[-] There are no instances in a state that can be terminated; either they are spinning up, or are already terminated.');
      }
    }
    return;
  }

  var config = CurrentConfig.withConfigFile(function() {
    return this.CurrentConfig.get();
  });

  /**
   * Create security-group
   */
  if (args[0].includes('create-sg') || args[0].includes('csg')) {
    var vpcIdforSG = getVpc(this);
    var sslStr = (opts.ssl) ? '-ssl' : '';
    this.ec2createSG({ cwd, description: '\"Web App\"', name: config.appName +  sslStr, vpcId: vpcIdforSG, ssl: opts.ssl });
    return;
  }

  // Commands below here need to have the --env set.
  if (args.length < 1 || !opts.env)
    throw new Command.UsageError;

  var self = this;
  try {
    var destinationKey = opts.env;
    if(destinationKey === 'dev') {
      destinationKey = 'development';
    } else if (destinationKey === 'prod') {
      destinationKey = 'production';
    }

    var destination = 'config/' + destinationKey;
    var cwd = path.join(this.pathFromProject(), destination);

    if (!nonEnvCommands.includes(args[0])) {
      try {
        var configEnv = fs.existsSync(cwd);
        if (!configEnv) throw '[-] ERROR';
      } catch (e) {
        this.logError('[-] No such environment has been configured. No instance has been created.');
        return false;
      }
    }

    // Setup the _keys directory
    var keysDir = destination + '/_keys/';
    try {
      fs.statSync(keysDir);
    } catch {
      fs.mkdirSync(keysDir, { recursive: true });
    }


    /** 
     * setHost
     */
    if (args[0].includes('set-host')) {
      var instances = this.ec2describeInstances({cwd});
      var choice = this.ask('[?] Please choose an instance ID: ') || null;
      choice = (choice !== null) ? parseInt(choice) : choice;
      if (choice !== null && typeof choice === 'number') {
        var instance = {};
        var pubOrPriv = false;

        instances.forEach(function(item) {
          if (item.id === choice) {
            instance = item;
            if (item.publicIp !== null) {
              pubOrPriv = true;
            }
          }
        });

        // grab the ssh config file now.
        var sshConfig = JSON.parse(fs.readFileSync(cwd + '/ssh.json', 'utf8'));
        if (pubOrPriv) {
          // I found two IPs, one public and one private.
          var setIpChoice = this.ask('[?] Set the host to public or private? [public]') || 'public';
          if (setIpChoice === 'public' || setIpChoice === 'private') {
            // parse out the choice.
            if (setIpChoice === 'public') {
              sshConfig.host = instance.publicIp;
            } else if (setIpChoice === 'private') {
              sshConfig.host = instance.privateIp;
            }
          } else {
            throw '[-] That is not an option. Must be "public" or "private"';
          }
        } else {
          // I found only one IP, just set it.
          sshConfig.host = instance.privateIp;
        }
        fs.writeFileSync(cwd + '/ssh.json', JSON.stringify(sshConfig, null, 2));
        this.logSuccess('[+] Saved host ' + setIpChoice + ' IP to ' + cwd + '/ssh.json');
        this.execSync('cat ' + cwd + '/ssh.json');

      } else {
        throw '[-] No instance selected.';
      }
    }

    /**
     * createKey
     * Creates a new pem key, and will ask to update the ssh.json file with the path.
     */
    if (args[0].includes('create-key-pair') || args[0].includes('ckp')) {
      createKey(config, cwd, destinationKey, this);
    }

    /**
     * createInstance
     * Creates a new EC2 instance
     */
    if (args[0].includes('create-instance') || args[0].includes('ci')) {
      var KEY_ID = '';
      var VPC_ID = '';
      var SG_ID = '';
      var AMI_ID = '';
      var INST_TYPE = '';

      if (opts.help)
        throw new Command.UsageError;
      var SUBNET_ID = '';
      var INSTANCE_TYPE = '';

      // Set the key to use:
      try {
        this.logNotice('** Available key-pairs **');
        var suggestedKey = config.appName + '-' + opts.env;
        var keysList = this.ec2describeKeys({ cwd, suggestion: suggestedKey });
        var keyIdRes = this.ask('[?] Please choose a key to use: ') || -1;
        if (parseInt(keyIdRes) < 0) {
          this.logError('[-] You must have a key-pair.  Please run "maka aws create-key-pair --env <env-name>" to generate a new key');
          this.logNotice('[!] No instance has been created.');
          return;
        }
        keysList.forEach(function(item) {
          if (parseInt(keyIdRes) === item.id) {
            KEY_ID = item.name;
            self.logSuccess('[+] Setting the key-pair to: ' + KEY_ID);
          }
        });
      } catch (e) {
        this.logError(e);
      }


      //destinationKey Get default VPC
      this.logNotice('** Available  VPCs **');
      var vpcDef = this.execSync('aws ec2 describe-vpcs', {}, false);
      var vpcDefJson = JSON.parse(vpcDef);
      var vpcList = [];
      Object.keys(vpcDefJson).forEach(function (key) {
        vpcDefJson[key].forEach(function(item, index) {
          vpcList.push({ id: index, vpcId: item.VpcId, cidr: item.CidrBlock });
        });
      });

      vpcList.forEach(function(item) {
        console.log('ID: ' + item.id + ' VPCID: ' + item.vpcId + ' CIDR: ' + item.cidr);
      });

      var vpcIdRes = this.ask('[?] Please choose a VPC to assign the instance to: [0] ') || 0;
      vpcList.forEach(function(item) {
        if (item.id === parseInt(vpcIdRes)) {
          VPC_ID = item.vpcId;
          self.logSuccess('[+] Setting VPC ID to: ' + VPC_ID + '\n');
        } 
      });

      if (VPC_ID === '') {
        self.logError('[-] That was not an id in the list.');
        return false;
      }

      // Check if there is a default security group.
      try {
        this.logNotice('** Available Security Groups **');
        var sgDef = this.execSync('aws ec2 describe-security-groups --query "SecurityGroups[*].{Name:GroupName,ID:GroupId}"', {}, false);
        var sgcDefJson = JSON.parse(sgDef);
        var sgList = [];
        sgcDefJson.forEach(function(item, index) {
          sgList.push({ id: index, name: item.Name, sgId: item.ID, });
        });

        sgList.forEach(function(item) {
          console.log('ID: ' + item.id + ' SG NAME: ' + item.name + ' SGID: ' + item.sgId);
        });

        var sgIdRes = this.ask('[?] Please choose a SG to assign the instance to: [0] ') || 0;
        sgList.forEach(function(item) {
          if (item.id === parseInt(sgIdRes)) {
            SG_ID = item.sgId;
            self.logSuccess('[+] Setting SG ID to: ' + SG_ID + '\n');
          } 
        });

        if (SG_ID === '') {
          self.logError('[-] That was not an id in the list.');
          return false;
        }

      } catch (e) {
        this.logError(e);
      }

      // Check on the AMI to use
      try {

        var date = new Date().getUTCFullYear();
        this.logNotice('** Available AMIs **');
        var imgDef = this.execSync('aws ec2 describe-images --filters "Name=description,Values=*LTS*" "Name=name,Values=*server*" "Name=name,Values=*ubuntu*" "Name=creation-date,Values=*' + date + '*" "Name=root-device-type,Values=ebs" "Name=description,Values=*Ubuntu? ??\.?? LTS? amd64 bionic image*" --query "Images[*].{Desc:Description,ID:ImageId}"', {}, false);
        var imgDefJson = JSON.parse(imgDef);
        var imageList = [];
        imgDefJson.forEach(function(item, index) {
          imageList.push({ id: index, amiId: item.ID, desc: item.Desc});
        });

        imageList.forEach(function(item) {
          console.log('ID: ' + item.id + ' AMIID: ' + item.amiId + ' DESCRIPTION: ' + item.desc);
        });

        var amiIdRes = this.ask('[?] Please choose an AMI ID to assign the instance to: [0] ') || 0;
        imageList.forEach(function(item) {
          if (item.id === parseInt(amiIdRes)) {INST_COUNT
            AMI_ID = item.amiId;
            self.logSuccess('[+] Setting AMI ID to ' + AMI_ID + ' : ' + item.desc);
          }
        });

        if (AMI_ID === '') {
          self.logError('[-] That was not an id in the list.');
          return false;
        }

      } catch (e) {
        this.logError(e);
      }

      // Get the available subnets
      try {
        this.logNotice('** Available Subnets **');
        var subnetDef = this.execSync('aws ec2 describe-subnets --query "Subnets[*].{subnetId:SubnetId,cider:CidrBlock,az:AvailabilityZone}"', {}, false);
        var subnetDefJson = JSON.parse(subnetDef);
        var subnetList = [];
        subnetDefJson.forEach(function(item, index) {
          subnetList.push({ id: index, cidr: item.cider, az: item.az, subnetId: item.subnetId });
        });

        subnetList.forEach(function(item) {
          console.log('ID: ' + item.id + ' CIDR: ' + item.cidr + ' AZONE: ' + item.az + ' SUBNETID: ' + item.subnetId );
        });

        var subnetIdRes = this.ask('[?] Please choose a subnet ID to assign the instance to: [0] ') || 0;
        subnetList.forEach(function(item) {
          if (item.id === parseInt(subnetIdRes)) {
            SUBNET_ID = item.subnetId;
            self.logSuccess('[+] Setting Subnet ID to ' + SUBNET_ID);
          }
        });

        if (SUBNET_ID === '') {
          self.logError('[-] That was not an id in the list.');
          return false;
        }
      } catch(e){
        this.logError(e);
      }

      // Set the number of instances
      try {
        var countRes = this.ask('[?] How many instances do you want to create (min:max)? [1:1] ') || '1:1';
        var INST_COUNT = '1:1';
        var min = countRes.split(':')[0];
        var max = countRes.split(':')[1];
        if (typeof parseInt(min) === 'number' && typeof parseInt(max) === 'number') {
          INST_COUNT = [min,max].join(':');
          this.logSuccess('[+] Setting the number of instances to: ' + INST_COUNT);
        }
      } catch (e) {
        this.logError(e);
      }

      // Set the instance type
      try {
        var instanceTypeRes = this.ask('[?] What instance type would you like? [t2.nano]') || 't2.nano';
        if (typeof instanceTypeRes === 'string') {
          INST_TYPE = instanceTypeRes;
        }

      } catch (e) {
        this.logError(e);
      }

      try {
        this.logNotice('ImageID:' + AMI_ID);
        this.logNotice('Instance Count: ' + INST_COUNT);
        this.logNotice('Instace Type: ' + INST_TYPE);
        this.logNotice('Key-Pair: ' + KEY_ID);
        this.logNotice('Security Group: ' + SG_ID);
        this.logNotice('Subnet: ' + SUBNET_ID);
        var confirmInstance = this.confirm('[?] Ready to create instance? NOTE: You WILL be billed for this instance by AWS.');
        if (confirmInstance) {
          var result = this.ec2create({ imageId: AMI_ID, count: INST_COUNT, type: INST_TYPE, key: KEY_ID, sgIds: SG_ID, subnet: SUBNET_ID, tags: '\"ResourceType=instance,Tags=[{Key=created-by,Value=maka-cli},{Key=environment,Value='+ destinationKey +'}, {Key=Name,Value=' + config.appName + '-' + destinationKey +'}]\"' });
          if (result) {
            this.logSuccess('[+] Instance created!  NOTE: You are now being billed for this EC2.');
            this.logNotice('[*] You may now assign the IP to your config file with "maka aws set-host --env <env>" and deploy with "maka deploy --env <env>"');
            this.logNotice('[*] In order to deploy SSL hosts, create a new configuration with SSL settings  Ex: "maka g:config staging --ssl" and use "maka ssl generate-csr --env staging"');
          }
          console.log(result);
        } else {
          this.logNotice('[!] ABORTED! No instance has been created!');
        }
      } catch (e) {
        this.logError(e);
      }
    }

  } catch (e) {
    this.logError(e);
  }
});
