import fs from 'fs';
import path from 'path';
import log from './log.js';
import State from '../class/state.js';
import Automation from '../class/automation.js';

const { readdir } = fs.promises;
let automations;
let connection;

const automationParams = () => {
  return { Automation, State, connection, log };
};

const loadAutomation = async (key, fullPath) => {
  log.info(`Loading automation ${key}`);
  // eslint-disable-next-line import/no-dynamic-require,global-require
  const classOrModule = await import(fullPath);
  const automation = classOrModule.init ? classOrModule.init(automationParams()) : classOrModule;
  return automation;
};

const loadAutomationsFromPath = async (automationPath) => {
  const entries = await readdir(automationPath, { withFileTypes: true });
  const subdirs = entries.filter((e) => e.isDirectory());
  const fileLists = await Promise.all(subdirs.map(async (subdir) => {
    const subdirPath = path.join(automationPath, subdir.name);
    const subEntries = await readdir(subdirPath, { withFileTypes: true });
    return subEntries
      .filter((e) => e.isFile() && e.name.endsWith('.js'))
      .map((file) => ({
        key: path.join(subdir.name, file.name),
        fullPath: path.join(subdirPath, file.name),
      }));
  }));
  const allFiles = fileLists.flat();
  return Promise.all(allFiles.map(async ({ key, fullPath }) => {
    try {
      const automation = await loadAutomation(key, fullPath);
      return automation;
    } catch {
      throw new Error(`Failed to load automation ${key}`);
    }
  }));
};

export const init = async (automationPath, wsConnection) => {
  connection = wsConnection;
  log.info(`Loading automations from ${automationPath}`);
  automations = await loadAutomationsFromPath(automationPath);

  // Find what tracked entities the automations need
  // If any automation doesn't provide any, track everything
  const trackedEntities = new Set();
  let trackAllEntities;
  automations.forEach((automation) => {
    if(!automation) return;
    let didSetTrackedEntities = false;
    if(automation.getConfig) {
      const config = automation.getConfig();
      if(config.trackEntities && config.trackEntities.length) {
        config.trackEntities.forEach((entity) => trackedEntities.add(entity));
        didSetTrackedEntities = true;
      }
    }
    if(!didSetTrackedEntities) trackAllEntities = true;
  });
  if(!trackAllEntities) return trackedEntities;
};

export const start = async () => {
  log.info('Registering automations');
  if(!automations) throw new Error('automations not initialized');
  const params = automationParams();
  automations.forEach((automation) => {
    if(automation?.register) automation.register(params);
  });

};
