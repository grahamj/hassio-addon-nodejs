const path = require('path');
const { connect, listen } = require('./lib/ha');
const log = require('./lib/log');
const automation = require('./lib/automation');

process.on('unhandledRejection', (err) => {
  log.error('Unhandled rejection:', err, err.stack);
});

process.on('unhandledException', (err) => {
  log.error('Unhandled exception:', err, err.stack);
});

['SIGTERM', 'SIGINT'].forEach((sig) => {
  process.on(sig, () => {
    log.info(`Clean exit due to signal ${sig}`);
    process.exit(0);
  });
});

const start = async () => {
  log.info('Welcome to Home Assistant Nodejs Support');

  const { SUPERVISOR_TOKEN, HA_AUTOMATION_DIR, HA_URL, HA_TOKEN } = process.env;
  const runningInHA = !!SUPERVISOR_TOKEN;

  const automationPath = runningInHA ? '/config/automations' : (HA_AUTOMATION_DIR || `${path.join(__dirname, '..', 'automation_examples')}`);
  const wsConfig = runningInHA ? {
    url: 'ws://supervisor/core/websocket',
    password: SUPERVISOR_TOKEN,
  } : {
    url: HA_URL,
    token: HA_TOKEN,
  };

  log.info(`Running ${runningInHA ? 'inside' : 'outside'} Home Assistant`);
  // log.info('Config', config);
  // log.info('Env', process.env);

  const connection = await connect(wsConfig);
  automation.start(automationPath, connection);
  await listen();
  log.info('Started');
};

start()
  .catch((err) => {
    log.error(err);
    process.exit(1);
  });
