const app = require('../../app');
const request = require('supertest');
const support = require('../support');
const store = require('../../common/store');

describe('test/controllers/topic.test.js', () => {

  describe('#index', () => {
    it('should get /topic/:tid 200', (done) => {
      request(app)
        .get('/topic/' + support.testTopic._id)
        .expect(200)
        .end((err, res) => {
          expect(res.text).toContain('test topic content');
          expect(res.text).toContain('alsotang');
          done(err);
        });
    });

    it('should get /topic/:tid 200 when login in', (done) => {
      request(app)
        .get('/topic/' + support.testTopic._id)
        .set('Cookie', support.normalUser2Cookie)
        .expect(200)
        .end((err, res) => {
          expect(res.text).toContain('test topic content');
          expect(res.text).toContain('alsotang');
          done(err);
        });
    });
  });

  describe('#create', () => {
    it('should show a create page', (done) => {
      request(app)
        .get('/topic/create')
        .set('Cookie', support.normalUserCookie)
        .expect(200)
        .end((err, res) => {
          expect(res.text).toContain('发布话题');
          done(err);
        });
    });
  });

  describe('#put', () => {
    it('should not create a topic when no title', (done) => {
      request(app)
        .post('/topic/create')
        .send({
          title: '',
          tab: 'share',
          t_content: '木耳敲回车',
        })
        .set('Cookie', support.normalUserCookie)
        .expect(422)
        .end((err, res) => {
          expect(res.text).toContain('标题不能是空的。');
          done(err);
        });
    });

    it('should not create a topic when no tab', (done) => {
      request(app)
        .post('/topic/create')
        .send({
          title: '呵呵复呵呵',
          tab: '',
          t_content: '木耳敲回车',
        })
        .set('Cookie', support.normalUserCookie)
        .expect(422)
        .end((err, res) => {
          expect(res.text).toContain('必须选择一个版块。');
          done(err);
        });
    });

    it('should not create a topic when no content', (done) => {
      request(app)
        .post('/topic/create')
        .send({
          title: '呵呵复呵呵',
          tab: 'share',
          t_content: '',
        })
        .set('Cookie', support.normalUserCookie)
        .expect(422)
        .end((err, res) => {
          expect(res.text).toContain('内容不可为空');
          done(err);
        });
    });

    it('should create a topic', (done) => {
      request(app)
        .post('/topic/create')
        .send({
          title: '呵呵复呵呵' + new Date(),
          tab: 'share',
          t_content: '木耳敲回车',
        })
        .set('Cookie', support.normalUserCookie)
        .expect(302)
        .end((err, res) => {
          expect(res.headers.location).toMatch(/^\/topic\/\w+$/);
          done(err);
        });
    });
  });

  describe('#showEdit', () => {
    it('should show an edit page', (done) => {
      request(app)
        .get(`/topic/${support.testTopic._id}/edit`)
        .set('Cookie', support.normalUserCookie)
        .expect(200)
        .end((err, res) => {
          expect(res.text).toContain('编辑话题');
          done(err);
        });
    });
  });

  describe('#update', () => {
    it('should update a topic', (done) => {
      request(app)
        .post(`/topic/${support.testTopic._id}/edit`)
        .send({
          title: '修改后的 topic title',
          tab: 'share',
          t_content: '修改后的木耳敲回车',
        })
        .set('Cookie', support.normalUserCookie)
        .expect(302)
        .end((err, res) => {
          expect(res.headers.location).toMatch(/^\/topic\/\w+$/);
          done(err);
        });
    });
  });

  describe('#delete', () => {
    let topicToDelete;

    beforeAll(async () => {
      topicToDelete = await support.createTopic(support.normalUser._id);
    });

    it('should not delete a topic when not author', (done) => {
      request(app)
        .post(`/topic/${topicToDelete._id}/delete`)
        .set('Cookie', support.normalUser2Cookie)
        .expect(403)
        .end((err, res) => {
          expect(res.body).toEqual({ success: false, message: '无权限' });
          done(err);
        });
    });

    it('should delete a topic', (done) => {
      request(app)
        .post(`/topic/${topicToDelete._id}/delete`)
        .set('Cookie', support.normalUserCookie)
        .expect(200)
        .end((err, res) => {
          expect(res.body).toEqual({ success: true, message: '话题已被删除。' });
          done(err);
        });
    });
  });

  describe('#top', () => {
    it('should top a topic', (done) => {
      request(app)
        .post(`/topic/${support.testTopic._id}/top`)
        .set('Cookie', support.adminUserCookie)
        .expect(200)
        .end((err, res) => {
          expect(res.text).toContain('此话题已置顶。');
          done(err);
        });
    });

    it('should untop a topic', (done) => {
      request(app)
        .post(`/topic/${support.testTopic._id}/top`)
        .set('Cookie', support.adminUserCookie)
        .expect(200)
        .end((err, res) => {
          expect(res.text).toContain('此话题已取消置顶');
          done(err);
        });
    });
  });

  describe('#good', () => {
    it('should good a topic', (done) => {
      request(app)
        .post(`/topic/${support.testTopic._id}/good`)
        .set('Cookie', support.adminUserCookie)
        .expect(200)
        .end((err, res) => {
          expect(res.text).toContain('此话题已加精。');
          done(err);
        });
    });

    it('should ungood a topic', (done) => {
      request(app)
        .post(`/topic/${support.testTopic._id}/good`)
        .set('Cookie', support.adminUserCookie)
        .expect(200)
        .end((err, res) => {
          expect(res.text).toContain('此话题已取消加精。');
          done(err);
        });
    });
  });

  describe('#collect', () => {
    it('should collect a topic', (done) => {
      request(app)
        .post('/topic/collect')
        .send({ topic_id: support.testTopic._id })
        .set('Cookie', support.normalUser2Cookie)
        .expect(200)
        .end((err, res) => {
          expect(res.body).toEqual({ status: 'success' });
          done(err);
        });
    });

    it('should not collect a topic twice', (done) => {
      request(app)
        .post('/topic/collect')
        .send({ topic_id: support.testTopic._id })
        .set('Cookie', support.normalUser2Cookie)
        .expect(200)
        .end((err, res) => {
          expect(res.body).toEqual({ status: 'failed' });
          done(err);
        });
    });
  });

  describe('#de_collect', () => {
    it('should decollect a topic', (done) => {
      request(app)
        .post('/topic/de_collect')
        .send({ topic_id: support.testTopic._id })
        .set('Cookie', support.normalUser2Cookie)
        .expect(200)
        .end((err, res) => {
          expect(res.body).toEqual({ status: 'success' });
          done(err);
        });
    });

    it('should not decollect a non-exist topic_collect', (done) => {
      request(app)
        .post('/topic/de_collect')
        .send({ topic_id: support.testTopic._id })
        .set('Cookie', support.normalUser2Cookie)
        .expect(200)
        .end((err, res) => {
          expect(res.body).toEqual({ status: 'failed' });
          done(err);
        });
    });
  });

  describe('#upload', () => {
    let originalUpload;

    beforeAll(() => {
      originalUpload = store.upload;
      store.upload = (file, options, callback) => {
        callback(null, { url: 'upload_success_url' });
      };
    });

    afterAll(() => {
      store.upload = originalUpload;
    });

    it('should upload a file', (done) => {
      request(app)
        .post('/upload')
        .attach('selffile', __filename)
        .set('Cookie', support.normalUser2Cookie)
        .end((err, res) => {
          expect(res.body).toEqual({ success: true, url: 'upload_success_url' });
          done(err);
        });
    });
  });

  describe('#lock', () => {
    it('should lock a topic', (done) => {
      request(app)
        .post(`/topic/${support.testTopic._id}/lock`)
        .set('Cookie', support.adminUserCookie)
        .expect(200)
        .end((err, res) => {
          expect(res.text).toContain('此话题已锁定。');
          done(err);
        });
    });

    it('should not reply to a locked topic', (done) => {
      request(app)
        .post(`/${support.testTopic._id}/reply`)
        .set('Cookie', support.normalUserCookie)
        .send({ r_content: 'test reply 1' })
        .expect(403)
        .end((err, res) => {
          expect(res.text).toBe('此主题已锁定。');
          done(err);
        });
    });

    it('should unlock a topic', (done) => {
      request(app)
        .post(`/topic/${support.testTopic._id}/lock`)
        .set('Cookie', support.adminUserCookie)
        .expect(200)
        .end((err, res) => {
          expect(res.text).toContain('此话题已取消锁定。');
          done(err);
        });
    });

    it('should reply to an unlocked topic', (done) => {
      request(app)
        .post(`/${support.testTopic._id}/reply`)
        .set('Cookie', support.normalUserCookie)
        .send({ r_content: 'test reply 1' })
        .expect(302)
        .end((err, res) => {
          done(err);
        });
    });
  });
});
