const app = require('../../app');
const request = require('supertest');

describe('controllers/site', () => {

  test('should / 200', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('积分榜');
    expect(res.text).toContain('友情社区');
  });

  test('should /?page=-1 200', async () => {
    const res = await request(app).get('/?page=-1');
    expect(res.status).toBe(200);
    expect(res.text).toContain('积分榜');
    expect(res.text).toContain('友情社区');
  });

  test('should /sitemap.xml 200', async () => {
    const res = await request(app).get('/sitemap.xml');
    expect(res.status).toBe(200);
    expect(res.text).toContain('<url>');
  });

  test('should /app/download 302', async () => {
    const res = await request(app).get('/app/download');
    expect(res.status).toBe(302);
  });

});
