const entities = require('./entities.js');
const connection = require('./connection.js');
const SocketConnection = require('./SocketConnection.js');
const log = require('./log.js');

const runningInHA = !!process.env.SUPERVISOR_TOKEN;
log.info(`Running ${runningInHA ? 'inside' : 'outside'} Home Assistant`);

const config = runningInHA ? {
  url: 'ws://supervisor/core/websocket',
  password: process.env.SUPERVISOR_TOKEN,
} : {
  url: process.env.HA_URL,
  token: process.env.HA_TOKEN,
};
log.info('Config', config, process.env);

const ha = new SocketConnection();

const handleStateChange = (data) => {
  const entityObj = entities.getByEntityId(data.entity_id);
  log.info(`Entity state change: ${data.entity_id} - ${data.old_state.state} -> ${data.new_state.state}`);
  if(entityObj) {
    log.debug(`ha state_changed - ${data.entity_id} - ${data.old_state.state} -> ${data.new_state.state}`);
    entityObj.processStateChange(data);
  }
};

const handleState = (data) => {
  const entityObj = entities.getByEntityId(data.entity_id);
  if(entityObj) entityObj.setState(data);
};

const getStates = async () => {
  const states = await ha.getStates();
  log.info(`Got state for ${states.length} entities`);
  states.forEach((data) => handleState(data));
};

const connect = async () => {
  log.info('Connecting');
  ha.configure(config);
  ha.on('connection', (info) => {
    log.info('Connection state:', info);
  });
  ha.on('state_changed', (data) => handleStateChange(data));
  await ha.connect();
  log.info('Connected, requesting states');
  await getStates();
  log.info('Running');
  connection.set(ha);
};

module.exports = {
  ha,
  connect,
  getStates,
};
