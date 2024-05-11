const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const log = require('./log');
// const ha = require('./ha');
const Entity = require('../class/entity.js');

const automations = new Map();
const triggerable = new Map();

const automationParams = () => ({ Entity, log });

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
  if(exist.unregister) exist.unregister();
  Reflect.deleteProperty(require.cache, require.resolve(fullPath));
  triggerable.delete(key);
};

const loadAutomation = (key, fullPath) => {
  const classOrModule = require(fullPath); // eslint-disable-line import/no-dynamic-require,global-require
  const automation = classOrModule.class ? new (classOrModule.class)(automationParams()) : classOrModule; // eslint-disable-line new-cap
  automations.set(key, automation);
  triggerable.set(key, !!automation.trigger);
  if(automation.register) automation.register(automationParams());
  log.info(`Loaded automation: ${key}`);
};

const watch = (automationPath) => {
  log.info('Watching for automation file changes');
  chokidar
    .watch(automationPath, { ignored: /^\./, persistent: true, depth: 99 })
    .on('all', (event, fullPath) => {
      const key = path.relative(automationPath, fullPath);
      log.info(`Automation file event: ${event} ${key}`);
      if(event === 'change' || event === 'unlink') removeAutomation(key, fullPath);
      if(event === 'change' || event === 'add') loadAutomation(key, fullPath);
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
