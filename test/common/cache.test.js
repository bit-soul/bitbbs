import * as cache from '../../src/common/cache.js';
import * as tools from '../../src/common/tools.js';


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
