var MarkTopic = require('../models').MarkTopic;
var _ = require('lodash')

exports.getMarkTopic = function (userId, topicId, callback) {
  MarkTopic.findOne({user_id: userId, topic_id: topicId}, callback);
};

exports.getMarkTopicsByUserId = function (userId, opt, callback) {
  var defaultOpt = {sort: '-create_at'};
  opt = _.assign(defaultOpt, opt)
  MarkTopic.find({user_id: userId}, '', opt, callback);
};

exports.newAndSave = function (userId, topicId, callback) {
  var marktopic      = new MarkTopic();
  marktopic.user_id  = userId;
  marktopic.topic_id = topicId;
  marktopic.save(callback);
};

exports.remove = function (userId, topicId, callback) {
  MarkTopic.deleteOne({user_id: userId, topic_id: topicId}, callback);
};

