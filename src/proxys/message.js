const modelMessage = require('../models/message');

const proxyUser = require('./user');
const proxyTopic = require('./topic');
const proxyReply = require('./reply');


/**
 * 获取未读消息数量
 */
exports.getMessagesCount = async function (id) {
  return await modelMessage.countDocuments({ master_id: id, has_read: false });
};

/**
 * 根据消息Id获取消息，并附加关联信息
 */
exports.getMessageById = async function (id) {
  const message = await modelMessage.findOne({ _id: id });
  if (!message) {
    throw new Error('modelMessage not found');
  }
  return await getMessageRelations(message);
};

/**
 * 获取消息的关联信息（作者、话题、回复）
 */
const getMessageRelations = exports.getMessageRelations = async function (message) {
  if (['reply', 'reply2', 'at'].includes(message.type)) {
    const [author, topic, reply] = await Promise.all([
      proxyUser.getUserById(message.author_id),
      proxyTopic.getTopicById(message.topic_id),
      proxyReply.getReplyById(message.reply_id)
    ]);

    message.author = author;
    message.topic = topic;
    message.reply = reply;

    if (!author || !topic) {
      message.is_invalid = true;
    }

    return message;
  } else {
    return { is_invalid: true };
  }
};

/**
 * 获取已读消息列表
 */
exports.getReadMessagesByUserId = async function (userId) {
  return await modelMessage.find(
    { master_id: userId, has_read: true },
    null,
    { sort: '-create_at', limit: 20 }
  );
};

/**
 * 获取未读消息列表
 */
exports.getUnreadMessageByUserId = async function (userId) {
  return await modelMessage.find(
    { master_id: userId, has_read: false },
    null,
    { sort: '-create_at' }
  );
};

/**
 * 批量将消息设为已读
 */
exports.updateMessagesToRead = async function (userId, messages) {
  if (!messages.length) {return;}

  const ids = messages.map(m => m.id);
  const query = { master_id: userId, _id: { $in: ids } };

  await modelMessage.updateMany(query, { $set: { has_read: true } });
};

/**
 * 设置单个消息为已读
 */
exports.updateOneMessageToRead = async function (msg_id) {
  if (!msg_id) {return;}

  const query = { _id: msg_id };
  await modelMessage.updateMany(query, { $set: { has_read: true } });
};
