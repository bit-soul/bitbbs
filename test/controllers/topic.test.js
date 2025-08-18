import request from 'supertest';
import store from '../../src/common/store.js';

describe('controllers/topic', () => {

  describe('#index', () => {
    test('should get /topic/:tid 200', () => {
      request(global.server)
        .get('/topic/' + global.support.testTopic._id)
        .expect(200)
        .end((err, res) => {
          expect(res.text).toContain('test topic content');
          expect(res.text).toContain('alsotang');
        });
    });

    test('should get /topic/:tid 200 when login in', () => {
      request(global.server)
        .get('/topic/' + global.support.testTopic._id)
        .set('Cookie', global.support.normalUser2Cookie)
        .expect(200)
        .end((err, res) => {
          expect(res.text).toContain('test topic content');
          expect(res.text).toContain('alsotang');
        });
    });
  });

  describe('#create', () => {
    test('should show a create page', () => {
      request(global.server)
        .get('/topic/create')
        .set('Cookie', global.support.normalUserCookie)
        .expect(200)
        .end((err, res) => {
          expect(res.text).toContain('发布话题');
        });
    });
  });

  describe('#put', () => {
    test('should not create a topic when no title', () => {
      request(global.server)
        .post('/topic/create')
        .send({
          title: '',
          tab: 'share',
          t_content: '木耳敲回车',
        })
        .set('Cookie', global.support.normalUserCookie)
        .expect(422)
        .end((err, res) => {
          expect(res.text).toContain('标题不能是空的。');
        });
    });

    test('should not create a topic when no tab', () => {
      request(global.server)
        .post('/topic/create')
        .send({
          title: '呵呵复呵呵',
          tab: '',
          t_content: '木耳敲回车',
        })
        .set('Cookie', global.support.normalUserCookie)
        .expect(422)
        .end((err, res) => {
          expect(res.text).toContain('必须选择一个版块。');
        });
    });

    test('should not create a topic when no content', () => {
      request(global.server)
        .post('/topic/create')
        .send({
          title: '呵呵复呵呵',
          tab: 'share',
          t_content: '',
        })
        .set('Cookie', global.support.normalUserCookie)
        .expect(422)
        .end((err, res) => {
          expect(res.text).toContain('内容不可为空');
        });
    });

    test('should create a topic', () => {
      request(global.server)
        .post('/topic/create')
        .send({
          title: '呵呵复呵呵' + new Date(),
          tab: 'share',
          t_content: '木耳敲回车',
        })
        .set('Cookie', global.support.normalUserCookie)
        .expect(302)
        .end((err, res) => {
          expect(res.headers.location).toMatch(/^\/topic\/\w+$/);
        });
    });
  });

  describe('#showEdit', () => {
    test('should show an edit page', () => {
      request(global.server)
        .get(`/topic/${global.support.testTopic._id}/edit`)
        .set('Cookie', global.support.normalUserCookie)
        .expect(200)
        .end((err, res) => {
          expect(res.text).toContain('编辑话题');
        });
    });
  });

  describe('#update', () => {
    test('should update a topic', () => {
      request(global.server)
        .post(`/topic/${global.support.testTopic._id}/edit`)
        .send({
          title: '修改后的 topic title',
          tab: 'share',
          t_content: '修改后的木耳敲回车',
        })
        .set('Cookie', global.support.normalUserCookie)
        .expect(302)
        .end((err, res) => {
          expect(res.headers.location).toMatch(/^\/topic\/\w+$/);
        });
    });
  });

  describe('#delete', () => {
    let topicToDelete;

    beforeAll(async () => {
      topicToDelete = await global.support.createTopic(global.support.normalUser._id);
    });

    test('should not delete a topic when not author', () => {
      request(global.server)
        .post(`/topic/${topicToDelete._id}/delete`)
        .set('Cookie', global.support.normalUser2Cookie)
        .expect(403)
        .end((err, res) => {
          expect(res.body).toEqual({ success: false, message: '无权限' });
        });
    });

    test('should delete a topic', () => {
      request(global.server)
        .post(`/topic/${topicToDelete._id}/delete`)
        .set('Cookie', global.support.normalUserCookie)
        .expect(200)
        .end((err, res) => {
          expect(res.body).toEqual({ success: true, message: '话题已被删除。' });
        });
    });
  });

  describe('#top', () => {
    test('should top a topic', () => {
      request(global.server)
        .post(`/topic/${global.support.testTopic._id}/top`)
        .set('Cookie', global.support.adminUserCookie)
        .expect(200)
        .end((err, res) => {
          expect(res.text).toContain('此话题已置顶。');
        });
    });

    test('should untop a topic', () => {
      request(global.server)
        .post(`/topic/${global.support.testTopic._id}/top`)
        .set('Cookie', global.support.adminUserCookie)
        .expect(200)
        .end((err, res) => {
          expect(res.text).toContain('此话题已取消置顶');
        });
    });
  });

  describe('#good', () => {
    test('should good a topic', () => {
      request(global.server)
        .post(`/topic/${global.support.testTopic._id}/good`)
        .set('Cookie', global.support.adminUserCookie)
        .expect(200)
        .end((err, res) => {
          expect(res.text).toContain('此话题已加精。');
        });
    });

    test('should ungood a topic', () => {
      request(global.server)
        .post(`/topic/${global.support.testTopic._id}/good`)
        .set('Cookie', global.support.adminUserCookie)
        .expect(200)
        .end((err, res) => {
          expect(res.text).toContain('此话题已取消加精。');
        });
    });
  });

  describe('#collect', () => {
    test('should collect a topic', () => {
      request(global.server)
        .post('/topic/collect')
        .send({ topic_id: global.support.testTopic._id })
        .set('Cookie', global.support.normalUser2Cookie)
        .expect(200)
        .end((err, res) => {
          expect(res.body).toEqual({ status: 'success' });
        });
    });

    test('should not collect a topic twice', () => {
      request(global.server)
        .post('/topic/collect')
        .send({ topic_id: global.support.testTopic._id })
        .set('Cookie', global.support.normalUser2Cookie)
        .expect(200)
        .end((err, res) => {
          expect(res.body).toEqual({ status: 'failed' });
        });
    });
  });

  describe('#de_collect', () => {
    test('should decollect a topic', () => {
      request(global.server)
        .post('/topic/de_collect')
        .send({ topic_id: global.support.testTopic._id })
        .set('Cookie', global.support.normalUser2Cookie)
        .expect(200)
        .end((err, res) => {
          expect(res.body).toEqual({ status: 'success' });
        });
    });

    test('should not decollect a non-exist topic_collect', () => {
      request(global.server)
        .post('/topic/de_collect')
        .send({ topic_id: global.support.testTopic._id })
        .set('Cookie', global.support.normalUser2Cookie)
        .expect(200)
        .end((err, res) => {
          expect(res.body).toEqual({ status: 'failed' });
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

    //test('should upload a file', () => {
    //  request(global.server)
    //    .post('/upload')
    //    .attach('selffile', __filename)
    //    .set('Cookie', global.support.normalUser2Cookie)
    //    .end((err, res) => {
    //      expect(res.body).toEqual({ success: true, url: 'upload_success_url' });
    //    });
    //});
  });

  describe('#lock', () => {
    test('should lock a topic', () => {
      request(global.server)
        .post(`/topic/${global.support.testTopic._id}/lock`)
        .set('Cookie', global.support.adminUserCookie)
        .expect(200)
        .end((err, res) => {
          expect(res.text).toContain('此话题已锁定。');
        });
    });

    test('should not reply to a locked topic', () => {
      request(global.server)
        .post(`/${global.support.testTopic._id}/reply`)
        .set('Cookie', global.support.normalUserCookie)
        .send({ r_content: 'test reply 1' })
        .expect(403)
        .end((err, res) => {
          expect(res.text).toBe('此主题已锁定。');
        });
    });

    test('should unlock a topic', () => {
      request(global.server)
        .post(`/topic/${global.support.testTopic._id}/lock`)
        .set('Cookie', global.support.adminUserCookie)
        .expect(200)
        .end((err, res) => {
          expect(res.text).toContain('此话题已取消锁定。');
        });
    });

    test('should reply to an unlocked topic', () => {
      request(global.server)
        .post(`/${global.support.testTopic._id}/reply`)
        .set('Cookie', global.support.normalUserCookie)
        .send({ r_content: 'test reply 1' })
        .expect(302)
        .end((err, res) => {
        });
    });
  });
});
