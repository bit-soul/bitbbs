var validator  = require('validator');
var _          = require('lodash');
var at         = require('../common/at');
var message    = require('../common/message');
var EventProxy = require('eventproxy');
var User       = require('../proxy').User;
var Topic      = require('../proxy').Topic;
var Reply      = require('../proxy').Reply;

/**
 * 添加回复
 */
exports.add = function (req, res, next) {
  var content = req.body.r_content;
  var tid = req.params.tid;
  var rid = req.body.rid;

  var str = validator.trim(String(content));
  if (str === '') {
    return res.renderError('Content can not be empty', 422);
  }

  var ep = EventProxy.create();
  ep.fail(next);

  Topic.getTopic(tid, ep.doneLater(function (topic) {
    if (!topic) {
      ep.unbind();
      // just 404 page
      return next();
    }

    if (topic.lock) {
      return res.status(403).send('Topic is locked');
    }
    ep.emit('topic', topic);
  }));

  ep.all('topic', function (topic) {
    User.getUserById(topic.author_id, ep.done('topic_author'));
  });

  ep.all('topic', 'topic_author', function (topic, topicAuthor) {
    Reply.newAndSave(content, tid, req.session.user._id, rid, ep.done(function (reply) {
      Topic.updateLastReply(tid, reply._id, ep.done(function () {
        ep.emit('reply_saved', reply);
        //发送at消息，并防止重复 at 作者
        var newContent = content.replace('[@' + topicAuthor.name + '](/user/' + topicAuthor._id + ')', '');
        at.sendMessageToMentionUsers(newContent, tid, req.session.user._id, reply._id);
      }));
    }));

    User.getUserById(req.session.user._id, ep.done(function (user) {
      user.score += 5;
      user.reply_count += 1;
      user.save();
      req.session.user = user;
      ep.emit('score_saved');
    }));
  });

  ep.all('reply_saved', 'topic', function (reply, topic) {
    if (topic.author_id.toString() !== req.session.user._id.toString()) {
      message.sendReplyMessage(topic.author_id, req.session.user._id, topic._id, reply._id);
    }
    ep.emit('message_saved');
  });

  ep.all('reply_saved', 'message_saved', 'score_saved', function (reply) {
    res.redirect('/topic/' + tid + '#' + reply._id);
  });
};

/**
 * 删除回复信息
 */
exports.delete = function (req, res, next) {
  var rid = req.body.rid;
  Reply.getReplyById(rid, function (err, reply) {
    if (err) {
      return next(err);
    }

    if (!reply) {
      res.status(422);
      res.json({status: 'no reply ' + rid + ' exists'});
      return;
    }
    if (reply.author_id.toString() === req.session.user._id.toString() || req.session.user.is_admin) {
      reply.deleted = true;
      reply.save();
      res.json({status: 'success'});

      reply.author.score -= 5;
      reply.author.reply_count -= 1;
      reply.author.save();
    } else {
      res.json({status: 'failed'});
      return;
    }

    Topic.reduceCount(reply.topic_id, _.noop);
  });
};
/*
 打开回复编辑器
 */
exports.showEdit = function (req, res, next) {
  var rid = req.params.rid;

  Reply.getReplyById(rid, function (err, reply) {
    if (!reply) {
      return res.render404('reply not exist or deleted');
    }
    if (req.session.user._id.equals(reply.author_id) || req.session.user.is_admin) {
      res.render('reply/edit', {
        rid: reply._id,
        content: reply.content
      });
    } else {
      return res.renderError('can not edit this reply', 403);
    }
  });
};
/*
 提交编辑回复
 */
exports.update = function (req, res, next) {
  var rid = req.params.rid;
  var content = req.body.t_content;

  Reply.getReplyById(rid, function (err, reply) {
    if (!reply) {
      return res.render404('reply not exist or deleted');
    }

    if (String(reply.author_id) === req.session.user._id.toString() || req.session.user.is_admin) {

      if (content.trim().length > 0) {
        reply.content = content;
        reply.update_at = new Date();
        reply.save(function (err) {
          if (err) {
            return next(err);
          }
          res.redirect('/topic/' + reply.topic_id + '#' + reply._id);
        });
      } else {
        return res.renderError('reply is too short', 400);
      }
    } else {
      return res.renderError('can not edit this reply', 403);
    }
  });
};

exports.up = function (req, res, next) {
  var rid = req.params.rid;
  var uid = req.session.user._id;
  Reply.getReplyById(rid, function (err, reply) {
    if (err) {
      return next(err);
    }
    if (reply.author_id.equals(uid) && !global.config.debug) {
      // 不能帮自己点赞
      res.send({
        success: false,
        message: 'can not up yourself',
      });
    } else {
      var action;
      reply.ups = reply.ups || [];
      var upIndex = reply.ups.indexOf(uid);
      if (upIndex === -1) {
        reply.ups.push(uid);
        action = 'up';
      } else {
        reply.ups.splice(upIndex, 1);
        action = 'down';
      }
      reply.save(function () {
        res.send({
          success: true,
          action: action
        });
      });
    }
  });
};
