var modelUser = require('../../models/user');

describe('models/user', function () {
  describe('avatar_url', function () {
    test('should return proxy avatar url', function () {
      var user = new modelUser({email: 'alsotang@gmail.com'});
      user.avatar_url.should.eql(global.config.site_static_host + '/static/img/nobody.png');
    });
  });
});
