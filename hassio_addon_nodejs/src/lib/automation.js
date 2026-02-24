import fs from 'fs';
import path from 'path';
import log from './log.js';
import State from '../class/state.js';
import Automation from '../class/automation.js';

const { readdir } = fs.promises;
const automations = new Map();
let connection;

const automationParams = () => {
  return { Automation, State, connection, log };
};

const loadAutomation = async (key, fullPath) => {
  log.info(`Loading automation ${key}`);
  // eslint-disable-next-line import/no-dynamic-require,global-require
  const classOrModule = await import(fullPath);
  const automation = classOrModule.init ? classOrModule.init(automationParams()) : classOrModule;
  automations.set(key, automation);
  if(automation.register) automation.register(automationParams());
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
  await Promise.all(allFiles.map(async ({ key, fullPath }) => {
    try {
      await loadAutomation(key, fullPath);
    } catch {
      throw new Error(`Failed to load automation ${key}`);
    }
  }));
};

export const start = async (automationPath, wsConnection) => {
  connection = wsConnection;
  log.info(`Loading automations from ${automationPath}`);
  await loadAutomationsFromPath(automationPath);
};
