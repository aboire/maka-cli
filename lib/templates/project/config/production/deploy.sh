#!/bin/bash
PEM_FILE="./path/to/pem"
IP_ADDRS="1.2.3.4"
USER_NAM="ubuntu"
PKG_MNGR="apt"

# SSL ( PATH NEEDS TO BE ABSOLUTE !! )
KEY_FILE="./path/to/<%= app %>.key"
CRT_FILE="./path/to/<%= app %>.crt"

# configure instance with git and nginx
ssh -i $PEM_FILE -t $USER_NAM@$IP_ADDRS "sudo $PKG_MNGR install git nginx -y"

# configure nvm for node
ssh -i $PEM_FILE -t $USER_NAM@$IP_ADDRS "git clone https://gist.github.com/c427ccd6f4377b39299b9d402f5d51fe.git ~/maka-env/nvm-install"
ssh -i $PEM_FILE -t $USER_NAM@$IP_ADDRS "rm -rf ~/.bash_profile ~/.bashrc"
ssh -i $PEM_FILE -t $USER_NAM@$IP_ADDRS "touch ~/.bash_profile ~/.bashrc && source ~/.bashrc"
ssh -i $PEM_FILE -t $USER_NAM@$IP_ADDRS "chmod +x ~/maka-env/nvm-install/nvm-install.sh && ~/maka-env/nvm-install/nvm-install.sh"
ssh -i $PEM_FILE -t $USER_NAM@$IP_ADDRS "nvm install 10.16.0 && nvm alias default 10.16.0"
ssh -i $PEM_FILE -t $USER_NAM@$IP_ADDRS "npm install -g pm2"
ssh -i $PEM_FILE -t $USER_NAM@$IP_ADDRS "rm -rf ~/maka-env/nvm-install"

# push up configurations
scp -i $PEM_FILE ./pm2.config.js $USER_NAM@$IP_ADDRS:~/pm2.config.js
scp -i $PEM_FILE ./settings.json $USER_NAM@$IP_ADDRS:~/settings.json
scp -i $PEM_FILE ./nginx.default.conf $USER_NAM@$IP_ADDRS:~/default

# push up ssl key and crt
cp $KEY_FILE ./<%= app %>.key
cp $CRT_FILE ./<%= app %>.crt
scp -i $PEM_FILE ./<%= app %>.key $USER_NAM@$IP_ADDRS:~/<%= app %>.key
scp -i $PEM_FILE ./<%= app %>.crt $USER_NAM@$IP_ADDRS:~/<%= app %>.crt

# stop nginx
ssh -i $PEM_FILE -t $USER_NAM@$IP_ADDRS "sudo nginx -s stop"

# move the files into place
ssh -i $PEM_FILE -t $USER_NAM@$IP_ADDRS "sudo cp ~/default /etc/nginx/sites-enabled/default"
ssh -i $PEM_FILE -t $USER_NAM@$IP_ADDRS "sudo mkdir -p /etc/nginx/ssl/"
ssh -i $PEM_FILE -t $USER_NAM@$IP_ADDRS "sudo mv ~/<%= app %>.key /etc/nginx/ssl/<%= app %>.key"
ssh -i $PEM_FILE -t $USER_NAM@$IP_ADDRS "sudo mv ~/<%= app %>.crt /etc/nginx/ssl/<%= app %>.crt"

# start nginx
ssh -i $PEM_FILE -t $USER_NAM@$IP_ADDRS "sudo nginx -s start"

# reload nginx to accept the new configuration
ssh -i $PEM_FILE -t $USER_NAM@$IP_ADDRS "sudo nginx -s reload"

# push up the bundle
scp -i $PEM_FILE ../../build/app.tar.gz $USER_NAM@$IP_ADDRS:~/app.tar.gz

# decompress the bundle
ssh -i $PEM_FILE -t $USER_NAM@$IP_ADDRS "tar -xf app.tar.gz && cd bundle/programs/server && npm install && npm audit fix --force && cd ~"

# if PM2 already has this app running, kill it.
ssh -i $PEM_FILE -t $USER_NAM@$IP_ADDRS "pm2 delete all"

# start the PM2 load balancer with configuration
ssh -i $PEM_FILE -t $USER_NAM@$IP_ADDRS "pm2 start ~/pm2.config.js"

# configure PM2 to start after reboot
ssh -i $PEM_FILE -t $USER_NAM@$IP_ADDRS "pm2 startup"
ssh -i $PEM_FILE -t $USER_NAM@$IP_ADDRS "pm2 startup systemd -u $USER_NAM --hp /home/$USER_NAM"
ssh -i $PEM_FILE -t $USER_NAM@$IP_ADDRS "pm2 save"

# cleanup
ssh -i $PEM_FILE -t $USER_NAM@$IP_ADDRS "rm ~/app.tar.gz"
