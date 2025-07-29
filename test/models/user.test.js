const modelUser = require('../../src/models/user');

describe('models/user', () => {
  describe('avatar_url', () => {
    test('should return proxy avatar url', () => {
      const user = new modelUser({ email: 'alsotang@gmail.com' });
      expect(user.avatar_url).toBe(global.config.site_static_host + '/static/img/nobody.png');
    });
  });
});
