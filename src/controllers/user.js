var User       = require('../proxy').User;
var Topic      = require('../proxy').Topic;
var Reply      = require('../proxy').Reply;
var MarkTopic  = require('../proxy').MarkTopic;
var utility    = require('utility');
var util       = require('util');
var TopicModel = require('../models').Topic;
var ReplyModel = require('../models').Reply;
var tools      = require('../common/tools');
var validator  = require('validator');
var _          = require('lodash');
var uuid = require('node-uuid')

exports.index = async function (ctx, next) {
  const uid = ctx.params.uid;

  let user;
  try {
    user = await User.getUserById(uid);
  } catch (err) {
    return await next(err);
  }

  if (!user) {
    ctx.status = 404;
    ctx.body = 'User not exist'; // todo 保持原逻辑，如需自定义渲染可封装 render404 方法
    return;
  }

  try {
    const query = { author_id: user._id };
    const topicOpt = { limit: 5, sort: '-create_at' };
    const recent_topics = await Topic.getTopicsByQuery(query, topicOpt);

    const replyOpt = { limit: 20, sort: '-create_at' };
    const replies = await Reply.getRepliesByAuthorId(user._id, replyOpt);

    let topic_ids = replies.map(reply => reply.topic_id.toString());
    topic_ids = _.uniq(topic_ids).slice(0, 5);

    const recentQuery = { _id: { '$in': topic_ids } };
    const recentOpt = {};
    let recent_replies = await Topic.getTopicsByQuery(recentQuery, recentOpt);

    recent_replies = _.sortBy(recent_replies, topic => {
      return topic_ids.indexOf(topic._id.toString());
    });

    let token = '';
    if (!user.active && ctx.session.user && ctx.session.user.is_admin) {
      token = utility.md5(user.email + user.pass + global.config.session_secret);
    }

    ctx.render('user/index', {
      user: user,
      recent_topics: recent_topics,
      recent_replies: recent_replies,
      token: token,
      pageTitle: util.format('@%s Home Page', user.name),
    });

  } catch (err) {
    return await next(err);
  }
};

exports.listAdvances = async function (ctx, next) {
  try {
    const advances = await User.getUsersByQuery({ is_advance: true }, {});
    ctx.render('user/advances', { advances: advances });
  } catch (err) {
    await next(err);
  }
};

exports.showSetting = async function (ctx, next) {
  try {
    const user = await User.getUserById(ctx.session.user._id);
    if (!user) {
      return await next();
    }

    if (ctx.query.save === 'success') {
      user.success = 'success';
    }
    user.error = null;

    return ctx.render('user/setting', user);
  } catch (err) {
    return await next(err);
  }
};

exports.setting = async function (ctx, next) {
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

  try {
    if (action === 'change_setting') {
      const name = validator.trim(reqBody.name);
      const biog = validator.trim(reqBody.biog);

      const user = await User.getUserById(sessionUser._id);
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

      const user = await User.getUserById(sessionUser._id);
      const isMatch = await tools.bcompare(old_pass, user.pass);

      if (!isMatch) {
        return showMessage('password error。', user);
      }

      const passhash = await tools.bhash(new_pass);
      user.pass = passhash;
      await user.save();

      return showMessage('password changed', user, true);
    }
  } catch (err) {
    return next(err);
  }
};

exports.toggleAdvance = async function (ctx, next) {
  try {
    const user_id = ctx.request.body.user_id;
    const user = await User.getUserById(user_id);

    if (!user) {
      throw new Error('user is not exists');
    }

    user.is_advance = !user.is_advance;
    await user.save();

    ctx.body = { status: 'success' };
  } catch (err) {
    return next(err);
  }
};

