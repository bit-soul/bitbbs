const lodash         = require('lodash');
const modelMarkTopic = require('../models/marktopic');

exports.getMarkTopic = async function (userId, topicId) {
  return await modelMarkTopic.findOne({ user_id: userId, topic_id: topicId });
};

exports.getMarkTopicsByUserId = async function (userId, opt = {}) {
  const defaultOpt = { sort: '-create_at' };
  const finalOpt = lodash.assign(defaultOpt, opt);
  return await modelMarkTopic.find({ user_id: userId }, '', finalOpt);
};

exports.newAndSave = async function (userId, topicId) {
  const marktopic = new modelMarkTopic();
  marktopic.user_id = userId;
  marktopic.topic_id = topicId;
  return await marktopic.save();
};

exports.remove = async function (userId, topicId) {
  return await modelMarkTopic.deleteOne({ user_id: userId, topic_id: topicId });
};
