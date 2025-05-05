const proxyUser  = require('../proxy/user');
const Message    = require('./message');
const lodash     = require('lodash');

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
  uids = lodash.uniq(uids);
  return uids;
};
exports.fetchUserIds = fetchUserIds;


/**
 * 根据文本内容中读取用户，并发送消息给提到的用户
 * @param {String} text 文本内容
 * @param {String} topicId 主题ID
 * @param {String} authorId 作者ID
 * @param {String|null} replyId 回复ID（可选）
 */
exports.sendMessageToMentionUsers = async function (text, topicId, authorId, replyId = null) {
  const userIds = fetchUserIds(text);
  const users = await proxyUser.getUsersByIds(userIds);

  if (!users) {
    throw new Error('Users not found');
  }

  const filteredUsers = users.filter(user => !user._id.equals(authorId));

  await Promise.all(
    filteredUsers.map(user =>
      Message.sendAtMessage(user._id, authorId, topicId, replyId)
    )
  );
};

/**
 * 根据文本内容，替换为数据库中的数据
 * @param {String} text 文本内容
 * @returns {String} 替换后的文本内容（当前为原样返回）
 */
exports.textShowProcess = async function (text) {
  // 如果将来要替换为数据库处理，可在这里扩展
  return text;
};
