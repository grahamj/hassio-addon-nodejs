#!/usr/bin/with-contenv sh

echo "Starting hassio-addon-node"
# echo "Token: $SUPERVISOR_TOKEN"

if [ -f "/config/package.json" ]; then
  cd /config
  npm i --omit=dev
  cd -
fi

npm start
