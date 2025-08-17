import Redis from 'ioredis';
import logger from './logger.js';
import config from '../config/index.js';

const client = new Redis(config.ioredis_cfg);

client.on('error', function (err) {
  if (err) {
    logger.error('connect to redis error, check your redis config', err);
    process.exit(1);
  }
})

export default client;
