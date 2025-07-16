const pgsql = require('pg');
var nock = require('nock');
var redis = require('../common/redis');

// eslint-disable-next-line no-undef
beforeAll(() => {
  global.env = 'local';
  global.config = require('../src/config/local');
  pgsql.types.setTypeParser(20, parseInt); //INT8 type number is 20
  global.dbPool = new pgsql.Pool(global.config.pg_config);
  nock.enableNetConnect();
  redis.flushdb();
});

// eslint-disable-next-line no-undef
afterAll(() => {
  global.dbPool.end();
});
