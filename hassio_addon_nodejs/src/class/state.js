const priv = Symbol('private');
const entityMap = new Map();

class State {

  constructor(entityId, data) {
    if(entityMap.get(entityId)) {
      throw new Error(`Cannot instantiate more than one State with the same entityID (${entityId})`);
    }
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
    if(data) this.set(data);
    entityMap.set(entityId, data);
  }

  set(data) {
    Object.assign(this, {
      state: data.state,
      attributes: data.attributes,
      lastChange: new Date(data.last_changed),
      lastUpdate: new Date(data.last_updated),
    });
  }

  processChange(data) {
    // log.info(`State state change: ${this.entityId}: ${data.old_state.state} -> ${data.new_state.state}`);
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
    this.handleChange();
  }

  get manualContext() {
    return this.context && this.context.id && !this.context.parent_id && !this.context.user_id;
  }

  handleChange() {
    this[priv].stateChangeHandlers.forEach((handler) => handler(this));
  }

  onChange(handler) {
    this[priv].stateChangeHandlers.push(handler);
  }

  removeChangeHandler(handler) {
    this[priv].stateChangeHandlers = this[priv].stateChangeHandlers.filter((h) => h !== handler);
  }

  static add(entityId, data) {
    const newState = new State(entityId, data);
    entityMap.set(entityId, newState);
    return newState;
  }

  static findByEntityId(entityId) {
    return entityMap.get(entityId);
  }

}

module.exports = State;
