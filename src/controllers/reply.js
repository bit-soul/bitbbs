import * as proxyUser from '../proxys/user.js';
import * as proxyTopic from '../proxys/topic.js';
import * as proxyReply from '../proxys/reply.js';
import * as midAuth from '../middlewares/auth.js';
import * as midLimit from '../middlewares/limit.js';
import * as at from '../common/at.js';
import * as message from '../common/message.js';

import Router from '@koa/router';
import lodash from 'lodash';
import validator from 'validator';

const router = new Router();

router.post('/reply/to/:tid',
  midAuth.userRequired,
  midLimit.peruserperday('create_reply', global.config.create_reply_per_day, {showJson: false}),
  async (ctx, next) => {
    const content = ctx.request.body.r_content;
    const tid = ctx.params.tid;
    const rid = ctx.request.body.rid;

    const str = validator.trim(String(content));
    if (str === '') {
      ctx.status = 422;
      return await ctx.render('misc/notify', { error: 'Content can not be empty' });
    }

    const topic = await proxyTopic.getTopic(tid);
    if (!topic) {return next();} // 404
    if (topic.lock) {
      ctx.status = 403;
      return ctx.body = 'proxyTopic is locked';
    }

    const topicAuthor = await proxyUser.getUserById(topic.author_id);

    const reply = await proxyReply.newAndSave(content, tid, ctx.session.user_id, rid);
    await proxyTopic.updateLastReply(tid, reply._id);

    // @提及功能
    const newContent = content.replace(`[@${topicAuthor.name}](/user/${topicAuthor._id})`, '');
    at.sendMessageToMentionUsers(newContent, tid, ctx.session.user_id, reply._id);

    const user = await proxyUser.getUserById(ctx.session.user_id);
    user.score += 5;
    user.reply_count += 1;
    await user.save();

    if (topic.author_id.toString() !== ctx.session.user_id.toString()) {
      await message.sendReplyMessage(topic.author_id, ctx.session.user_id, topic._id, reply._id);
    }

    return ctx.redirect(`/topic/${tid}#${reply._id}`);
  }
);

router.post('/reply/:rid/delete',
  midAuth.userRequired,
  async (ctx, next) => {
    const rid = ctx.params.rid;
    const reply = await proxyReply.getReplyById(rid);

    if (!reply) {
      ctx.status = 422;
      ctx.body = { status: `no reply ${rid} exists` };
      return;
    }

    const currentUserId = ctx.session.user_id;
    const isAuthor = reply.author_id.toString() === currentUserId.toString();
    const isAdmin = ctx.session.is_admin;

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

    proxyTopic.reduceCount(reply.topic_id, lodash.noop);
  }
);

router.get('/reply/:rid/edit',
  midAuth.userRequired,
  async (ctx, next) => {
    const rid = ctx.params.rid;
    const reply = await proxyReply.getReplyById(rid);

    if (!reply) {
      ctx.status = 404;
      return await ctx.render('misc/notify', { error: 'reply not exist or deleted' });
    }

    const isOwner = ctx.session.user_id.equals(reply.author_id);
    const isAdmin = ctx.session.is_admin;

    if (isOwner || isAdmin) {
      return await ctx.render('reply/edit', {
        rid: reply._id,
        content: reply.content
      });
    } else {
      ctx.status = 403;
      return await ctx.render('misc/notify', { error: 'Can not edit this repy' });
    }
  }
);

router.post('/reply/:rid/edit',
  midAuth.userRequired,
  async (ctx, next) => {
    const rid = ctx.params.rid;
    const content = ctx.request.body.t_content;

    const reply = await proxyReply.getReplyById(rid);
    if (!reply) {
      ctx.status = 404;
      return await ctx.render('misc/notify', { error: 'reply not exist or deleted' });
    }

    const isOwner = String(reply.author_id) === ctx.session.user_id.toString();
    const isAdmin = ctx.session.is_admin;

    if (isOwner || isAdmin) {
      if (content.trim().length > 0) {
        reply.content = content;
        reply.update_at = new Date();
        await reply.save();
        return ctx.redirect(`/topic/${reply.topic_id}#${reply._id}`);
      } else {
        ctx.status = 400;
        return await ctx.render('misc/notify', { error: 'reply is too short' });
      }
    } else {
      ctx.status = 403;
      return await ctx.render('misc/notify', { error: 'Can not edit this repy' });
    }
  }
);

router.post('/reply/:rid/up',
  midAuth.userRequired,
  async (ctx, next) => {
    const rid = ctx.params.rid;
    const uid = ctx.session.user_id;
    const reply = await proxyReply.getReplyById(rid);

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
  }
);

export default router;
