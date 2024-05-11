const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const log = require('./log');

const automations = {};

const runAll = (params) => {
  Object.values(automations).forEach((a) => a.run(params));
};

const loadAutomation = (automationPath, fullPath) => {
  const automationKey = path.relative(automationPath, fullPath);
  if(automations[automationKey]) {
    if(automations[automationKey].unregister) automations[automationKey].unregister();
    Reflect.deleteProperty(require.cache, require.resolve(fullPath));
  }
  automations[automationKey] = require(fullPath); // eslint-disable-line import/no-dynamic-require,global-require
  if(automations[automationKey].class) automations[automationKey] = new (automations[automationKey].class)(); // eslint-disable-line new-cap
  if(automations[automationKey].register) automations[automationKey].register();
  log.info(`Loaded automation: ${automationKey}`);
};

const watch = (automationPath) => {
  log.info('Watching for automation file changes');
  chokidar
    .watch(automationPath, { ignored: /^\./, persistent: true, depth: 99 })
    .on('all', (event, fullPath) => {
      // log.info(`Automation file event: ${event} ${fullPath}`);
      if(['add', 'change'].includes(event)) loadAutomation(automationPath, fullPath);
    });
};

const start = (automationPath) => {
  log.info(`Loading automations from ${automationPath}`);
  if(!fs.existsSync(automationPath)) {
    log.info('Path does not exist, creating');
    fs.mkdirSync(automationPath);
  }
  watch(automationPath);
};

module.exports = {
  start,
  runAll,
};
