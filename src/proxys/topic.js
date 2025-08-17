import lodash from 'lodash';
import modelTopic from '../models/topic.js';
import * as proxyUser from './user.js';
import * as proxyReply from './reply.js';
import * as at from '../common/at.js';


export async function getTopicById(id) {
  const topic = await modelTopic.findOne({ _id: id });
  if (!topic) {return { topic: null, author: null, lastReply: null };}

  const [author, lastReply] = await Promise.all([
    proxyUser.getUserById(topic.author_id),
    topic.last_reply ? proxyReply.getReplyById(topic.last_reply) : null
  ]);

  return { topic, author, lastReply };
}

export async function getCountByQuery(query) {
  return await modelTopic.countDocuments(query);
}

export async function getTopicsByQuery(query, opt = {}) {
  query.deleted = false;
  const topics = await modelTopic.find(query, {}, opt);
  if (!topics || topics.length === 0) {return [];}

  const enrichedTopics = await Promise.all(
    topics.map(async (topic) => {
      const [author, reply] = await Promise.all([
        proxyUser.getUserById(topic.author_id),
        proxyReply.getReplyById(topic.last_reply),
      ]);

      if (!author) {return null;}

      topic.author = author;
      topic.reply = reply;
      return topic;
    })
  );

  return lodash.compact(enrichedTopics);
}

export async function getLimit5w() {
  return await modelTopic.find({ deleted: false }, '_id', {
    limit: 50000,
    sort: '-create_at'
  });
}

export async function getFullTopic (id) {
  const topic = await modelTopic.findOne({ _id: id, deleted: false });
  if (!topic) {
    throw new Error('modelTopic not exist or deleted');
  }

  const [linkedContent, author, replies] = await Promise.all([
    at.textShowProcess(topic.content),
    proxyUser.getUserById(topic.author_id),
    proxyReply.getRepliesByTopicId(topic._id),
  ]);

  if (!author) {
    throw new Error('modelTopic author not exist');
  }

  topic.linkedContent = linkedContent;
  return { message: '', topic, author, replies };
}

export async function updateLastReply(topicId, replyId) {
  const topic = await modelTopic.findOne({ _id: topicId });
  if (!topic) {throw new Error('modelTopic not exist');}

  topic.last_reply = replyId;
  topic.last_reply_at = new Date();
  topic.reply_count += 1;

  await topic.save();
  return topic;
}

export async function getTopic(id) {
  return await modelTopic.findOne({ _id: id });
}

export async function reduceCount (id) {
  const topic = await modelTopic.findOne({ _id: id });
  if (!topic) {throw new Error('modelTopic not exist or deleted');}

  topic.reply_count -= 1;

  const reply = await proxyReply.getLastReplyByTopId(id);
  topic.last_reply = reply.length !== 0 ? reply[0]._id : null;

  await topic.save();
  return topic;
}

export async function newAndSave (title, content, tab, authorId) {
  const topic = new modelTopic({
    title,
    content,
    tab,
    author_id: authorId,
  });

  await topic.save();
  return topic;
}
