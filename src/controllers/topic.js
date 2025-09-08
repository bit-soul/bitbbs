import * as proxyUser from '../proxys/user.js';
import * as proxyTopic from '../proxys/topic.js';
import * as proxyMarkTopic from '../proxys/marktopic.js';
import * as midAuth from '../middlewares/auth.js';
import * as midLimit from '../middlewares/limit.js';
import * as at from '../common/at.js';
import * as cache from '../common/cache.js';

import config from '../config/index.js';
import logger from '../common/logger.js';

import Router from '@koa/router';
import validator from 'validator';
import lodash from 'lodash';

const router = new Router();

router.get('/topic/create',
  midAuth.userRequired,
  async (ctx, next) => {
    return await ctx.render('topic/edit', {
      tabs: config.tabs
    });
  }
);

router.post('/topic/create',
  midAuth.userRequired,
  midLimit.peruserperday('create_topic', config.create_post_per_day, {showJson: false}),
  async (ctx, next) => {
    const title = validator.trim(ctx.request.body.title || '');
    const tab = validator.trim(ctx.request.body.tab || '');
    const content = validator.trim(ctx.request.body.t_content || '');

    const allTabs = config.tabs.map(t => t[0]);

    // 表单校验
    let editError;
    if (title === '') {
      editError = 'Title can not be empty';
    } else if (title.length < 5 || title.length > 100) {
      editError = 'Title is too short';
    } else if (!tab || allTabs.indexOf(tab) === -1) {
      editError = 'Must select category';
    }

    if (editError) {
      ctx.status = 422;
      return await ctx.render('topic/edit', {
        edit_error: editError,
        title,
        content,
        tabs: config.tabs
      });
    }

    const topic = await proxyTopic.newAndSave(title, content, tab, ctx.session.user_id);

    // 更新用户分数
    const user = await proxyUser.getUserById(ctx.session.user_id);
    user.score += 5;
    user.topic_count += 1;
    await user.save();

    // 发送 @ 消息
    at.sendMessageToMentionUsers(content, topic._id, ctx.session.user_id);

    return ctx.redirect(`/topic/${topic._id}`);
  }
);

router.post('/topic/mark',
  midAuth.userRequired,
  async (ctx, next) => {
    const topic_id = ctx.request.body.topic_id;
    const user_id = ctx.session.user_id;

    const topic = await proxyTopic.getTopic(topic_id);
    if (!topic) {
      ctx.body = { status: 'failed' };
      return;
    }

    const exists = await proxyMarkTopic.getMarkTopic(user_id, topic._id);
    if (exists) {
      ctx.body = { status: 'failed' };
      return;
    }

    await proxyMarkTopic.newAndSave(user_id, topic._id);
    const user = await proxyUser.getUserById(user_id);

    user.mark_topic_count += 1;
    await user.save();

    topic.mark_count += 1;
    await topic.save();

    ctx.body = { status: 'success' };
  }
);

router.post('/topic/unmark',
  midAuth.userRequired,
  async (ctx, next) => {
    const topic_id = ctx.request.body.topic_id;
    const user_id = ctx.session.user_id;

    const topic = await proxyTopic.getTopic(topic_id);
    if (!topic) {
      ctx.body = { status: 'failed' };
      return;
    }

    const result = await proxyMarkTopic.remove(user_id, topic._id);
    if (result?.n === 0) {
      ctx.body = { status: 'failed' };
      return;
    }

    const user = await proxyUser.getUserById(user_id);
    user.mark_topic_count -= 1;
    await user.save();

    topic.mark_count -= 1;
    await topic.save();

    ctx.body = { status: 'success' };
  }
);

router.get('/topic/:tid', async (ctx, next) => {
  function isUped(user, reply) {
    if (!reply.ups) {
      return false;
    }
    return reply.ups.indexOf(user._id) !== -1;
  }

  const topic_id = ctx.params.tid;
  const currentUser = await proxyUser.getUserById(ctx.session.user_id);

  if (topic_id.length !== 24) {
    ctx.status = 404;
    return await ctx.render('misc/notify', { error: 'proxyTopic not exist or deleted' });
  }

  const {message, topic, author, replies} = await proxyTopic.getFullTopic(topic_id);

  if (message) {
    ctx.status = 400;
    return await ctx.render('misc/notify', { error: message });
  }

  topic.visit_count += 1;
  topic.save().catch(console.error); // 异步更新访问量，不阻塞页面

  topic.author = author;
  topic.replies = replies;

  topic.reply_up_threshold = (() => {
    const allUpCount = replies.map(reply => (reply.ups ? reply.ups.length : 0));
    const sorted = lodash.sortBy(allUpCount).reverse();
    let threshold = sorted[2] || 0;
    if (threshold < 3) {threshold = 3;}
    return threshold;
  })();

  // get other_topics
  const other_topics = await proxyTopic.getTopicsByQuery(
    { author_id: topic.author_id, _id: { $nin: [topic._id] } },
    { midLimit: 5, sort: '-last_reply_at' }
  );

  // get no_reply_topics
  const no_reply_topics = await (async () => {
    let cached = await cache.get('no_reply_topics');
    if (cached) {return cached;}
    const fresh = await proxyTopic.getTopicsByQuery(
      { reply_count: 0, tab: { $nin: ['job', 'dev'] } },
      { midLimit: 5, sort: '-create_at' }
    );
    await cache.set('no_reply_topics', fresh, 60);
    return fresh;
  })();

  const is_mark = currentUser
    ? await proxyMarkTopic.getMarkTopic(currentUser._id, topic_id)
    : null;

  return await ctx.render('topic/index', {
    topic,
    author_other_topics: other_topics,
    no_reply_topics,
    is_uped: isUped,
    is_mark,
  });
});

