const config  = require('../../config');
const support = require('../support');
const midGithub  = require('../../middlewares/github');

describe('middlewares/github', () => {
  describe('github', () => {
    test('should alert no github oauth', async () => {
      let ctx = {};

      const originalClientID = config.GITHUB_OAUTH.clientID;
      config.GITHUB_OAUTH.clientID = 'your GITHUB_CLIENT_ID';

      await midGithub.github(ctx, support.emptyFunction);
      expect(ctx.body).toBe('call the admin to set github oauth.');

      // restore original value
      config.GITHUB_OAUTH.clientID = originalClientID;
    });
  });
});

