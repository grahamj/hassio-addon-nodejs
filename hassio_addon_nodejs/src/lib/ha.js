const Entity = require('../class/entity.js');
const SocketConnection = require('./SocketConnection.js');
const log = require('./log.js');
const automation = require('./automation.js');

const ha = new SocketConnection();

const handleStateChange = (data) => {
  const trigger = Entity.findById(data.entity_id);
  if(trigger) {
    trigger.processStateChange(data);
  } else {
    Entity.add(data.entity_id, data);
  }
  automation.triggerAll(trigger);
};

const connect = async (config) => {
  log.info(`Connecting to ${config.url}`);
  ha.configure(config);
  ha.on('connection', (info) => {
    log.info('Connection state:', info);
  });
  await ha.connect();
  log.info('Connected, requesting states');
  const states = await ha.getStates();
  log.info(`Got state for ${states.length} entities`);
  states.forEach(handleStateChange);
};

const listen = async () => {
  ha.on('state_changed', handleStateChange);
  log.info('Listening for state changes');
};

module.exports = {
  connect,
  listen,
  getConnection: () => ha,
};
