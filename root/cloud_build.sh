#!/bin/bash
export NVM_DIR=/home/pipeline/nvm
export NODE_VERSION=10.15.1
export NPM_VERSION=6.9.0
export NVM_VERSION=0.33.8

npm config delete prefix \
  && curl https://raw.githubusercontent.com/creationix/nvm/v${NVM_VERSION}/install.sh | sh \
  && . $NVM_DIR/nvm.sh \
  && nvm install $NODE_VERSION \
  && nvm alias default $NODE_VERSION \
  && nvm use default \
  && node -v \
  && npm -v

npm install gulp -g
npm install
# gulp load-deps
# gulp build-all
# npm run test-report