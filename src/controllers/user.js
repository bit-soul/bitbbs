const modelTopic      = require('../models/topic');
const modelReply      = require('../models/reply');
const tools           = require('../common/tools');
const proxyUser       = require('../proxys/user');
const proxyTopic      = require('../proxys/topic');
const proxyReply      = require('../proxys/reply');
const proxyMarkTopic  = require('../proxys/marktopic');
const midAuth         = require('../middlewares/auth');

const Router    = require('@koa/router');
const validator = require('validator');
const lodash    = require('lodash');

const router = new Router();

router.get('/user/:uid', async (ctx, next) => {
  const uid = ctx.params.uid;

  let user = await proxyUser.getUserById(uid);
  if (!user) {
    ctx.status = 404;
    ctx.body = 'proxyUser not exist'; // todo 保持原逻辑，如需自定义渲染可封装 render404 方法
    return;
  }

  const query = { author_id: user._id };
  const topicOpt = { limit: 5, sort: '-create_at' };
  const recent_topics = await proxyTopic.getTopicsByQuery(query, topicOpt);

  const replyOpt = { limit: 20, sort: '-create_at' };
  const replies = await proxyReply.getRepliesByAuthorId(user._id, replyOpt);

  let topic_ids = replies.map(reply => reply.topic_id.toString());
  topic_ids = lodash.uniq(topic_ids).slice(0, 5);

  const recentQuery = { _id: { '$in': topic_ids } };
  const recentOpt = {};
  let recent_replies = await proxyTopic.getTopicsByQuery(recentQuery, recentOpt);

  recent_replies = lodash.sortBy(recent_replies, topic => {
    return topic_ids.indexOf(topic._id.toString());
  });

  let token = '';
  if (!user.active && ctx.session.user && ctx.session.user.is_admin) {
    token = tools.md5(user.email + user.pass + global.config.session_secret);
  }

  ctx.render('user/index', {
    user: user,
    recent_topics: recent_topics,
    recent_replies: recent_replies,
    token: token,
    pageTitle: `@${user.name} Home Page`,
  });
});

router.get('/advances', async (ctx, next) => {
  const advances = await proxyUser.getUsersByQuery({ is_advance: true }, {});
  ctx.render('user/advances', { advances: advances });
});

router.get('/setting', 
  midAuth.userRequired,
  async (ctx, next) => {
    const user = await proxyUser.getUserById(ctx.session.user._id);
    if (!user) {
      return await next();
    }

    if (ctx.query.save === 'success') {
      user.success = 'success';
    }
    user.error = null;

    return ctx.render('user/setting', user);
});

router.post('/setting', 
  midAuth.userRequired,
  async (ctx, next) => {
    const reqBody = ctx.request.body;
    const sessionUser = ctx.session.user;

    function showMessage(msg, data, isSuccess) {
      data = data || reqBody;
      const data2 = {
        name: data.name,
        biog: data.biog,
        accessToken: data.accessToken,
      };
      if (isSuccess) {
        data2.success = msg;
      } else {
        data2.error = msg;
      }
      return ctx.render('user/setting', data2);
    }

    const action = reqBody.action;

    if (action === 'change_setting') {
      const name = validator.trim(reqBody.name);
      const biog = validator.trim(reqBody.biog);

      const user = await proxyUser.getUserById(sessionUser._id);
      user.name = name;
      user.biog = biog;
      await user.save();
      ctx.session.user = user.toObject({ virtual: true });
      return ctx.redirect('/setting?save=success');
    }

    if (action === 'change_password') {
      const old_pass = validator.trim(reqBody.old_pass);
      const new_pass = validator.trim(reqBody.new_pass);

      if (!old_pass || !new_pass) {
        return ctx.body = 'password can not be empty';
      }

      const user = await proxyUser.getUserById(sessionUser._id);
      const isMatch = await tools.bcompare(old_pass, user.pass);

      if (!isMatch) {
        return showMessage('password error。', user);
      }

      const passhash = await tools.bhash(new_pass);
      user.pass = passhash;
      await user.save();

      return showMessage('password changed', user, true);
    }
  }
);

//todo cancel_advance
router.post('/user/set_advance', 
  midAuth.adminRequired,
  async (ctx, next) => {
    const user_id = ctx.request.body.user_id;
    const user = await proxyUser.getUserById(user_id);

    if (!user) {
      throw new Error('user is not exists');
    }

    user.is_advance = !user.is_advance;
    await user.save();

    ctx.body = { status: 'success' };
});

