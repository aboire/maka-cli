var path = require('path');
var fs = require('fs');
var _ = require('underscore');

var AWS_COMMAND_DESCRIPTION = 'Create EC2 instances and key-pairs with the aws-cli.\n' +
  'Deploy to EC2 and install/configure Nginx (reverse proxy) w/o SSL and PM2 (node manager/load balancer).\n\n' + 
  'Describe commands do not need an environment (env) option.';

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

Command.create({
  name: 'aws',
  usage: 'maka aws <command> [--env <env-name>]',
  description: AWS_COMMAND_DESCRIPTION,
  examples: [
    'maka aws describe-key-pairs',
    'maka aws describe-instances',
    'maka aws create-instance --env prod',
    'maka aws create-key-pair --env staging',
  ]
}, function (args, opts) {
  var config = CurrentConfig.withConfigFile(function() {
    return this.CurrentConfig.get();
  });

  if (args[0] && !args[0].includes('describe')) {
    if (args.length < 1 || !opts.env)
      throw new Command.UsageError;
  }

  var validCommands = [
    'describe-key-pairs',
    'describe-instances',
    'create-instance',
    'create-key-pair'
  ];
  if (!validCommands.includes(args[0])) {
    this.logError('[-] Invalid command.');
    throw new Command.UsageError;
  }

  if (opts.help)
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

    if (!args[0].includes('describe')) {
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
     * createKey
     * Creates a new pem key, and will ask to update the ssh.json file with the path.
     */
    var shouldCreateKey = args[0].includes('create-key-pair');
    if (shouldCreateKey) {
      createKey(config, cwd, destinationKey, this);
    }

    /**
     * describe-key-pairs
     * Just a simple wrapper for the aws cli
     */
    var shouldDescribeKeyPairs = args[0].includes('describe-key-pairs');
    if (shouldDescribeKeyPairs) {
      var suggestedKey = config.appName + '-' + opts.env;
      this.ec2describeKeys({ cwd, suggestion: suggestedKey });
    }

    var shouldDescribeInstances = args[0].includes('describe-instances');
    if (shouldDescribeInstances) {
      this.ec2describeInstances({ cwd });
    }

    /**
     * createInstance
     * Creates a new EC2 instance
     */
    var shouldCreateInstance = args[0].includes('create-instance');
    if (shouldCreateInstance) {
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
        var countRes = this.ask('[?] How many instances do you want to create? [1] ');
        var INST_COUNT = 1;
        if (parseInt(countRes) >= 1) {
          INST_COUNT = countRes;
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
          var result = this.ec2create({ imageId: AMI_ID, count: INST_COUNT, type: INST_TYPE, key: KEY_ID, sgIds: SG_ID, subnet: SUBNET_ID, tags: '\"ResourceType=instance,Tags=[{Key=created-by,Value=maka-cli},{Key=environment,Value='+ destinationKey +'},{Key=app-name,Value=' + config.appName +'}]\"' });
          if (result) {
            this.logSuccess('[+] Instance created!  NOTE: You are now being billed for this EC2.');
          }
          console.log(result);
        } else {
          this.logNotice('[!] ABORTED! No instance has been created!');
        }
      } catch (e) {
        this.logError(e);
      }
    }

  } catch (err) {
    console.log(err);
  }
});
