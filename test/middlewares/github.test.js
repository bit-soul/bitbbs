import config from '../../src/config/index.js';
import * as midGithub from '../../src/middlewares/github.js';

describe('middlewares/github', () => {
  describe('github', () => {
    test('should alert no github oauth', async () => {
      let ctx = {};

      const originalClientID = config.GITHUB_OAUTH.clientID;
      config.GITHUB_OAUTH.clientID = 'your GITHUB_CLIENT_ID';

      await midGithub.github(ctx, global.support.emptyFunction);
      expect(ctx.body).toBe('call the admin to set github oauth.');

      // restore original value
      config.GITHUB_OAUTH.clientID = originalClientID;
    });
  });
});

