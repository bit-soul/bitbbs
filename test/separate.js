beforeAll(async () => {
  var nock = require('nock');
  var redis = require('../src/common/redis')

  await redis.flushdb();
  await nock.enableNetConnect();
});

afterAll(async () => {
});