exports.listMarkedTopics = async function (ctx, next) {
  try {
    const uid = ctx.params.uid;
    const page = Number(ctx.query.page) || 1;
    const limit = global.config.list_topic_count;

    const user = await User.getUserById(uid);
    if (!user) {
      throw new Error('user not found');
    }

    const pages = Math.ceil(user.mark_topic_count / limit);
    const opt = {
      skip: (page - 1) * limit,
      limit: limit,
    };

    const docs = await MarkTopic.getMarkTopicsByUserId(user._id, opt);
    const ids = docs.map(doc => String(doc.topic_id));

    const query = { _id: { $in: ids } };
    let topics = await Topic.getTopicsByQuery(query, {});
    topics = _.sortBy(topics, topic => ids.indexOf(String(topic._id)));

    return ctx.render('user/marktopics', {
      topics,
      current_page: page,
      pages,
      user
    });

  } catch (err) {
    return next(err);
  }
};

exports.top100 = async function (ctx, next) {
  try {
    const opt = { limit: 100, sort: '-score' };
    const tops = await User.getUsersByQuery({ is_block: false }, opt);

    return ctx.render('user/top100', {
      users: tops,
      pageTitle: 'top100',
    });
  } catch (err) {
    return next(err);
  }
};

exports.listTopics = async function (ctx, next) {
  try {
    const uid = ctx.params.uid;
    const page = Number(ctx.query.page) || 1;
    const limit = global.config.list_topic_count;

    const user = await User.getUserById(uid);
    if (!user) {
      return ctx.render404('User not exist');
    }

    const query = { author_id: user._id };
    const opt = {
      skip: (page - 1) * limit,
      limit: limit,
      sort: '-create_at'
    };

    const [topics, total] = await Promise.all([
      Topic.getTopicsByQuery(query, opt),
      Topic.getCountByQuery(query)
    ]);

    const pages = Math.ceil(total / limit);

    return ctx.render('user/topics', {
      user,
      topics,
      current_page: page,
      pages
    });

  } catch (err) {
    return next(err);
  }
};

exports.listReplies = async function (ctx, next) {
  try {
    const uid = ctx.params.uid;
    const page = Number(ctx.query.page) || 1;
    const limit = 50;

    const user = await User.getUserById(uid);
    if (!user) {
      return ctx.render404('User not exist');
    }

    const opt = {
      skip: (page - 1) * limit,
      limit: limit,
      sort: '-create_at'
    };

    const [replies, total] = await Promise.all([
      Reply.getRepliesByAuthorId(user._id, opt),
      Reply.getCountByAuthorId(user._id)
    ]);

    let topic_ids = replies.map(reply => reply.topic_id.toString());
    topic_ids = _.uniq(topic_ids);

    const query = { _id: { $in: topic_ids } };
    let topics = await Topic.getTopicsByQuery(query, {});
    topics = _.sortBy(topics, topic => topic_ids.indexOf(topic._id.toString()));

    const pages = Math.ceil(total / limit);

    return ctx.render('user/replies', {
      user,
      topics,
      current_page: page,
      pages
    });

  } catch (err) {
    return next(err);
  }
};

exports.block = async function (ctx, next) {
  try {
    const uid = ctx.params.uid;
    const action = ctx.request.body.action;

    const user = await User.getUserById(uid);
    if (!user) {
      throw new Error('User not exist');
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
  } catch (err) {
    return next(err);
  }
};

exports.deleteAll = async function (ctx, next) {
  try {
    const uid = ctx.params.uid;

    const user = await User.getUserById(uid);
    if (!user) {
      throw new Error('user is not exists');
    }

    // 并发执行所有删除操作
    await Promise.all([
      TopicModel.updateMany({ author_id: user._id }, { $set: { deleted: true } }),
      ReplyModel.updateMany({ author_id: user._id }, { $set: { deleted: true } }),
      ReplyModel.updateMany({}, { $pull: { ups: user._id } }),
    ]);

    ctx.body = { status: 'success' };
  } catch (err) {
    return next(err);
  }
};

exports.refreshToken = async function (ctx, next) {
  try {
    const user_id = ctx.session.user._id;

    const user = await User.getUserById(user_id);
    user.accessToken = uuid.v4();
    await user.save();

    ctx.body = {
      status: 'success',
      accessToken: user.accessToken,
    };
  } catch (err) {
    return next(err);
  }
};
