const util = require('util');
const clc = require('cli-color');

const log = ((type, color, args) => {
  const t = new Date();
  const pad = (str) => String(str).padStart(2, '0');
  const time = `[${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())} ${pad(t.getHours())}:${pad(t.getMinutes())}:${pad(t.getSeconds())}]`;
  if(color) {
    // eslint-disable-next-line no-console
    console[type](time, ...args.map(((arg) => color(typeof arg === 'object' ? util.inspect(arg) : arg))));
  } else {
    // eslint-disable-next-line no-console
    console[type](time, ...args);
  }
});

module.exports = {
  debug: (...args) => log('debug', clc.xterm(242), args),
  info: (...args) => log('info', undefined, args),
  warn: (...args) => log('warn', clc.yellowBright, args),
  error: (...args) => log('error', clc.redBright, args),
};
