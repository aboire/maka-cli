var path = require('path');
var fs = require('fs');
var _ = require('underscore');

var AWS_COMMAND_DESCRIPTION = 'Create and terminate EC2 instances with the aws-cli.\n' +
  'Deploy to EC2 and install/configure Nginx (reverse proxy) w/o SSL and PM2 (node manager/load balancer).';

Command.create({
  name: 'aws',
  usage: 'maka aws <environment> [--task]',
  description: AWS_COMMAND_DESCRIPTION,
  examples: [
    'maka aws prod --create',
    'maka aws prod --deploy',
    'maka aws prod --term',
    'maka aws prod --scaffold',
    'maka aws prod --create-key',
  ]
}, function (args, opts) {
  var self = this;
  try {
    var destinationKey = args[0];
    switch (args[0]) {
      case 'dev':
        destinationKey = 'development';
        break;
      case 'staging':
        destinationKey = 'staging';
        break;
      case 'prod':
        destinationKey = 'production';
        break;
      default:
        destinationKey = 'development';
        this.logNotice('[!] Environment not specified, defaulting to "development"');
        break;
    }

    var destination = 'config/' + destinationKey;
    var cwd = path.join(this.pathFromProject(), destination);

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
    var createKey = _.has(opts, 'create-key');
    if (createKey) {
      var fileName = '';
      if (typeof opts['create-key'] === 'string') {
        fileName = opts['create-key'];
      } else {
        fileName = 'Default';
      }

      var fileNameFull = cwd + '/_keys/' + fileName + '.pem.txt';
      var success = this.ec2key({ cwd: cwd, name: fileName, toFile: fileNameFull });
      if (!success) return false;

      // update the ssh file.
      if (!this.confirm('[?] Would you like to update the ssh.json config file?')) {
        return false;
      } else {
        try {
          var sshConfig = fs.readFileSync(destination + '/ssh.json', 'utf8');
          var sshConfigJson = JSON.parse(sshConfig);
          sshConfigJson.pem = '_keys/' + fileName + '.pem.txt';
          fs.writeFileSync(destination + '/ssh.json', JSON.stringify(sshConfigJson, null, 2));
        } catch(e) {
          this.logError(e);
          this.logError('[!] You will need to update the ssh.json file yourself.');
        }
      }
    }

    /**
     * createInstance
     * Creates a new EC2 instance
     */
    var createInstance = _.has(opts, 'create');
    if (createInstance) {
      // Set the key to use:
      try {
        var keysDef = this.execSync('aws ec2 describe-key-pairs --query "KeyPairs[*].{name:KeyName}"', {}, false);
        var keysDefJson = JSON.parse(keysDef);
        var keysList = [];
        keysDefJson.forEach(function(item, index) {
          keysList.push({ id: index, name: item.name });
        });

        keysList.forEach(function(item) {
          console.log('ID: ' + item.id + ' NAME: ' + item.name);
        });

        var keyIdRes = this.ask('[?] Please choose a key to use: ') || -1;
        if (parseInt(keyIdRes) < 0) {
          this.logError('[!] You must have a key-pair.  Please run "maka aws <env> --create-key" to generate a new key');
          this.logNotice('[!] No instance has been created.');
          return;
        }
        var KEY_ID = '';
        keysList.forEach(function(item) {
          if (parseInt(keyIdRes) === item.id) {
            KEY_ID = item.name;
            self.logSuccess('[+] Setting the key-pair to: ' + KEY_ID);
          }
        });
      } catch (e) {
        this.logError(e);
      }


      // Get default VPC
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
      var VPC_ID = '';
      vpcList.forEach(function(item) {
        if (item.id === parseInt(vpcIdRes)) {
          VPC_ID = item.vpcId;
          self.logSuccess('[+] Setting VPC ID to: ' + VPC_ID + '\n');
        } 
      });

      if (VPC_ID === '') {
        self.logError('[!] That was not an id in the list.');
        return false;
      }

      // Check if there is a default security group.
      try {
        var sgDef = this.execSync('aws ec2 describe-security-groups --query "SecurityGroups[*].{Name:GroupName,ID:GroupId}"', {}, false);
        var sgcDefJson = JSON.parse(sgDef);
        var sgList = [];
        sgcDefJson.forEach(function(item, index) {
          sgList.push({ id: index, name: item.Name, sgId: item.ID, });
        });

        sgList.forEach(function(item) {
          console.log('ID: ' + item.id + ' SG NAME: ' + item.name + ' SGID: ' + item.sgId);
        });

        var SG_ID = '';
        var sgIdRes = this.ask('[?] Please choose a SG to assign the instance to: [0] ') || 0;
        sgList.forEach(function(item) {
          if (item.id === parseInt(sgIdRes)) {
            SG_ID = item.sgId;
            self.logSuccess('[+] Setting SG ID to: ' + SG_ID + '\n');
          } 
        });

      if (SG_ID === '') {
        self.logError('[!] That was not an id in the list.');
        return false;
      }
        
      } catch (e) {
        this.logError(e);
      }

      // Check on the AMI to use
      try {

        var date = new Date().getUTCFullYear();
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
        var AMI_ID = '';
        imageList.forEach(function(item) {
          if (item.id === parseInt(amiIdRes)) {INST_COUNT
            AMI_ID = item.amiId;
            self.logSuccess('[+] Setting AMI ID to ' + AMI_ID + ' : ' + item.desc);
          }
        });

        if (AMI_ID === '') {
          self.logError('[!] That was not an id in the list.');
          return false;
        }

      } catch (e) {
        this.logError(e);
      }

      // Get the available subnets
      try {

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
        var SUBNET_ID = '';
        subnetList.forEach(function(item) {
          if (item.id === parseInt(subnetIdRes)) {
            SUBNET_ID = item.subnetId;
            self.logSuccess('[+] Setting Subnet ID to ' + SUBNET_ID);
          }
        });

        if (SUBNET_ID === '') {
          self.logError('[!] That was not an id in the list.');
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

      this.ec2create({ imageId: AMI_ID, count: INST_COUNT, type: 't2.small', key: KEY_ID, sgIds: SG_ID, subnet: SUBNET_ID, tags: '\"ResourceType=instance,Tags=[{Key=created-by,Value=maka-cli}]\"' });
    }

  } catch (err) {
    console.log(err);
  }
});
