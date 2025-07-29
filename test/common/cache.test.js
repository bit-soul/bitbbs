var cache = require('../../src/common/cache');
var tools = require('../../src/common/tools');

describe('common/cache', () => {
  test('set then get', async () => {
    cache.set('alsotang', { age: 23 });
    const data = cache.get('alsotang');
    expect(data).toEqual({ age: 23 });
  });

  test('should expire', async () => {
    cache.set('alsotang', { age: 23 }, 1);
    await tools.sleep(3000);
    const data = cache.get('alsotang');
    expect(data).toBeUndefined();
  });
});
