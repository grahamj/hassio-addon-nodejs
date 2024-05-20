const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const log = require('./log');
// const ha = require('./ha');
const State = require('../class/state.js');
const Automation = require('../class/automation.js');

const automations = new Map();
const triggerable = new Map();

const automationParams = () => ({ Automation, State, log });

const trigger = (key, entity) => {
  const automation = automations.get(key);
  if(!automation || !automation.trigger) {
    // log.warn(`Automation ${key} has no trigger`);
    return;
  }
  try {
    automation.trigger({ trigger: entity, ...automationParams() });
  } catch(err) {
    log.error(`ERROR running automation ${key}`);
    log.error(err);
  }
};

const triggerAll = (entity) => triggerable.forEach((junk, key) => trigger(key, entity));

const removeAutomation = (key, fullPath) => {
  if(!automations.has(key)) return;
  const exist = automations.get(key);
  log.info(`Removing automation ${key}`);
  if(exist.unregister) {
    try {
      exist.unregister();
    } catch(err) {
      log.error(`Failed to unregister automation ${key}`);
    }
  }
  Reflect.deleteProperty(require.cache, require.resolve(fullPath));
  triggerable.delete(key);
};

const loadAutomation = (key, fullPath) => {
  if(automations.has(key)) removeAutomation(key, fullPath);
  log.info(`Loading automation ${key}`);
  const classOrModule = require(fullPath); // eslint-disable-line import/no-dynamic-require,global-require
  const automation = classOrModule.init ? classOrModule.init(automationParams()) : classOrModule;
  automations.set(key, automation);
  triggerable.set(key, !!automation.trigger);
  if(automation.register) automation.register(automationParams());
};

const watch = (automationPath) => {
  log.info('Watching for automation file changes');
  chokidar
    .watch(automationPath, { ignored: /^\./, persistent: true, depth: 99 })
    .on('all', (event, fullPath) => {
      if(!fullPath.endsWith('.js')) return;
      const key = path.relative(automationPath, fullPath);
      // log.info(`Automation file event: ${event} ${key}`);
      switch(event) { // eslint-disable-line default-case
        // case 'change':
        case 'add':
          loadAutomation(key, fullPath);
          break;
        case 'unlink':
          removeAutomation(key, fullPath);
          break;
      }
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
  triggerAll,
};
