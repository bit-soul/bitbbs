var mongoose  = require('mongoose');
var BaseModel = require("./base_model");
var Schema    = mongoose.Schema;
var ObjectId  = Schema.ObjectId;

var MarkTopicSchema = new Schema({
  user_id: { type: ObjectId },
  topic_id: { type: ObjectId },
  create_at: { type: Date, default: Date.now }
}, { versionKey: false });

MarkTopicSchema.plugin(BaseModel);
MarkTopicSchema.index({user_id: 1, topic_id: 1}, {unique: true});

mongoose.model('MarkTopic', MarkTopicSchema);
