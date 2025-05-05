const modelMessage = require('../models/message');

exports.sendReplyMessage = async function (master_id, author_id, topic_id, reply_id) {
  const message = new modelMessage();
  message.type = 'reply';
  message.master_id = master_id;
  message.author_id = author_id;
  message.topic_id = topic_id;
  message.reply_id = reply_id;

  return await message.save(); // 返回保存结果
};

exports.sendAtMessage = async function (master_id, author_id, topic_id, reply_id) {
  const message = new modelMessage();
  message.type = 'at';
  message.master_id = master_id;
  message.author_id = author_id;
  message.topic_id = topic_id;
  message.reply_id = reply_id;

  return await message.save(); // 返回保存结果
};
