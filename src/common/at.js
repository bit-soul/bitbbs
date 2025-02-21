var User       = require('../proxy').User;
var Message    = require('./message');
var EventProxy = require('eventproxy');
var _          = require('lodash');

/**
 * 从文本中提取出@username 标记的用户名数组
 * @param {String} text 文本内容
 * @return {Array} 用户名数组
 */
var fetchUserIds = function (text) {
  if (!text) {
    return [];
  }

  var ignoreRegexs = [
    /```.+?```/g, // 去除单行的 ```
    /^```[\s\S]+?^```/gm, // ``` 里面的是 pre 标签内容
    /`[\s\S]+?`/g, // 同一行中，`some code` 中内容也不该被解析
    /^    .*/gm, // 4个空格也是 pre 标签，在这里 . 不会匹配换行
  ];

  ignoreRegexs.forEach(function (ignore_regex) {
    text = text.replace(ignore_regex, '');
  });

  var results = text.match(/\[@[a-z0-9\-_]+\]\(\/user\/[a-f0-9]{24}\)/igm);
  var uids = [];
  if (results) {
    for (var i = 0, l = results.length; i < l; i++) {
      var result = results[i];
      var startIndex = result.indexOf('(/user/')+7;
      var endIndex = result.indexOf(')', startIndex);
      var uid = result.substring(startIndex, endIndex);
      uids.push(uid);
    }
  }
  uids = _.uniq(uids);
  return uids;
};
exports.fetchUserIds = fetchUserIds;

/**
 * 根据文本内容中读取用户，并发送消息给提到的用户
 * Callback:
 * - err, 数据库异常
 * @param {String} text 文本内容
 * @param {String} topicId 主题ID
 * @param {String} authorId 作者ID
 * @param {String} replyId 回复ID
 * @param {Function} callback 回调函数
 */
exports.sendMessageToMentionUsers = function (text, topicId, authorId, replyId, callback) {
  if (typeof replyId === 'function') {
    callback = replyId;
    replyId = null;
  }
  callback = callback || _.noop;

  User.getUsersByIds(fetchUserIds(text), function (err, users) {
    if (err || !users) {
      return callback(err);
    }
    var ep = new EventProxy();
    ep.fail(callback);

    users = users.filter(function (user) {
      return !user._id.equals(authorId);
    });

    ep.after('sent', users.length, function () {
      callback();
    });

    users.forEach(function (user) {
      Message.sendAtMessage(user._id, authorId, topicId, replyId, ep.done('sent'));
    });
  });
};

/**
 * 根据文本内容，替换为数据库中的数据
 * Callback:
 * - err, 数据库异常
 * - text, 替换后的文本内容
 * @param {String} text 文本内容
 * @param {Function} callback 回调函数
 */
exports.textShowProcess = function (text, callback) {
  if (!callback) {
    return text;
  }
  return callback(null, text);
};
