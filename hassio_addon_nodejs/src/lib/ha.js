const State = require('../class/state.js');
const SocketConnection = require('./SocketConnection.js');
const log = require('./log.js');
const automation = require('./automation.js');

const socket = new SocketConnection();

const handleStateChange = (data) => {
  let state = State.findByEntityId(data.entity_id);
  if(state) {
    state.processChange(data);
  } else {
    state = State.add(data.entity_id, data);
  }
  automation.triggerAll(state);
};

const connect = async (config) => {
  log.info(`Connecting to ${config.url}`);
  socket.configure(config);
  socket.on('connection', (info) => {
    log.info('Connection state:', info);
  });
  await socket.connect();
  log.info('Connected, requesting states');
  const states = await socket.getStates();
  log.info(`Got state for ${states.length} entities`);
  states.forEach(handleStateChange);
};

const listen = async () => {
  socket.on('state_changed', handleStateChange);
  log.info('Listening for state changes');
};

module.exports = {
  connect,
  listen,
};
