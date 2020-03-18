FROM debian:stretch-slim

# Replace shell with bash so we can source files
RUN rm /bin/sh && ln -s /bin/bash /bin/sh

# make sure apt is up to date
RUN apt-get update --fix-missing
RUN apt-get install -y curl
RUN apt-get install -y build-essential libssl-dev

ENV NVM_DIR /usr/local/nvm
ARG NODE_VERSION

# Install nvm with node and npm
RUN curl https://gist.githubusercontent.com/maka-io/c427ccd6f4377b39299b9d402f5d51fe/raw/0846e668ae334cf3782ce6f9ba5f5dd6c07a69c0/nvm-install.sh | bash \
    && source $NVM_DIR/nvm.sh \
    && nvm install $NODE_VERSION \
    && nvm alias default $NODE_VERSION \
    && nvm use default \
    && npm install -g pm2

ENV NODE_PATH $NVM_DIR/$NODE_VERSION/lib/node_modules
ENV PATH      $NVM_DIR/versions/node/$NODE_VERSION/bin:$PATH

RUN mkdir /usr/app
RUN mkdir /usr/app/log

WORKDIR /usr/app

# log dir
VOLUME /usr/app/log

# Copy and unpack bundle
WORKDIR /home/ubuntu
COPY app.tar.gz .
RUN tar xzvf app.tar.gz

# Install the app dependencies
WORKDIR /home/ubuntu/bundle/programs/server
RUN npm install
RUN npm audit fix --force

# Remove setup packages
RUN apt-get remove -y curl
RUN apt-get remove -y build-essential libssl-dev


WORKDIR /home/ubuntu
EXPOSE 3000

CMD ["pm2-runtime", "pm2.config.js"]
