var path = require('path');
var fs = require('fs');
var _ = require('underscore');

var AWS_COMMAND_DESCRIPTION = 'Create and terminate EC2 instances with the aws-cli.\n' +
  'Deploy to EC2 and install/configure Nginx (reverse proxy) w/o SSL and PM2 (node manager/load balancer).';

Command.create({
  name: 'aws',
  usage: 'maka aws <service> <environment> [--task]',
  description: AWS_COMMAND_DESCRIPTION,
  examples: [
    'maka aws ec2 prod --create',
    'maka aws ec2 prod --deploy',
    'maka aws ec2 prod --term',
    'maka aws ec2 prod --scaffold',
    'maka aws ec2 prod --create-key',
  ]
}, function (args, opts) {
  var self = this;
  try {
    var destinationKey = args[1];
    switch (args[1]) {
      case 'dev' || 'development':
        destinationKey = 'development';
        break;
      case 'staging':
        destinationKey = 'staging';
        break;
      case 'prod' || 'production':
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
      console.log(success);
      if (!success) return false;

      // update the ssh file.
      if (!this.confirm('[?] Would you like to update the ssh.json config file?')) {
        return false;
      } else {
        try {
          var sshConfig = fs.readFileSync(destination + '/ssh.json', 'utf8');
          var sshConfigJson = JSON.parse(sshConfig);
          console.log(fileName);
          sshConfigJson.pem = './_keys/' + fileName + '.pem.txt';
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
      // Get default VPC
      var vpcDef = this.execSync('aws ec2 describe-vpcs', {}, false);
      console.log(vpcDef);
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
        var sgDef = this.execSync('aws ec2 describe-security-groups --query "SecurityGroups[*].{Name:GroupName,ID:GroupId}"', false);
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

        // Get a list of images
        var imgDef = this.execSync(' aws ec2 describe-images --filters "Name=description,Values=*LTS*" "Name=name,Values=*server*" "Name=name,Values=*ubuntu*" "Name=creation-date,Values=*2019*" "Name=root-device-type,Values=ebs"');
        console.log(imgDef);

      } catch {
        if (!this.confirm('[?] There is no default security group (SG), would you like to create one?')) {
          this.logWarn('[!] Aborting! NO EC2 INSTANCE WAS CREATED.');
          return false;
        } else {
          var sgNameRes = this.ask('[?] Name of the SG?: [maka-sg] ') || 'maka-sg';
          var success = this.ec2createSG({ cwd, description: '\"Default SG group\"', name: sgNameRes, toFile: sgFilePath, vpcId});
        }
      }

      console.log('asdasd');
    }

  } catch (err) {

    console.log(err);
  }
});
