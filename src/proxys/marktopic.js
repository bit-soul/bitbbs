import lodash from 'lodash';
import modelMarkTopic from '../models/marktopic.js';


export async function getMarkTopic(userId, topicId) {
  return await modelMarkTopic.findOne({ user_id: userId, topic_id: topicId });
}

export async function getMarkTopicsByUserId(userId, opt = {}) {
  const defaultOpt = { sort: '-create_at' };
  const finalOpt = lodash.assign(defaultOpt, opt);
  return await modelMarkTopic.find({ user_id: userId }, '', finalOpt);
}

export async function newAndSave(userId, topicId) {
  const marktopic = new modelMarkTopic();
  marktopic.user_id = userId;
  marktopic.topic_id = topicId;
  return await marktopic.save();
}

export async function remove(userId, topicId) {
  return await modelMarkTopic.deleteOne({ user_id: userId, topic_id: topicId });
}
