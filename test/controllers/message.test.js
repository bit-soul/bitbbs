const request = require('supertest');
const support = require('../support');

describe('controllers/message', () => {
  describe('index', () => {
    test('should return 403 without session', async () => {
      const res = await request(global.server).get('/my/messages');
      expect(res.statusCode).toBe(403);
      expect(res.type).toBe('text/html');
      expect(res.text).toContain('forbidden!');
    });

    test('should return 200 with session', async () => {
      const res = await request(global.server)
        .get('/my/messages')
        .set('Cookie', support.normalUserCookie);
      expect(res.statusCode).toBe(200);
      expect(res.text).toContain('新消息');
    });
  });
});

