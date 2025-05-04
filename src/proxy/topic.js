var models     = require('../models');
var Topic      = models.Topic;
var User       = require('./user');
var Reply      = require('./reply');
var at         = require('../common/at');
var _          = require('lodash');

exports.getTopicById = async function (id) {
  const topic = await Topic.findOne({ _id: id });
  if (!topic) return { topic: null, author: null, lastReply: null };

  const [author, lastReply] = await Promise.all([
    User.getUserById(topic.author_id),
    topic.last_reply ? Reply.getReplyById(topic.last_reply) : null
  ]);

  return { topic, author, lastReply };
};

exports.getCountByQuery = async function (query) {
  return await Topic.countDocuments(query);
};

exports.getTopicsByQuery = async function (query, opt = {}) {
  query.deleted = false;
  const topics = await Topic.find(query, {}, opt);
  if (!topics || topics.length === 0) return [];

  const enrichedTopics = await Promise.all(
    topics.map(async (topic) => {
      const [author, reply] = await Promise.all([
        User.getUserById(topic.author_id),
        Reply.getReplyById(topic.last_reply),
      ]);

      if (!author) return null;

      topic.author = author;
      topic.reply = reply;
      return topic;
    })
  );

  return _.compact(enrichedTopics);
};

exports.getLimit5w = async function () {
  return await Topic.find({ deleted: false }, '_id', {
    limit: 50000,
    sort: '-create_at'
  });
};

exports.getFullTopic = async function (id) {
  const topic = await Topic.findOne({ _id: id, deleted: false });
  if (!topic) {
    throw new Error('Topic not exist or deleted');
  }

  const [linkedContent, author, replies] = await Promise.all([
    at.textShowProcess(topic.content),
    User.getUserById(topic.author_id),
    Reply.getRepliesByTopicId(topic._id),
  ]);

  if (!author) {
    throw new Error('Topic author not exist');
  }

  topic.linkedContent = linkedContent;
  return { message: '', topic, author, replies };
};

exports.updateLastReply = async function (topicId, replyId) {
  const topic = await Topic.findOne({ _id: topicId });
  if (!topic) throw new Error('Topic not exist');

  topic.last_reply = replyId;
  topic.last_reply_at = new Date();
  topic.reply_count += 1;

  await topic.save();
  return topic;
};

exports.getTopic = async function (id) {
  return await Topic.findOne({ _id: id });
};

exports.reduceCount = async function (id) {
  const topic = await Topic.findOne({ _id: id });
  if (!topic) throw new Error('Topic not exist or deleted');

  topic.reply_count -= 1;

  const reply = await Reply.getLastReplyByTopId(id);
  topic.last_reply = reply.length !== 0 ? reply[0]._id : null;

  await topic.save();
  return topic;
};

exports.newAndSave = async function (title, content, tab, authorId) {
  const topic = new Topic({
    title,
    content,
    tab,
    author_id: authorId,
  });

  await topic.save();
  return topic;
};
