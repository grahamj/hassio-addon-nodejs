const log = require('../lib/log.js');

const priv = Symbol('private');
const entityMap = new Map();

class Entity {

  constructor(entityId, data) {
    if(entityMap.get(entityId)) {
      throw new Error(`Cannot instantiate more than one Entity with the same entityID (${entityId})`);
    }
    // log.info(`Creating entity instance ${entityId}`);
    this[priv] = {
      stateChangeHandlers: [],
    };
    Object.assign(this, {
      entityId,
      state: undefined,
      attributes: {},
      lastChange: undefined,
      lastUpdate: undefined,
      context: undefined,
      event: undefined,
    });
    if(data) this.setState(data);
    entityMap.set(entityId, data);
  }

  setState(data) {
    Object.assign(this, {
      state: data.state,
      attributes: data.attributes,
      lastChange: new Date(data.last_changed),
      lastUpdate: new Date(data.last_updated),
    });
  }

  processStateChange(data) {
    // log.info(`Entity state change: ${this.entityId}: ${data.old_state.state} -> ${data.new_state.state}`);
    Object.assign(this, {
      state: data.new_state.state,
      previousState: data.old_state.state,
      attributes: data.new_state.attributes,
      lastChange: new Date(data.new_state.last_changed),
      lastUpdate: new Date(data.new_state.last_updated),
      context: data.context,
      event: {
        newState: data.new_state,
        oldState: data.old_state,
      },
    });
    this.handleStateChange();
  }

  get manualContext() {
    return this.context && this.context.id && !this.context.parent_id && !this.context.user_id;
  }

  handleStateChange() {
    this[priv].stateChangeHandlers.forEach((handler) => handler(this));
  }

  onStateChange(handler) {
    this[priv].stateChangeHandlers.push(handler);
  }

  static add(entityId, data) {
    entityMap.set(entityId, new Entity(entityId, data));
  }

  static findById(entityId) {
    return entityMap.get(entityId);
  }

}

module.exports = Entity;
