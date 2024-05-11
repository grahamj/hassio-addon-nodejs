#!/usr/bin/with-contenv sh

echo "Starting hassio-addon-node"
echo "Token: $SUPERVISOR_TOKEN"

npm start
