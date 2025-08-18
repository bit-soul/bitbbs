import request from 'supertest';
import proxyReply from '../../src/proxys/reply.js';

describe('controllers/reply', () => {
  let reply1Id;

  describe('reply1', () => {
    test('should add a reply1', async () => {
      const topic = global.support.testTopic;

      const res = await request(global.server)
        .post(`/${topic._id}/reply`)
        .set('Cookie', global.support.normalUserCookie)
        .send({ r_content: 'test reply 1' })
        .expect(302);

      expect(res.headers.location).toMatch(new RegExp(`/topic/${topic.id}#\\w+`));
      reply1Id = res.headers.location.match(/#(\w+)/)[1];
    });

    test('should 422 when add an empty reply1', async () => {
      const topic = global.support.testTopic;

      await request(global.server)
        .post(`/${topic._id}/reply`)
        .set('Cookie', global.support.normalUserCookie)
        .send({ r_content: '' })
        .expect(422);
    });

    test('should not add a reply1 when not logged in', async () => {
      await request(global.server)
        .post(`/${global.support.testTopic._id}/reply`)
        .send({ r_content: 'test reply 1' })
        .expect(403);
    });
  });

  describe('edit reply', () => {
    test('should not show edit page when not author', async () => {
      await request(global.server)
        .get(`/reply/${reply1Id}/edit`)
        .set('Cookie', global.support.normalUser2Cookie)
        .expect(403);
    });

    test('should show edit page when is author', async () => {
      const res = await request(global.server)
        .get(`/reply/${reply1Id}/edit`)
        .set('Cookie', global.support.normalUserCookie)
        .expect(200);

      expect(res.text).toContain('test reply 1');
    });

    test('should update edit', async () => {
      const topic = global.support.testTopic;

      const res = await request(global.server)
        .post(`/reply/${reply1Id}/edit`)
        .send({ t_content: 'been update' })
        .set('Cookie', global.support.normalUserCookie);

      expect(res.status).toBe(302);
      expect(res.headers.location).toMatch(new RegExp(`/topic/${topic.id}#\\w+`));
    });
  });

  describe('upvote reply', () => {
    let reply1;

    beforeAll(async () => {
      reply1 = await proxyReply.getReply(reply1Id);
    });

    test('should increase', async () => {
      const res = await request(global.server)
        .post(`/reply/${reply1Id}/up`)
        .send({ replyId: reply1Id })
        .set('Cookie', global.support.normalUser2Cookie);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        action: 'up',
      });
    });

    test('should decrease', async () => {
      const res = await request(global.server)
        .post(`/reply/${reply1Id}/up`)
        .send({ replyId: reply1Id })
        .set('Cookie', global.support.normalUser2Cookie);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        action: 'down',
      });
    });
  });

  describe('delete reply', () => {
    test('should not delete when not author', async () => {
      await request(global.server)
        .post(`/reply/${reply1Id}/delete`)
        .send({ reply_id: reply1Id })
        .expect(403);
    });

    test('should delete reply when author', async () => {
      const res = await request(global.server)
        .post(`/reply/${reply1Id}/delete`)
        .send({ reply_id: reply1Id })
        .set('Cookie', global.support.normalUserCookie)
        .expect(200);

      expect(res.body).toEqual({ status: 'success' });
    });
  });
});
