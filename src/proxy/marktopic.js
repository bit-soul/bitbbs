var MarkTopic = require('../models').MarkTopic;
var _ = require('lodash')

exports.getMarkTopic = async function (userId, topicId) {
  return await MarkTopic.findOne({ user_id: userId, topic_id: topicId });
};

exports.getMarkTopicsByUserId = async function (userId, opt = {}) {
  const defaultOpt = { sort: '-create_at' };
  const finalOpt = _.assign(defaultOpt, opt);
  return await MarkTopic.find({ user_id: userId }, '', finalOpt);
};

exports.newAndSave = async function (userId, topicId) {
  const marktopic = new MarkTopic();
  marktopic.user_id = userId;
  marktopic.topic_id = topicId;
  return await marktopic.save();
};

exports.remove = async function (userId, topicId) {
  return await MarkTopic.deleteOne({ user_id: userId, topic_id: topicId });
};
