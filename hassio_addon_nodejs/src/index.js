import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { connect, listen } from './lib/ha.js';
import { start as startAutomation } from './lib/automation.js';
import log from './lib/log.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

const run = async () => {
  log.info('Welcome to Home Assistant Nodejs Support');

  const { SUPERVISOR_TOKEN, HA_AUTOMATION_DIR, HA_URL, HA_TOKEN } = process.env;
  const runningInHA = !!SUPERVISOR_TOKEN;

  const automationPath = runningInHA ? '/config/automations' : (HA_AUTOMATION_DIR || `${join(__dirname, '..', 'automation_examples')}`);
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
  startAutomation(automationPath, connection);
  // eslint-disable-next-line no-promise-executor-return
  await new Promise((resolve) => setTimeout(resolve, 1000));
  await listen();
  log.info('Started');
};

run()
  .catch((err) => {
    log.error(err);
    process.exit(1);
  });
