var Reply      = require('../models/reply');
var User       = require('./user');
var at         = require('../common/at');

exports.getReply = async function (id) {
  return await Reply.findOne({ _id: id });
};

exports.getReplyById = async function (id) {
  if (!id) {
    return null;
  }

  try {
    const reply = await Reply.findOne({ _id: id });
    if (!reply) return null;

    const author = await User.getUserById(reply.author_id);
    reply.author = author;

    if (reply.is_html) {
      return reply;
    }

    const str = await at.textShowProcess(reply.content);
    reply.content = str;

    return reply;
  } catch (err) {
    throw err;
  }
};

exports.getRepliesByTopicId = async function (id) {
  try {
    const replies = await Reply.find({ topic_id: id, deleted: false }, '', { sort: 'create_at' });
    if (replies.length === 0) {
      return [];
    }

    await Promise.all(replies.map(async (reply) => {
      const author = await User.getUserById(reply.author_id);
      reply.author = author || { _id: '' };

      if (!reply.is_html) {
        const str = await at.textShowProcess(reply.content);
        reply.content = str;
      }
    }));

    return replies;
  } catch (err) {
    throw err;
  }
};

exports.newAndSave = async function (content, topicId, authorId, replyId = null) {
  try {
    const reply = new Reply({
      content,
      topic_id: topicId,
      author_id: authorId,
      reply_id: replyId || undefined
    });

    await reply.save();
    return reply;
  } catch (err) {
    throw err;
  }
};

exports.getLastReplyByTopId = async function (topicId) {
  return await Reply.find({ topic_id: topicId, deleted: false }, '_id', {
    sort: { create_at: -1 },
    limit: 1
  });
};

exports.getRepliesByAuthorId = async function (authorId, opt = {}) {
  return await Reply.find({ author_id: authorId }, {}, opt);
};

exports.getCountByAuthorId = async function (authorId) {
  return await Reply.countDocuments({ author_id: authorId });
};
