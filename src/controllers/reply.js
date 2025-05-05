const Router = require('koa-router');
var validator  = require('validator');
var _          = require('lodash');
var at         = require('../common/at');
var message    = require('../common/message');
var User       = require('../proxy/user');
var Topic      = require('../proxy/topic');
var Reply      = require('../proxy/reply');

var auth = require('./middlewares/auth');
var limit = require('./middlewares/limit');
const router = new Router();

router.post('/:tid/reply', 
  auth.userRequired, 
  limit.peruserperday('create_reply', global.config.create_reply_per_day, {showJson: false}),
  async (ctx, next) => {
  try {
    const content = ctx.request.body.r_content;
    const tid = ctx.params.tid;
    const rid = ctx.request.body.rid;

    const str = validator.trim(String(content));
    if (str === '') {
      return ctx.renderError('Content can not be empty', 422);
    }

    const topic = await Topic.getTopic(tid);
    if (!topic) return next(); // 404
    if (topic.lock) {
      ctx.status = 403;
      return ctx.body = 'Topic is locked';
    }

    const topicAuthor = await User.getUserById(topic.author_id);

    const reply = await Reply.newAndSave(content, tid, ctx.session.user._id, rid);
    await Topic.updateLastReply(tid, reply._id);

    // @提及功能
    const newContent = content.replace(`[@${topicAuthor.name}](/user/${topicAuthor._id})`, '');
    at.sendMessageToMentionUsers(newContent, tid, ctx.session.user._id, reply._id);

    const user = await User.getUserById(ctx.session.user._id);
    user.score += 5;
    user.reply_count += 1;
    await user.save();
    ctx.session.user = user;

    if (topic.author_id.toString() !== ctx.session.user._id.toString()) {
      await message.sendReplyMessage(topic.author_id, ctx.session.user._id, topic._id, reply._id);
    }

    return ctx.redirect(`/topic/${tid}#${reply._id}`);
  } catch (err) {
    return next(err);
  }
});

router.post('/reply/:rid/delete', 
  auth.userRequired, 
  async (ctx, next) => {
  try {
    const rid = ctx.params.rid;
    const reply = await Reply.getReplyById(rid);

    if (!reply) {
      ctx.status = 422;
      ctx.body = { status: `no reply ${rid} exists` };
      return;
    }

    const currentUserId = ctx.session.user._id;
    const isAuthor = reply.author_id.toString() === currentUserId.toString();
    const isAdmin = ctx.session.user.is_admin;

    if (isAuthor || isAdmin) {
      reply.deleted = true;
      await reply.save();

      reply.author.score -= 5;
      reply.author.reply_count -= 1;
      await reply.author.save();

      ctx.body = { status: 'success' };
    } else {
      ctx.body = { status: 'failed' };
    }

    Topic.reduceCount(reply.topic_id, _.noop);
  } catch (err) {
    return next(err);
  }
});

router.get('/reply/:rid/edit', 
  auth.userRequired, 
  async (ctx, next) => {
  const rid = ctx.params.rid;
  const reply = await Reply.getReplyById(rid);

  if (!reply) {
    return ctx.render404('reply not exist or deleted');
  }

  const isOwner = ctx.session.user._id.equals(reply.author_id);
  const isAdmin = ctx.session.user.is_admin;

  if (isOwner || isAdmin) {
    return ctx.render('reply/edit', {
      rid: reply._id,
      content: reply.content
    });
  } else {
    return ctx.renderError('can not edit this reply', 403);
  }
});

router.post('/reply/:rid/edit', 
  auth.userRequired, 
  async (ctx, next) => {
  const rid = ctx.params.rid;
  const content = ctx.request.body.t_content;

  const reply = await Reply.getReplyById(rid);
  if (!reply) {
    return ctx.render404('reply not exist or deleted');
  }

  const isOwner = String(reply.author_id) === ctx.session.user._id.toString();
  const isAdmin = ctx.session.user.is_admin;

  if (isOwner || isAdmin) {
    if (content.trim().length > 0) {
      reply.content = content;
      reply.update_at = new Date();
      await reply.save();
      return ctx.redirect(`/topic/${reply.topic_id}#${reply._id}`);
    } else {
      return ctx.renderError('reply is too short', 400);
    }
  } else {
    return ctx.renderError('can not edit this reply', 403);
  }
});

router.post('/reply/:rid/up', 
  auth.userRequired, 
  async (ctx, next) => {
  try {
    const rid = ctx.params.rid;
    const uid = ctx.session.user._id;
    const reply = await Reply.getReplyById(rid);

    if (reply.author_id.equals(uid) && !global.config.debug) {
      return ctx.body = {
        success: false,
        message: 'can not up yourself',
      };
    }

    reply.ups = reply.ups || [];
    let action;
    const upIndex = reply.ups.indexOf(uid);
    if (upIndex === -1) {
      reply.ups.push(uid);
      action = 'up';
    } else {
      reply.ups.splice(upIndex, 1);
      action = 'down';
    }
    await reply.save();

    ctx.body = {
      success: true,
      action: action
    };
  } catch (err) {
    return next(err);
  }
});

module.exports = router;