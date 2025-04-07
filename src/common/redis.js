var Redis = require('ioredis');
var logger = require('./logger')

var client = new Redis({
  port: global.config.redis_cfg.port,
  host: global.config.redis_cfg.host,
  db: global.config.redis_cfg.db,
  password: global.config.redis_cfg.password,
});

client.on('error', function (err) {
  if (err) {
    logger.error('connect to redis error, check your redis config', err);
    process.exit(1);
  }
})

exports = module.exports = client;
