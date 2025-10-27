import Queue from 'queue';
import State from '../class/state.js';
import SocketConnection from './SocketConnection.js';
import log from './log.js';
// import { triggerAll } from './automation.js';

const connection = new SocketConnection();
let queue;

const handleStateChange = async (data) => {
  let state = State.findByEntityId(data.entity_id);
  if(state) {
    try {
      await state.processChange(data);
    } catch(err) {
      log.error('ERROR handling state change');
      log.error(err);
    }
  } else {
    state = State.add(data.entity_id, data);
  }
  // await triggerAll(state);
};

const connect = async (config) => {
  log.info(`Connecting to ${config.url}`);
  connection.configure(config);
  connection.on('connection', (info) => {
    log.info('Connection state:', info);
  });
  await connection.connect();
  log.info('Connected, requesting states');
  const states = await connection.getStates();
  log.info(`Got state for ${states.length} entities`);
  log.info('Starting state handler queue');
  queue = new Queue({ concurrency: 1, autostart: true });
  log.info('Processing initial states');
  await Promise.all(states.map((data) => handleStateChange(data)));
  return connection;
};

const listen = async () => {
  connection.on('state_changed', (data) => queue.push(async () => handleStateChange(data)));
  await connection.subscribe();
  log.info('Listening for state changes');
};

export {
  connect,
  listen,
};
