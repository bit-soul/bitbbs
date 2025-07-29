const support = require('../support');
const midGithub  = require('../../src/middlewares/github');

describe('middlewares/github', () => {
  describe('github', () => {
    test('should alert no github oauth', async () => {
      let ctx = {};

      const originalClientID = global.config.GITHUB_OAUTH.clientID;
      global.config.GITHUB_OAUTH.clientID = 'your GITHUB_CLIENT_ID';

      await midGithub.github(ctx, support.emptyFunction);
      expect(ctx.body).toBe('call the admin to set github oauth.');

      // restore original value
      global.config.GITHUB_OAUTH.clientID = originalClientID;
    });
  });
});

