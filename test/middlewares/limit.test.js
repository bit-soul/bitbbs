const support = require('../support');
const midLimit = require('../../middlewares/limit');

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

      midPerIPPerday(ctx, support.emptyFunction);
      midPerIPPerday(ctx, support.emptyFunction);
      midPerIPPerday(ctx, support.emptyFunction);
      expect(ctx.status).toBeUndefined();
      midPerIPPerday(ctx, support.emptyFunction);
      expect(ctx.status).toequal(403);
    });
  });
});
