import request from 'supertest';

describe('controllers/static', () => {
  test('should get /about', async () => {
    const res = await request(global.server).get('/about').expect(200);
    expect(res.text).toContain('CNode 社区由一批热爱 Node.js 技术的工程师发起');
  });

  test('should get /faq', async () => {
    const res = await request(global.server).get('/faq').expect(200);
    expect(res.text).toContain('CNode 社区和 Node Club 是什么关系？');
  });

  test('should get /getstart', async () => {
    const res = await request(global.server).get('/getstart').expect(200);
    expect(res.text).toContain('Node.js 新手入门');
  });

  test('should get /robots.txt', async () => {
    const res = await request(global.server).get('/robots.txt').expect(200);
    expect(res.text).toContain('User-Agent');
  });
});
