const redis  = require('./redis');
const logger = require('./logger');

exports.get = async function (key) {
  const t = new Date();
  const data = await redis.get(key);
  const duration = (new Date() - t);
  logger.debug('Cache', 'get', key, (duration + 'ms'));

  if (!data) {return null;}
  return JSON.parse(data);
};

exports.set = async function (key, value, time = null) {
  const t = new Date();
  const serialized = JSON.stringify(value);
  try {
    if (!time) {
      await redis.set(key, serialized);
    } else {
      await redis.setex(key, time, serialized);
    }
  } finally {
    const duration = (new Date() - t);
    logger.debug('Cache', 'set', key, (duration + 'ms'));
  }
};
