const path = require('path')
const log4js = require('log4js');

const env = process.env.NODE_ENV || "development"

log4js.configure({
  appenders: [
    { type: 'console' },
    { type: 'file', filename: path.join(global.config.log_dir, 'cheese.log'), category: 'cheese' }
  ]
});

var logger = log4js.getLogger('cheese');
logger.setLevel(config.debug && env !== 'test' ? 'DEBUG' : 'ERROR')

module.exports = logger;
