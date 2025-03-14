var validator = require('validator');

var at           = require('../common/at');
var User         = require('../proxy').User;
var Topic        = require('../proxy').Topic;
var TopicCollect = require('../proxy').TopicCollect;
var EventProxy   = require('eventproxy');
var tools        = require('../common/tools');
var store        = require('../common/store');
var _            = require('lodash');
var cache        = require('../common/cache');
var logger = require('../common/logger')

/**
 * Topic page
 *
 * @param  {HttpRequest} req
 * @param  {HttpResponse} res
 * @param  {Function} next
 */
exports.index = function (req, res, next) {
  function isUped(user, reply) {
    if (!reply.ups) {
      return false;
    }
    return reply.ups.indexOf(user._id) !== -1;
  }

  var topic_id = req.params.tid;
  var currentUser = req.session.user;

  if (topic_id.length !== 24) {
    return res.render404('Topic not exist or deleted');
  }
  var events = ['topic', 'other_topics', 'no_reply_topics', 'is_collect'];
  var ep = EventProxy.create(events,
    function (topic, other_topics, no_reply_topics, is_collect) {
    res.render('topic/index', {
      topic: topic,
      author_other_topics: other_topics,
      no_reply_topics: no_reply_topics,
      is_uped: isUped,
      is_collect: is_collect,
    });
  });

  ep.fail(next);

  Topic.getFullTopic(topic_id, ep.done(function (message, topic, author, replies) {
    if (message) {
      logger.error('getFullTopic error topic_id: ' + topic_id)
      return res.renderError(message);
    }

    topic.visit_count += 1;
    topic.save();

    topic.author  = author;
    topic.replies = replies;

    // 点赞数排名第三的回答，它的点赞数就是阈值
    topic.reply_up_threshold = (function () {
      var allUpCount = replies.map(function (reply) {
        return reply.ups && reply.ups.length || 0;
      });
      allUpCount = _.sortBy(allUpCount, Number).reverse();

      var threshold = allUpCount[2] || 0;
      if (threshold < 3) {
        threshold = 3;
      }
      return threshold;
    })();

    ep.emit('topic', topic);

    // get other_topics
    var options = { limit: 5, sort: '-last_reply_at'};
    var query = { author_id: topic.author_id, _id: { '$nin': [ topic._id ] } };
    Topic.getTopicsByQuery(query, options, ep.done('other_topics'));

    // get no_reply_topics
    cache.get('no_reply_topics', ep.done(function (no_reply_topics) {
      if (no_reply_topics) {
        ep.emit('no_reply_topics', no_reply_topics);
      } else {
        Topic.getTopicsByQuery(
          { reply_count: 0, tab: {$nin: ['job', 'dev']}},
          { limit: 5, sort: '-create_at'},
          ep.done('no_reply_topics', function (no_reply_topics) {
            cache.set('no_reply_topics', no_reply_topics, 60 * 1);
            return no_reply_topics;
          }));
      }
    }));
  }));

  if (!currentUser) {
    ep.emit('is_collect', null);
  } else {
    TopicCollect.getTopicCollect(currentUser._id, topic_id, ep.done('is_collect'))
  }
};

exports.create = function (req, res, next) {
  res.render('topic/edit', {
    tabs: global.config.tabs
  });
};


exports.put = function (req, res, next) {
  var title   = validator.trim(req.body.title);
  var tab     = validator.trim(req.body.tab);
  var content = validator.trim(req.body.t_content);

  // 得到所有的 tab, e.g. ['ask', 'share', ..]
  var allTabs = global.config.tabs.map(function (tPair) {
    return tPair[0];
  });

  // 验证
  var editError;
  if (title === '') {
    editError = 'Title can not be empty';
  } else if (title.length < 5 || title.length > 100) {
    editError = 'Title is too short';
  } else if (!tab || allTabs.indexOf(tab) === -1) {
    editError = 'Must select category';
  } else if (content === '') {
    editError = 'Content can not be empty';
  }
  // END 验证

  if (editError) {
    res.status(422);
    return res.render('topic/edit', {
      edit_error: editError,
      title: title,
      content: content,
      tabs: global.config.tabs
    });
  }

  Topic.newAndSave(title, content, tab, req.session.user._id, function (err, topic) {
    if (err) {
      return next(err);
    }

    var proxy = new EventProxy();

    proxy.all('score_saved', function () {
      res.redirect('/topic/' + topic._id);
    });
    proxy.fail(next);
    User.getUserById(req.session.user._id, proxy.done(function (user) {
      user.score += 5;
      user.topic_count += 1;
      user.save();
      req.session.user = user;
      proxy.emit('score_saved');
    }));

    //发送at消息
    at.sendMessageToMentionUsers(content, topic._id, req.session.user._id);
  });
};

