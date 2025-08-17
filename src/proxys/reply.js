import modelReply from '../models/reply.js';
import * as proxyUser from './user.js';
import * as at from '../common/at.js';


export async function getReply(id) {
  return await modelReply.findOne({ _id: id });
}

export async function getReplyById(id) {
  if (!id) {
    return null;
  }

  const reply = await modelReply.findOne({ _id: id });
  if (!reply) {return null;}

  const author = await proxyUser.getUserById(reply.author_id);
  reply.author = author;

  if (reply.is_html) {
    return reply;
  }

  const str = await at.textShowProcess(reply.content);
  reply.content = str;

  return reply;
}

export async function getRepliesByTopicId(id) {
  const replies = await modelReply.find({ topic_id: id, deleted: false }, '', { sort: 'create_at' });
  if (replies.length === 0) {
    return [];
  }

  await Promise.all(replies.map(async (reply) => {
    const author = await proxyUser.getUserById(reply.author_id);
    reply.author = author || { _id: '' };

    if (!reply.is_html) {
      const str = await at.textShowProcess(reply.content);
      reply.content = str;
    }
  }));

  return replies;
}

export async function newAndSave(content, topicId, authorId, replyId = null) {
  const reply = new modelReply({
    content,
    topic_id: topicId,
    author_id: authorId,
    reply_id: replyId || undefined
  });

  await reply.save();
  return reply;
}

export async function getLastReplyByTopId(topicId) {
  return await modelReply.find({ topic_id: topicId, deleted: false }, '_id', {
    sort: { create_at: -1 },
    limit: 1
  });
}

export async function getRepliesByAuthorId(authorId, opt = {}) {
  return await modelReply.find({ author_id: authorId }, {}, opt);
}

export async function getCountByAuthorId(authorId) {
  return await modelReply.countDocuments({ author_id: authorId });
}
