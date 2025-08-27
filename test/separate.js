beforeAll(async () => {
  const nock = (await import('nock')).default;
  const redis = (await import('../src/common/redis.js')).default;

  await redis.flushdb();
  await nock.enableNetConnect();
});

afterAll(async () => {
});
