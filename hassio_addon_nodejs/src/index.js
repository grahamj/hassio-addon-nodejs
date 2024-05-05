// const fs = require('fs');
// const { join } = require('path');
const { connect } = require('./lib/ha.js');
const log = require('./lib/log.js');
// const home = require('./home');
// const entities = require('./home/entities');

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

// const registerAutomations = async () => {
//   const automationDir = join(__dirname, 'home', 'automation');
//   const files = fs.readdirSync(automationDir);
//   await Promise.all(files.map(async (file) => {
//     if(!file.endsWith('.js')) return;
//     log.info(`Registering ${file}`);
//     // eslint-disable-next-line import/no-dynamic-require, global-require
//     const automation = require(join(automationDir, file));
//     automation.register();
//   }));
//   log.info('Registration complete');
// };

const start = async () => {
  log.info('Home Assistant Nodejs Support Started');
  // await entities.register();
  await connect();
  // home.build();
  // await getStates();
  // await registerAutomations();
};

start()
  .catch((err) => {
    log.error(err);
    process.exit(1);
  });
