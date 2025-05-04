var validator = require('validator');

var at         = require('../common/at');
var User       = require('../proxy').User;
var Topic      = require('../proxy').Topic;
var MarkTopic  = require('../proxy').MarkTopic;
var tools      = require('../common/tools');
var store      = require('../common/store');
var _          = require('lodash');
var cache      = require('../common/cache');
var logger = require('../common/logger')

exports.index = async function (ctx, next) {
  function isUped(user, reply) {
    if (!reply.ups) {
      return false;
    }
    return reply.ups.indexOf(user._id) !== -1;
  }

  const topic_id = ctx.params.tid;
  const currentUser = ctx.session.user;

  if (topic_id.length !== 24) {
    return ctx.render404('Topic not exist or deleted');
  }

  try {
    const [message, topic, author, replies] = await Topic.getFullTopic(topic_id);

    if (message) {
      logger.error('getFullTopic error topic_id: ' + topic_id);
      return ctx.renderError(message);
    }

    topic.visit_count += 1;
    topic.save().catch(console.error); // 异步更新访问量，不阻塞页面

    topic.author = author;
    topic.replies = replies;

    topic.reply_up_threshold = (() => {
      const allUpCount = replies.map(reply => (reply.ups ? reply.ups.length : 0));
      const sorted = _.sortBy(allUpCount).reverse();
      let threshold = sorted[2] || 0;
      if (threshold < 3) threshold = 3;
      return threshold;
    })();

    // get other_topics
    const other_topics = await Topic.getTopicsByQuery(
      { author_id: topic.author_id, _id: { $nin: [topic._id] } },
      { limit: 5, sort: '-last_reply_at' }
    );

    // get no_reply_topics
    const no_reply_topics = await (async () => {
      let cached = await cache.get('no_reply_topics');
      if (cached) return cached;
      const fresh = await Topic.getTopicsByQuery(
        { reply_count: 0, tab: { $nin: ['job', 'dev'] } },
        { limit: 5, sort: '-create_at' }
      );
      await cache.set('no_reply_topics', fresh, 60);
      return fresh;
    })();

    const is_mark = currentUser
      ? await MarkTopic.getMarkTopic(currentUser._id, topic_id)
      : null;

    await ctx.render('topic/index', {
      topic,
      author_other_topics: other_topics,
      no_reply_topics,
      is_uped: isUped,
      is_mark,
    });

  } catch (err) {
    return next(err);
  }
};

exports.create = async function (ctx) {
  await ctx.render('topic/edit', {
    tabs: global.config.tabs
  });
};

exports.put = async function (ctx, next) {
  const title = validator.trim(ctx.request.body.title || '');
  const tab = validator.trim(ctx.request.body.tab || '');
  const content = validator.trim(ctx.request.body.t_content || '');

  const allTabs = global.config.tabs.map(t => t[0]);

  // 表单校验
  let editError;
  if (title === '') {
    editError = 'Title can not be empty';
  } else if (title.length < 5 || title.length > 100) {
    editError = 'Title is too short';
  } else if (!tab || allTabs.indexOf(tab) === -1) {
    editError = 'Must select category';
  } else if (content === '') {
    editError = 'Content can not be empty';
  }

  if (editError) {
    ctx.status = 422;
    return await ctx.render('topic/edit', {
      edit_error: editError,
      title,
      content,
      tabs: global.config.tabs
    });
  }

  try {
    const topic = await Topic.newAndSave(title, content, tab, ctx.session.user._id);

    // 更新用户分数
    const user = await User.getUserById(ctx.session.user._id);
    user.score += 5;
    user.topic_count += 1;
    await user.save();
    ctx.session.user = user;

    // 发送 @ 消息
    at.sendMessageToMentionUsers(content, topic._id, ctx.session.user._id);

    return ctx.redirect(`/topic/${topic._id}`);

  } catch (err) {
    return next(err);
  }
};

exports.showEdit = async function (ctx) {
  const topic_id = ctx.params.tid;

  const [topic] = await Topic.getTopicById(topic_id);

  if (!topic) {
    return ctx.render404('Topic not exist or deleted');
  }

  const isOwner = String(topic.author_id) === String(ctx.session.user._id);
  const isAdmin = ctx.session.user.is_admin;

  if (isOwner || isAdmin) {
    return ctx.render('topic/edit', {
      action: 'edit',
      topic_id: topic._id,
      title: topic.title,
      content: topic.content,
      tab: topic.tab,
      tabs: global.config.tabs
    });
  } else {
    return ctx.renderError('Can not edit this topic', 403);
  }
};

exports.update = async function (ctx, next) {
  const topic_id = ctx.params.tid;
  let { title, tab, t_content: content } = ctx.request.body;

  const allTabs = global.config.tabs.map(tPair => tPair[0]);

  const [topic] = await Topic.getTopicById(topic_id);

  if (!topic) {
    return ctx.render404('Topic not exist or deleted');
  }

  const isOwner = topic.author_id.equals(ctx.session.user._id);
  const isAdmin = ctx.session.user.is_admin;

  if (!(isOwner || isAdmin)) {
    return ctx.renderError('Can not edit this topic', 403);
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
    return ctx.render('topic/edit', {
      action: 'edit',
      edit_error: editError,
      topic_id: topic._id,
      content,
      tabs: global.config.tabs
    });
  }

  try {
    topic.title = title;
    topic.content = content;
    topic.tab = tab;
    topic.update_at = new Date();
    await topic.save();

    at.sendMessageToMentionUsers(content, topic._id, ctx.session.user._id);

    return ctx.redirect(`/topic/${topic._id}`);
  } catch (err) {
    return next(err);
  }
};

