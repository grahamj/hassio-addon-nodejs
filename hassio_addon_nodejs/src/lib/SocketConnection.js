import EventEmitter from 'events';
import WebSocket from 'ws';
import log from './log.js';

const defaultConfig = {
  retryTimeout: 5000,
  timeout: 5000,
  port: 8123,
};

class SocketConnection extends EventEmitter {

  constructor(options = {}) {
    super();
    Object.assign(this, {
      id: 1,
      config: {},
      replyHandlers: new Map(),
      eventSubIds: [],
    });
    this.configure({ ...defaultConfig, ...options });
    this.setMaxListeners(100);
  }

  configure(config = {}) {
    Object.assign(this.config, config);
  }

  async connect() {
    if(!this.config.password && !this.config.token) throw new Error('SocketConnection requires password or token');
    this.ws = new WebSocket(this.config.url);

    this.ws.on('message', (data) => {
      const parsedData = JSON.parse(data);
      const { id, type } = parsedData;

      if(type === 'auth_ok') {
        this.emit('connection', 'authenticated');
        return;
      }

      if(type === 'auth_required') {
        if(this.config.token) return this.send({ type: 'auth', access_token: this.config.token }, false);
        return this.send({ type: 'auth', api_password: this.config.password }, false);
      }

      if(type === 'auth_invalid') {
        throw new Error('Invalid password');
      }

      if(!id || !this.replyHandlers.has(id)) return;
      const { timeout, callback, persist } = this.replyHandlers.get(id);
      if(timeout) clearTimeout(timeout);
      if(callback) callback(parsedData);
      if(!persist) this.replyHandlers.delete(id);
    });

    this.ws.on('open', () => {
      this.emit('connection', 'connected');
      if(this.retry) {
        clearTimeout(this.retry);
        this.retry = null;
      }
    });

    this.ws.on('error', () => {
      this.emit('connection', 'connection_error');
      this.reconnect();
    });

    this.ws.on('close', () => {
      this.emit('connection', 'connection_closed');
      this.reconnect();
    });

    await new Promise((resolve) => {
      this.on('connection', (info) => {
        if(info === 'authenticated') resolve(this);
      });
    });

  }

  reconnect() {
    if(this.retry) return true;

    this.retry = setInterval(() => {
      try {
        this.emit('connection', 'reconnecting');
        this.connect();
      } catch(err) {
        // noop
      }
    }, this.config.retryTimeout);
  }

  async callService(options) {
    const response = await this.send({ type: 'call_service', ...options });
    if(!response.success) throw Object.assign(new Error(), response.error);
    return response.result;
  }

  get nextid() {
    this.id++;
    if(this.id > 65534) this.id = 2;
    while(this.replyHandlers.has(this.id)) this.id++;
    return this.id;
  }

  async send(data, addId = true) {
    const newData = structuredClone(data);
    if(addId) newData.id = this.nextid;
    if(newData.id) {
      return new Promise((resolve, reject) => {
        this.replyHandlers.set(newData.id, {
          timeout: setTimeout(() => {
            return reject(new Error(`No response received for ID ${newData.id}`));
          }, this.config.timeout),
          callback: (...args) => {
            resolve(...args);
          },
        });
        this.ws.send(JSON.stringify(newData));
      });
    }
    this.ws.send(JSON.stringify(newData));
  }

  async subscribeAllEvents() {
    log.info('Subscribing to event updates');
    const data = { type: 'subscribe_events' };
    const response = await this.send(data, true, true);
    if(!response.success) throw Object.assign(new Error(), response.error);
    this.eventSubIds.push(response.id);
    this.replyHandlers.set(response.id, {
      callback: (change) => {
        this.emit(change.event.event_type, structuredClone(change.event.data));
      },
      timeout: undefined,
      persist: true,
    });
    return response;
  }

  async subscribeTrigger(trigger) {
    log.info(`Subscribing to trigger for ${trigger.entity_id}`);
    const data = { type: 'subscribe_trigger', trigger };
    const response = await this.send(data, true, true);
    if(!response.success) throw Object.assign(new Error(), response.error);
    this.eventSubIds.push(response.id);
    this.replyHandlers.set(response.id, {
      callback: (change) => {
        this.emit(change.event.event_type, structuredClone(change.event.data));
      },
      timeout: undefined,
      persist: true,
    });
    return response;
  }

  async unsubscribe(subscription) {
    log.info('Unsubscribing from event updates');
    const response = await this.send({
      type: 'unsubscribe_events',
      subscription,
    });
    this.replyHandlers.delete(subscription);
    return response;
  }

  async close() {
    if(this.eventSubIds) await Promise.all(this.eventSubIds.map((id) => this.unsubscribe(id)));
    log.info('Closing websocket');
    this.ws.close();
  }

  async getStates() {
    const response = await this.send({ type: 'get_states' });
    if(!response.success) throw Object.assign(new Error(), response.error);
    return response.result;
  }

}

export default SocketConnection;
