const app = require('../../app');
const request = require('supertest');

describe('controllers/search', () => {
  test('should redirect to google search', async () => {
    const res = await request(app)
      .get('/search')
      .query({ q: 'node 中文' })
      .expect(302);

    expect(res.headers['location']).toBe(
      'https://www.google.com.hk/#hl=zh-CN&q=site:cnodejs.org+node%20%E4%B8%AD%E6%96%87'
    );
  });
});

