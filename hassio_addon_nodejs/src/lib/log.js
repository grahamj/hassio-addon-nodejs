const util = require('util');
const clc = require('cli-color');

const log = ((type, color, args) => {
  if(color) {
    // eslint-disable-next-line no-console
    console[type](...args.map(((arg) => color(typeof arg === 'object' ? util.inspect(arg) : arg))));
  } else {
    // eslint-disable-next-line no-console
    console[type](...args);
  }
});

module.exports = {
  debug: (...args) => log('debug', clc.xterm(242), args),
  info: (...args) => log('info', undefined, args),
  warning: (...args) => log('warning', clc.yellowBright, args),
  error: (...args) => log('error', clc.redBright, args),
};
