const path = require('path')
const log4js = require('log4js');

const env = process.env.NODE_ENV || "development"
const level = global.config.debug && env !== 'test' ? 'debug' : 'error';

log4js.configure({
  appenders: {
    console: { type: 'console' },
    cheese: {
      type: 'file',
      filename: path.join(global.config.log_dir, 'cheese.log'),
    }
  },
  categories: {
    default: { appenders: ['console'], level },
    cheese: { appenders: ['cheese'], level },
  }
});

module.exports = log4js.getLogger('default');