exports.showEdit = function (req, res, next) {
  var topic_id = req.params.tid;

  Topic.getTopicById(topic_id, function (err, topic, tags) {
    if (!topic) {
      res.render404('Topic not exist or deleted');
      return;
    }

    if (String(topic.author_id) === String(req.session.user._id) || req.session.user.is_admin) {
      res.render('topic/edit', {
        action: 'edit',
        topic_id: topic._id,
        title: topic.title,
        content: topic.content,
        tab: topic.tab,
        tabs: global.config.tabs
      });
    } else {
      res.renderError('Can not edit this topic', 403);
    }
  });
};

exports.update = function (req, res, next) {
  var topic_id = req.params.tid;
  var title    = req.body.title;
  var tab      = req.body.tab;
  var content  = req.body.t_content;

  // 得到所有的 tab, e.g. ['ask', 'share', ..]
  var allTabs = global.config.tabs.map(function (tPair) {
    return tPair[0];
  });

  Topic.getTopicById(topic_id, function (err, topic, tags) {
    if (!topic) {
      res.render404('Topic not exist or deleted');
      return;
    }

    if (topic.author_id.equals(req.session.user._id) || req.session.user.is_admin) {
      title   = validator.trim(title);
      tab     = validator.trim(tab);
      content = validator.trim(content);

      var editError;
      if (title === '') {
        editError = 'Title can not be empty';
      } else if (title.length < 5 || title.length > 100) {
        editError = 'Title is too short';
      } else if (!tab || allTabs.indexOf(tab) === -1) {
        editError = 'Must select category';
      }
      // END 验证

      if (editError) {
        return res.render('topic/edit', {
          action: 'edit',
          edit_error: editError,
          topic_id: topic._id,
          content: content,
          tabs: global.config.tabs
        });
      }

      //保存话题
      topic.title     = title;
      topic.content   = content;
      topic.tab       = tab;
      topic.update_at = new Date();

      topic.save(function (err) {
        if (err) {
          return next(err);
        }
        //发送at消息
        at.sendMessageToMentionUsers(content, topic._id, req.session.user._id);

        res.redirect('/topic/' + topic._id);

      });
    } else {
      res.renderError('Can not edit this topic', 403);
    }
  });
};

exports.delete = function (req, res, next) {
  //删除话题, 话题作者topic_count减1
  //删除回复，回复作者reply_count减1
  //删除topic_collect，用户collect_topic_count减1

  var topic_id = req.params.tid;

  Topic.getFullTopic(topic_id, function (err, err_msg, topic, author, replies) {
    if (err) {
      return res.send({ success: false, message: err.message });
    }
    if (!req.session.user.is_admin && !(topic.author_id.equals(req.session.user._id))) {
      res.status(403);
      return res.send({success: false, message: 'No Permision'});
    }
    if (!topic) {
      res.status(422);
      return res.send({ success: false, message: 'Topic not exist or deleted' });
    }
    author.score -= 5;
    author.topic_count -= 1;
    author.save();

    topic.deleted = true;
    topic.save(function (err) {
      if (err) {
        return res.send({ success: false, message: err.message });
      }
      res.send({ success: true, message: 'Topic is deleted' });
    });
  });
};

// 设为置顶
exports.top = function (req, res, next) {
  var topic_id = req.params.tid;
  var referer  = req.get('referer');

  if (topic_id.length !== 24) {
    res.render404('Topic not exist or deleted');
    return;
  }
  Topic.getTopic(topic_id, function (err, topic) {
    if (err) {
      return next(err);
    }
    if (!topic) {
      res.render404('Topic not exist or deleted');
      return;
    }
    topic.top = !topic.top;
    topic.save(function (err) {
      if (err) {
        return next(err);
      }
      var msg = topic.top ? 'Topped。' : 'Cancel Topped';
      res.render('notify/notify', {success: msg, referer: referer});
    });
  });
};