router.get('/topic/:tid/edit',
  midAuth.userRequired,
  async (ctx, next) => {
    const topic_id = ctx.params.tid;

    const {topic} = await proxyTopic.getTopicById(topic_id);

    if (!topic) {
      ctx.status = 404;
      return await ctx.render('misc/notify', { error: 'proxyTopic not exist or deleted' });
    }

    const isOwner = String(topic.author_id) === String(ctx.session.user_id);
    const isAdmin = ctx.session.is_admin;

    if (isOwner || isAdmin) {
      return await ctx.render('topic/edit', {
        action: 'edit',
        topic_id: topic._id,
        title: topic.title,
        content: topic.content,
        tab: topic.tab,
        tabs: config.tabs
      });
    } else {
      ctx.status = 403;
      return await ctx.render('misc/notify', { error: 'Can not edit this topic' });
    }
  }
);

router.post('/topic/:tid/edit',
  midAuth.userRequired,
  async (ctx, next) => {
    const topic_id = ctx.params.tid;
    let { title, tab, t_content: content } = ctx.request.body;

    const allTabs = config.tabs.map(tPair => tPair[0]);

    const {topic} = await proxyTopic.getTopicById(topic_id);

    if (!topic) {
      ctx.status = 404;
      return await ctx.render('misc/notify', { error: 'proxyTopic not exist or deleted' });
    }

    const isOwner = topic.author_id.equals(ctx.session.user_id);
    const isAdmin = ctx.session.is_admin;

    if (!(isOwner || isAdmin)) {
      ctx.status = 403;
      return await ctx.render('misc/notify', { error: 'Can not edit this topic' });
    }

    title = validator.trim(title);
    tab = validator.trim(tab);
    content = validator.trim(content);

    let editError;
    if (!title) {
      editError = 'Title can not be empty';
    } else if (title.length < 5 || title.length > 100) {
      editError = 'Title is too short';
    } else if (!tab || allTabs.indexOf(tab) === -1) {
      editError = 'Must select category';
    }

    if (editError) {
      return await ctx.render('topic/edit', {
        action: 'edit',
        edit_error: editError,
        topic_id: topic._id,
        content,
        tabs: config.tabs
      });
    }

    topic.title = title;
    topic.content = content;
    topic.tab = tab;
    topic.update_at = new Date();
    await topic.save();

    at.sendMessageToMentionUsers(content, topic._id, ctx.session.user_id);

    return ctx.redirect(`/topic/${topic._id}`);
  }
);

router.post('/topic/:tid/delete',
  midAuth.userRequired,
  async (ctx, next) => {
    //删除话题, 话题作者topic_count减1
    //删除回复，回复作者reply_count减1
    //删除marktopic，用户mark_topic_count减1
    const topic_id = ctx.params.tid;

    try {
      const {err_msg, topic, author, replies} = await proxyTopic.getFullTopic(topic_id);

      if (!topic) {
        ctx.status = 422;
        ctx.body = { success: false, message: 'proxyTopic not exist or deleted' };
        return;
      }

      const isAdmin = ctx.session.is_admin;
      const isOwner = topic.author_id.equals(ctx.session.user_id);

      if (!(isAdmin || isOwner)) {
        ctx.status = 403;
        ctx.body = { success: false, message: 'No Permission' };
        return;
      }

      author.score -= 5;
      author.topic_count -= 1;
      await author.save();

      topic.deleted = true;
      await topic.save();

      ctx.body = { success: true, message: 'proxyTopic is deleted' };
    } catch (err) {
      ctx.body = { success: false, message: err.message };
    }
  }
);

router.post('/topic/:tid/top',
  midAuth.userRequired,
  async (ctx, next) => {
    const topic_id = ctx.params.tid;
    const referer = ctx.get('referer');

    if (topic_id.length !== 24) {
      ctx.status = 404;
      return await ctx.render('misc/notify', { error: 'proxyTopic not exist or deleted' });
    }

    const topic = await proxyTopic.getTopic(topic_id);
    if (!topic) {
      ctx.status = 404;
      return await ctx.render('misc/notify', { error: 'proxyTopic not exist or deleted' });
    }

    topic.top = !topic.top;
    await topic.save();

    const msg = topic.top ? 'Topped。' : 'Cancel Topped';
    await await ctx.render('misc/notify', { success: msg, referer });
  }
);

router.post('/topic/:tid/good',
  midAuth.userRequired,
  async (ctx, next) => {
    const topicId = ctx.params.tid;
    const referer = ctx.get('referer');

    const topic = await proxyTopic.getTopic(topicId);
    if (!topic) {
      ctx.status = 404;
      return await ctx.render('misc/notify', { error: 'proxyTopic not exist or deleted' });
    }

    topic.good = !topic.good;
    await topic.save();

    const msg = topic.good ? 'Gooded。' : 'Cancel Gooded';
    return await ctx.render('misc/notify', { success: msg, referer });
  }
);

router.post('/topic/:tid/lock',
  midAuth.userRequired,
  async (ctx, next) => {
    const topicId = ctx.params.tid;
    const referer = ctx.get('referer');

    const topic = await proxyTopic.getTopic(topicId);
    if (!topic) {
      ctx.status = 404;
      return await ctx.render('misc/notify', { error: 'proxyTopic not exist or deleted' });
    }

    topic.lock = !topic.lock;
    await topic.save();

    const msg = topic.lock ? 'Locked。' : 'Cancel Locked';
    return await ctx.render('misc/notify', { success: msg, referer });
  }
);

export default router;
