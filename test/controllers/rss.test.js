const app = require('../../app');
const request = require('supertest');
const proxyTopic = require('../../proxy/topic');

describe('controllers/rss', () => {
  describe('/rss', () => {
    test('should return `application/xml` Content-Type', async () => {
      const res = await request(app).get('/rss');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/xml; charset=utf-8');
      expect(res.text.startsWith('<?xml version="1.0" encoding="utf-8"?>')).toBe(true);
      expect(res.text).toContain('<rss version="2.0">');
      expect(res.text).toContain(`<channel><title>${global.config.rss.title}</title>`);
    });

    describe('mock `config.rss` not set', () => {
      const originalRss = global.config.rss;
      beforeAll(() => {
        global.config.rss = null;
      });
      afterAll(() => {
        global.config.rss = originalRss;
      });
      test('should return warning message', async () => {
        const res = await request(app).get('/rss');
        expect(res.status).toBe(404);
        expect(res.text).toBe('Please set `rss` in config.js');
      });
    });

    describe('mock `topic.getTopicsByQuery()` error', () => {
      const originalFn = proxyTopic.getTopicsByQuery;
      beforeAll(() => {
        proxyTopic.getTopicsByQuery = function (...args) {
          const callback = args[args.length - 1];
          process.nextTick(() => callback(new Error('mock getTopicsByQuery() error')));
        };
      });
      afterAll(() => {
        proxyTopic.getTopicsByQuery = originalFn;
      });
      test('should return error', async () => {
        const res = await request(app).get('/rss');
        expect(res.status).toBe(500);
        expect(res.text).toContain('mock getTopicsByQuery() error');
      });
    });
  });
});