exports.delete = async function (ctx) {
  //删除话题, 话题作者topic_count减1
  //删除回复，回复作者reply_count减1
  //删除marktopic，用户mark_topic_count减1
  const topic_id = ctx.params.tid;

  try {
    const [err_msg, topic, author, replies] = await Topic.getFullTopic(topic_id);

    if (!topic) {
      ctx.status = 422;
      ctx.body = { success: false, message: 'Topic not exist or deleted' };
      return;
    }

    const isAdmin = ctx.session.user.is_admin;
    const isOwner = topic.author_id.equals(ctx.session.user._id);

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

    ctx.body = { success: true, message: 'Topic is deleted' };
  } catch (err) {
    ctx.body = { success: false, message: err.message };
  }
};

exports.top = async function (ctx, next) {
  const topic_id = ctx.params.tid;
  const referer = ctx.get('referer');

  if (topic_id.length !== 24) {
    return ctx.render404('Topic not exist or deleted');
  }

  try {
    const topic = await Topic.getTopic(topic_id);
    if (!topic) return ctx.render404('Topic not exist or deleted');

    topic.top = !topic.top;
    await topic.save();

    const msg = topic.top ? 'Topped。' : 'Cancel Topped';
    await ctx.render('notify/notify', { success: msg, referer });

  } catch (err) {
    return next(err);
  }
};

exports.good = async function (ctx, next) {
  const topicId = ctx.params.tid;
  const referer = ctx.get('referer');

  try {
    const topic = await Topic.getTopic(topicId);
    if (!topic) return ctx.render404('Topic not exist or deleted');

    topic.good = !topic.good;
    await topic.save();

    const msg = topic.good ? 'Gooded。' : 'Cancel Gooded';
    await ctx.render('notify/notify', { success: msg, referer });

  } catch (err) {
    return next(err);
  }
};

exports.lock = async function (ctx, next) {
  const topicId = ctx.params.tid;
  const referer = ctx.get('referer');

  try {
    const topic = await Topic.getTopic(topicId);
    if (!topic) return ctx.render404('Topic not exist or deleted');

    topic.lock = !topic.lock;
    await topic.save();

    const msg = topic.lock ? 'Locked。' : 'Cancel Locked';
    await ctx.render('notify/notify', { success: msg, referer });

  } catch (err) {
    return next(err);
  }
};

exports.mark = async function (ctx, next) {
  const topic_id = ctx.request.body.topic_id;
  const user_id = ctx.session.user._id;

  try {
    const topic = await Topic.getTopic(topic_id);
    if (!topic) {
      ctx.body = { status: 'failed' };
      return;
    }

    const exists = await MarkTopic.getMarkTopic(user_id, topic._id);
    if (exists) {
      ctx.body = { status: 'failed' };
      return;
    }

    await MarkTopic.newAndSave(user_id, topic._id);
    const user = await User.getUserById(user_id);

    user.mark_topic_count += 1;
    await user.save();

    ctx.session.user.mark_topic_count += 1;
    topic.mark_count += 1;
    await topic.save();

    ctx.body = { status: 'success' };

  } catch (err) {
    return next(err);
  }
};

exports.unmark = async function (ctx, next) {
  const topic_id = ctx.request.body.topic_id;
  const user_id = ctx.session.user._id;

  try {
    const topic = await Topic.getTopic(topic_id);
    if (!topic) {
      ctx.body = { status: 'failed' };
      return;
    }

    const result = await MarkTopic.remove(user_id, topic._id);
    if (result?.n === 0) {
      ctx.body = { status: 'failed' };
      return;
    }

    const user = await User.getUserById(user_id);
    user.mark_topic_count -= 1;
    await user.save();

    ctx.session.user = user;

    topic.mark_count -= 1;
    await topic.save();

    ctx.body = { status: 'success' };

  } catch (err) {
    return next(err);
  }
};

exports.presignedurl = async function (ctx, next) {
  const fileName = ctx.query.filename;
  const fileType = ctx.query.filetype;
  const fileSize = parseInt(ctx.query.filesize, 10);

  if (fileSize > 1 * 1024 * 1024) {
    ctx.body = {
      code: -1,
      mess: 'file size too large, max size is 1MB',
    };
    return;
  }

  try {
    const userId = ctx.session.user._id;
    const formatDate = tools.getFormattedDate();
    const formatTime = tools.getFormattedTime();
    const file_name = global.config.s3_client.prefix + userId + '/' + formatDate + '/' + formatTime + '_' + fileName
    const url = await store.presignedUrl(file_name, fileType, fileSize);
    const uploadurl = new URL(url);
    uploadurl.hostname = new URL(global.config.s3_client.proxypoint).hostname;
    uploadurl.searchParams.set('bucketname', global.config.s3_client.bucket);

    ctx.body = {
      code: 0,
      data: {
        readurl: global.config.s3_client.readpoint + '/' + file_name,
        uploadurl: uploadurl.toString(),
      },
    };
  } catch (err) {
    return next(err);
  }
};

//todo 参考bootkoa
exports.upload = async function (ctx, next) {
  try {
    const file = ctx.request.files.file; // "file" 是上传字段名
    if (!file) {
      ctx.body = {
        success: false,
        msg: 'No file uploaded.'
      };
      return;
    }

    const maxSize = global.config.file_limit;
    if (file.size > maxSize) {
      ctx.body = {
        success: false,
        msg: 'File size too large. Max is ' + maxSize
      };
      return;
    }

    const stream = fs.createReadStream(file.path);
    const result = await store.upload(stream, { filename: file.name });

    ctx.body = {
      success: true,
      url: result.url,
    };
  } catch (err) {
    return next(err);
  }
};

