import * as midLimit from '../../src/middlewares/limit.js';

describe('middlewares/limit', () => {
  describe('peripperday', () => {
    test('should visit', async () => {
      let ctx = {
        get: () => { return '127.0.0.1' },
        set: () => {},
        throw: () => {},
        render: () => {},
      };
      const midPerIPPerday = midLimit.peripperday('testapi', 3, { showJson: true });

      midPerIPPerday(ctx, global.support.emptyFunction);
      midPerIPPerday(ctx, global.support.emptyFunction);
      midPerIPPerday(ctx, global.support.emptyFunction);
      expect(ctx.status).toBeUndefined();
      midPerIPPerday(ctx, global.support.emptyFunction);
      expect(ctx.status).toequal(403);
    });
  });
});
