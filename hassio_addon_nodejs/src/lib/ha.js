import Queue from 'queue';
import State from '../class/state.js';
import SocketConnection from './SocketConnection.js';
import log from './log.js';

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
};

const connect = async (config) => {
  log.info(`Connecting to ${config.url}`);
  connection.configure(config);
  connection.on('connection', (info) => {
    log.info('Connection state:', info);
  });
  await connection.connect();
  log.info('Connected');
  return connection;
};

// Get initial states for tracked or all entities
const initStates = async (trackedEntities) => {
  if(trackedEntities) {
    log.info(`Tracking ${[...trackedEntities].join(', ')}`);
  } else {
    log.info('Tracking all entities');
  }

  log.info('Starting state handler queue');
  queue = new Queue({ concurrency: 1, autostart: true });

  log.info('Requesting initial states');
  const states = await connection.getStates();
  const handleStates = !trackedEntities ? states : states.filter((data) => trackedEntities.has(data.entity_id));

  log.info('Processing initial states');
  await Promise.all(handleStates.map((data) => handleStateChange(data)));
};

const listen = async (trackedEntities) => {
  connection.on('state_changed', (data) => {
    if(trackedEntities && !trackedEntities.has(data.entity_id)) return;
    queue.push(async () => handleStateChange(structuredClone(data)));
  });
  await connection.subscribeAllEvents();
  log.info('Listening for state changes');
};

export {
  connect,
  initStates,
  listen,
};
