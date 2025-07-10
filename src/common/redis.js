const Redis = require('ioredis');
const logger = require('./logger')

const client = new Redis(global.config.ioredis_cfg);

client.on('error', function (err) {
  if (err) {
    logger.error('connect to redis error, check your redis config', err);
    process.exit(1);
  }
})

module.exports = client;
