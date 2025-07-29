const lodash = require('lodash');
const request = require('supertest');
const support = require('../support');
const proxyUser = require('../../src/proxys/user');
const modelReply = require('../../src/models/reply');

describe('controllers/user', () => {
  let testUser;

  beforeAll(async () => {
    testUser = await support.createUser();
  });

  describe('/user/:uid', () => {
    test('should show user index', async () => {
      const res = await request(global.server).get(`/user/${testUser.uid}`);
      expect(res.status).toBe(200);
      const texts = [
        '注册时间',
        '这家伙很懒，什么个性签名都没有留下。',
        '最近创建的话题',
        '无话题',
        '最近参与的话题',
        '无话题'
      ];
      texts.forEach(text => {
        expect(res.text).toContain(text);
      });
    });
  });

  describe('#listStars', () => {
    test('should show star uses', async () => {
      const res = await request(global.server).get('/stars');
      expect(res.status).toBe(200);
      expect(res.text).toContain('社区达人');
    });
  });

  describe('#showSetting', () => {
    test('should show setting page', async () => {
      const res = await request(global.server)
        .get('/user/setting')
        .set('Cookie', support.normalUserCookie);
      expect(res.status).toBe(200);
      expect(res.text).toContain('同时决定了 Gravatar 头像');
      expect(res.text).toContain('Access Token');
    });

    test('should show success info', async () => {
      const res = await request(global.server)
        .get('/user/setting')
        .query({ save: 'success' })
        .set('Cookie', support.normalUserCookie);
      expect(res.status).toBe(200);
      expect(res.text).toContain('保存成功。');
    });
  });

  describe('#setting', () => {
    let userInfo;

    beforeEach(() => {
      userInfo = {
        url: 'http://fxck.it',
        location: 'west lake',
        github: '@alsotang',
        signature: '仍然很懒',
        name: support.normalUser.loginname,
        email: support.normalUser.email,
      };
    });

    test('should change user setting', async () => {
      const res = await request(global.server)
        .post('/user/setting')
        .set('Cookie', support.normalUserCookie)
        .send({ ...userInfo, action: 'change_setting' });
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/user/setting?save=success');
    });

    test('should change user password', async () => {
      const res = await request(global.server)
        .post('/user/setting')
        .set('Cookie', support.normalUserCookie)
        .send({ ...userInfo, action: 'change_password', old_pass: 'pass', new_pass: 'passwordchanged' });
      expect(res.status).toBe(200);
      expect(res.text).toContain('密码已被修改。');
    });

    test('should not change user password when old_pass is wrong', async () => {
      const res = await request(global.server)
        .post('/user/setting')
        .set('Cookie', support.normalUserCookie)
        .send({ ...userInfo, action: 'change_password', old_pass: 'wrong_old_pass', new_pass: 'passwordchanged' });
      expect(res.status).toBe(200);
      expect(res.text).toContain('当前密码不正确。');
    });
  });

  describe('#toggleStar', () => {
    test('should not set star user when no user_id', async () => {
      const res = await request(global.server)
        .post('/user/set_star')
        .set('Cookie', support.adminUserCookie);
      expect(res.status).toBe(500);
      expect(res.text).toContain('user is not exists');
    });

    test('should set star user', async () => {
      const res = await request(global.server)
        .post('/user/set_star')
        .send({ user_id: support.normalUser._id })
        .set('Cookie', support.adminUserCookie);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'success' });

      const user = await new Promise((resolve, reject) => {
        proxyUser.getUserById(support.normalUser._id, (err, user) => err ? reject(err) : resolve(user));
      });
      expect(user.is_star).toBe(true);
    });

    test('should unset star user', async () => {
      const res = await request(global.server)
        .post('/user/set_star')
        .send({ user_id: support.normalUser._id })
        .set('Cookie', support.adminUserCookie);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'success' });

      const user = await new Promise((resolve, reject) => {
        proxyUser.getUserById(support.normalUser._id, (err, user) => err ? reject(err) : resolve(user));
      });
      expect(user.is_star).toBe(false);
    });
  });

  describe('#getCollectTopics', () => {
    test('should get /user/:name/collections ok', async () => {
      const res = await request(global.server).get(`/user/${support.normalUser.loginname}/collections`);
      expect(res.status).toBe(200);
      expect(res.text).toContain('收藏的话题');
    });
  });

  describe('#top100', () => {
    test('should get /user/top100', async () => {
      const res = await request(global.server).get('/user/top100');
      expect(res.status).toBe(200);
      expect(res.text).toContain('Top100 积分榜');
    });
  });

  describe('#list_topics', () => {
    test('should get /user/:name/topics ok', async () => {
      const res = await request(global.server).get(`/user/${support.normalUser.loginname}/topics`);
      expect(res.status).toBe(200);
      expect(res.text).toContain('创建的话题');
    });
  });

  describe('#listReplies', () => {
    test('should get /user/:name/replies ok', async () => {
      const res = await request(global.server).get(`/user/${support.normalUser.loginname}/replies`);
      expect(res.status).toBe(200);
      expect(res.text).toContain(`${support.normalUser.loginname} 参与的话题`);
    });
  });

  describe('#block', () => {
    test('should block user', async () => {
      const newuser = await new Promise((resolve, reject) => {
        support.createUser((err, user) => err ? reject(err) : resolve(user));
      });
      const res = await request(global.server)
        .post(`/user/${newuser.loginname}/block`)
        .send({ action: 'set_block' })
        .set('Cookie', support.adminUserCookie);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'success' });

      const user = await new Promise((resolve, reject) => {
        proxyUser.getUserById(newuser._id, (err, user) => err ? reject(err) : resolve(user));
      });
      expect(user.is_block).toBe(true);
    });

    test('should unblock user', async () => {
      const res = await request(global.server)
        .post(`/user/${support.normalUser.loginname}/block`)
        .send({ action: 'cancel_block' })
        .set('Cookie', support.adminUserCookie);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'success' });
    });

    test('should error when user does not exist', async () => {
      const res = await request(global.server)
        .post('/user/not_exists_user/block')
        .send({ action: 'set_block' })
        .set('Cookie', support.adminUserCookie);
      expect(res.status).toBe(500);
      expect(res.text).toContain('user is not exists');
    });
  });

  describe('#delete_all', () => {
    test('should delete all ups', async () => {
      const user = await new Promise((resolve, reject) => {
        support.createUser((err, user) => err ? reject(err) : resolve(user));
      });

      const reply = await modelReply.findOne();
      reply.ups.push(user._id);
      await reply.save();
      expect(reply.ups).toContainEqual(user._id);

      const res = await request(global.server)
        .post(`/user/${user.loginname}/delete_all`)
        .set('Cookie', support.adminUserCookie);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'success' });

      const updatedReply = await modelReply.findById(reply._id);
      expect(updatedReply.ups).not.toContainEqual(user._id);
    });
  });
});
