beforeAll(async () => {
  // eslint-disable-next-line node/no-unpublished-import
  var nock = (await import('nock')).default;
  var redis = (await import('../src/common/redis.js')).default;

  await redis.flushdb();
  await nock.enableNetConnect();
});

afterAll(async () => {
});