router.get('/user/:uid/markedtopics', async (ctx, next) => {
  const uid = ctx.params.uid;
  const page = Number(ctx.query.page) || 1;
  const limit = global.config.list_topic_count;

  const user = await proxyUser.getUserById(uid);
  if (!user) {
    throw new Error('user not found');
  }

  const pages = Math.ceil(user.mark_topic_count / limit);
  const opt = {
    skip: (page - 1) * limit,
    limit: limit,
  };

  const docs = await proxyMarkTopic.getMarkTopicsByUserId(user._id, opt);
  const ids = docs.map(doc => String(doc.topic_id));

  const query = { _id: { $in: ids } };
  let topics = await proxyTopic.getTopicsByQuery(query, {});
  topics = lodash.sortBy(topics, topic => ids.indexOf(String(topic._id)));

  return ctx.render('user/marktopics', {
    topics,
    current_page: page,
    pages,
    user
  });
});

router.get('/users/top100', async (ctx, next) => {
  const opt = { limit: 100, sort: '-score' };
  const tops = await proxyUser.getUsersByQuery({ is_block: false }, opt);

  return ctx.render('user/top100', {
    users: tops,
    pageTitle: 'top100',
  });
});

router.get('/user/:uid/topics', async (ctx, next) => {
  const uid = ctx.params.uid;
  const page = Number(ctx.query.page) || 1;
  const limit = global.config.list_topic_count;

  const user = await proxyUser.getUserById(uid);
  if (!user) {
    ctx.status = 404;
    return ctx.render('notify/notify', { error: 'proxyUser not exist' });
  }

  const query = { author_id: user._id };
  const opt = {
    skip: (page - 1) * limit,
    limit: limit,
    sort: '-create_at'
  };

  const [topics, total] = await Promise.all([
    proxyTopic.getTopicsByQuery(query, opt),
    proxyTopic.getCountByQuery(query)
  ]);

  const pages = Math.ceil(total / limit);

  return ctx.render('user/topics', {
    user,
    topics,
    current_page: page,
    pages
  });
});

router.get('/user/:uid/replies', async (ctx, next) => {
  const uid = ctx.params.uid;
  const page = Number(ctx.query.page) || 1;
  const limit = 50;

  const user = await proxyUser.getUserById(uid);
  if (!user) {
    ctx.status = 404;
    return ctx.render('notify/notify', { error: 'proxyUser not exist' });
  }

  const opt = {
    skip: (page - 1) * limit,
    limit: limit,
    sort: '-create_at'
  };

  const [replies, total] = await Promise.all([
    proxyReply.getRepliesByAuthorId(user._id, opt),
    proxyReply.getCountByAuthorId(user._id)
  ]);

  let topic_ids = replies.map(reply => reply.topic_id.toString());
  topic_ids = lodash.uniq(topic_ids);

  const query = { _id: { $in: topic_ids } };
  let topics = await proxyTopic.getTopicsByQuery(query, {});
  topics = lodash.sortBy(topics, topic => topic_ids.indexOf(topic._id.toString()));

  const pages = Math.ceil(total / limit);

  return ctx.render('user/replies', {
    user,
    topics,
    current_page: page,
    pages
  });
});

router.post('/user/:uid/block', 
  midAuth.adminRequired,
  async (ctx, next) => {
    const uid = ctx.params.uid;
    const action = ctx.request.body.action;

    const user = await proxyUser.getUserById(uid);
    if (!user) {
      throw new Error('proxyUser not exist');
    }

    if (action === 'set_block') {
      user.is_block = true;
      await user.save();
      ctx.body = { status: 'success' };
    } else if (action === 'cancel_block') {
      user.is_block = false;
      await user.save();
      ctx.body = { status: 'success' };
    }
  }
);

router.get('/user/:uid/delete_all', 
  midAuth.adminRequired,
  async (ctx, next) => {
    const uid = ctx.params.uid;

    const user = await proxyUser.getUserById(uid);
    if (!user) {
      throw new Error('user is not exists');
    }

    // 并发执行所有删除操作
    await Promise.all([
      modelTopic.updateMany({ author_id: user._id }, { $set: { deleted: true } }),
      modelReply.updateMany({ author_id: user._id }, { $set: { deleted: true } }),
      modelReply.updateMany({}, { $pull: { ups: user._id } }),
    ]);

    ctx.body = { status: 'success' };
  }
);

router.post('/user/refresh_token', 
  midAuth.userRequired,
  async (ctx, next) => {
    const user_id = ctx.session.user._id;

    const user = await proxyUser.getUserById(user_id);
    user.accessToken = tools.uuid();
    await user.save();

    ctx.body = {
      status: 'success',
      accessToken: user.accessToken,
    };
  }
);

module.exports = router;