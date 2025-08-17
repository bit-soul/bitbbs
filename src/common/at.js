import lodash from 'lodash';

import * as Message from './message.js';
import * as proxyUser from '../proxys/user.js';

export async function fetchUserIds(text) {
  if (!text) {
    return [];
  }

  var ignoreRegexs = [
    /```.+?```/g, // 去除单行的 ```
    /^```[\s\S]+?^```/gm, // ``` 里面的是 pre 标签内容
    /`[\s\S]+?`/g, // 同一行中，`some code` 中内容也不该被解析
    /^ {4}.*/gm, // 4个空格也是 pre 标签，在这里 . 不会匹配换行
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
}


export async function sendMessageToMentionUsers(text, topicId, authorId, replyId = null) {
  const userIds = await fetchUserIds(text);
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
}


export async function textShowProcess(text) {
  // 如果将来要替换为数据库处理，可在这里扩展
  return text;
}
