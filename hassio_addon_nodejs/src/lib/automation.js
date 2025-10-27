import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';
import log from './log.js';
import State from '../class/state.js';
import Automation from '../class/automation.js';

const automations = new Map();
// const triggerable = new Map();
let connection;

const automationParams = () => {
  return { Automation, State, connection, log };
};

// const trigger = async (key, entity) => {
//   const automation = automations.get(key);
//   if(!automation || !automation.trigger) {
//     // log.warn(`Automation ${key} has no trigger`);
//     return;
//   }
//   try {
//     await automation.trigger({ trigger: entity, ...automationParams() });
//   } catch(err) {
//     log.error(`ERROR running automation ${key}`);
//     log.error(err);
//   }
// };

// export const triggerAll = async (entity) => {
//   await Promise.all([...triggerable.keys()].map((key) => trigger(key, entity)));
// };

// const removeAutomation = (key, fullPath) => {
//   if(!automations.has(key)) return;
//   const exist = automations.get(key);
//   log.info(`Removing automation ${key}`);
//   if(exist.unregister) {
//     try {
//       exist.unregister();
//     } catch(err) {
//       log.error(`Failed to unregister automation ${key}`);
//     }
//   }
//   const baseDir = path.dirname(fullPath);
//   Object.keys(require.cache).forEach((cachePath) => {
//     if(cachePath.startsWith(baseDir)) Reflect.deleteProperty(require.cache, cachePath);
//   });
//   triggerable.delete(key);
// };

const loadAutomation = async (key, fullPath) => {
  // if(automations.has(key)) removeAutomation(key, fullPath);
  log.info(`Loading automation ${key}`);
  // const classOrModule = require(fullPath); // eslint-disable-line import/no-dynamic-require,global-require
  const classOrModule = await import(fullPath); // eslint-disable-line import/no-dynamic-require,global-require
  const automation = classOrModule.init ? classOrModule.init(automationParams()) : classOrModule;
  automations.set(key, automation);
  // triggerable.set(key, !!automation.trigger);
  if(automation.register) automation.register(automationParams());
};

const stop = async () => {
  // eslint-disable-next-line array-callback-return
  await Promise.all([...automations.entries()].map(async ([key, automation]) => {
    log.info(`Unregistering automation ${key}`);
    if(!automation.unregister) return;
    try {
      await automation.unregister();
    } catch(err) {
      log.error(`Failed to unregister automation ${key}`);
    }
  }));
  await connection.close();
  process.exit(1);
};

const watch = (automationPath) => {
  log.info('Watching for automation file changes');
  chokidar
    .watch(automationPath, {
      ignored: (filePath, stats) => stats?.isFile() && !filePath.endsWith('.js'),
      persistent: true,
      depth: 1,
    })
    .on('all', async (event, fullPath) => {
      if(!fullPath.endsWith('.js')) return;
      const key = path.relative(automationPath, fullPath);
      // log.info(`Automation file event: ${event} ${key}`);
      switch(event) { // eslint-disable-line default-case
        case 'change':
          // removeAutomation(key, fullPath);
          // loadAutomation(key, fullPath);
          log.info('Exiting due to automation file change');
          stop();
          break;
        case 'add':
          await loadAutomation(key, fullPath);
          break;
        case 'unlink':
          // removeAutomation(key, fullPath);
          log.info('Exiting due to automation file deletion');
          stop();
          break;
      }
    });
};

export const start = (automationPath, wsConnection) => {
  connection = wsConnection;
  log.info(`Loading automations from ${automationPath}`);
  if(!fs.existsSync(automationPath)) {
    log.info('Path does not exist, creating');
    fs.mkdirSync(automationPath);
  }
  watch(automationPath);
};