// 设为精华
exports.good = function (req, res, next) {
  var topicId = req.params.tid;
  var referer = req.get('referer');

  Topic.getTopic(topicId, function (err, topic) {
    if (err) {
      return next(err);
    }
    if (!topic) {
      res.render404('Topic not exist or deleted');
      return;
    }
    topic.good = !topic.good;
    topic.save(function (err) {
      if (err) {
        return next(err);
      }
      var msg = topic.good ? 'Gooded。' : 'Cancel Gooded';
      res.render('notify/notify', {success: msg, referer: referer});
    });
  });
};

// 锁定主题，不可再回复
exports.lock = function (req, res, next) {
  var topicId = req.params.tid;
  var referer = req.get('referer');
  Topic.getTopic(topicId, function (err, topic) {
    if (err) {
      return next(err);
    }
    if (!topic) {
      res.render404('Topic not exist or deleted');
      return;
    }
    topic.lock = !topic.lock;
    topic.save(function (err) {
      if (err) {
        return next(err);
      }
      var msg = topic.lock ? 'Locked。' : 'Cancel Locked';
      res.render('notify/notify', {success: msg, referer: referer});
    });
  });
};

// 收藏主题
exports.collect = function (req, res, next) {
  var topic_id = req.body.topic_id;

  Topic.getTopic(topic_id, function (err, topic) {
    if (err) {
      return next(err);
    }
    if (!topic) {
      res.json({status: 'failed'});
    }

    TopicCollect.getTopicCollect(req.session.user._id, topic._id, function (err, doc) {
      if (err) {
        return next(err);
      }
      if (doc) {
        res.json({status: 'failed'});
        return;
      }

      TopicCollect.newAndSave(req.session.user._id, topic._id, function (err) {
        if (err) {
          return next(err);
        }
        res.json({status: 'success'});
      });
      User.getUserById(req.session.user._id, function (err, user) {
        if (err) {
          return next(err);
        }
        user.collect_topic_count += 1;
        user.save();
      });

      req.session.user.collect_topic_count += 1;
      topic.collect_count += 1;
      topic.save();
    });
  });
};

exports.de_collect = function (req, res, next) {
  var topic_id = req.body.topic_id;
  Topic.getTopic(topic_id, function (err, topic) {
    if (err) {
      return next(err);
    }
    if (!topic) {
      res.json({status: 'failed'});
    }
    TopicCollect.remove(req.session.user._id, topic._id, function (err, removeResult) {
      if (err) {
        return next(err);
      }
      if (removeResult.n == 0) {
        return res.json({status: 'failed'})
      }

      User.getUserById(req.session.user._id, function (err, user) {
        if (err) {
          return next(err);
        }
        user.collect_topic_count -= 1;
        req.session.user = user;
        user.save();
      });

      topic.collect_count -= 1;
      topic.save();

      res.json({status: 'success'});
    });
  });
};

exports.presignedurl = function (req, res, next) {
  var fileName = req.query.filename;
  var fileType = req.query.filetype;
  var fileSize = parseInt(req.query.filesize);
  if(fileSize > 1*1024*1024) {
    res.json({
      code: -1,
      mess: 'file size too large, max size is 1MB',
    });
    return;
  }
  try {
    store.presignedUrl(global.config.s3_client.prefix+fileName, fileType, fileSize).then((url) => {
      res.json({
        code: 0,
        data: {
          readurl: global.config.s3_client.readpoint + '/' + global.config.s3_client.prefix + fileName,
          uploadurl: url,
        },
      });
    });
  } catch (err) {
    return next(err);
  }
}

exports.upload = function (req, res, next) {
  var isFileLimit = false;
  req.busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
      file.on('limit', function () {
        isFileLimit = true;

        res.json({
          success: false,
          msg: 'File size too large. Max is ' + global.config.file_limit
        })
      });

      store.upload(file, {filename: filename}, function (err, result) {
        if (err) {
          return next(err);
        }
        if (isFileLimit) {
          return;
        }
        res.json({
          success: true,
          url: result.url,
        });
      });

    });

  req.pipe(req.busboy);
};
