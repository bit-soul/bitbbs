const mongoose  = require('mongoose');
const Schema    = mongoose.Schema;
const ObjectId  = Schema.ObjectId;
const BaseModel = require("./base_model");

const MarkTopicSchema = new Schema({
  user_id: { type: ObjectId },
  topic_id: { type: ObjectId },
  create_at: { type: Date, default: Date.now }
}, { versionKey: false });

MarkTopicSchema.plugin(BaseModel);
MarkTopicSchema.index({user_id: 1, topic_id: 1}, {unique: true});

module.exports = mongoose.model('MarkTopic', MarkTopicSchema);
