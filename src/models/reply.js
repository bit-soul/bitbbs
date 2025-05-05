const mongoose  = require('mongoose');
const Schema    = mongoose.Schema;
const ObjectId  = Schema.ObjectId;
const BaseModel = require("./base_model");

const ReplySchema = new Schema({
  content: { type: String },
  topic_id: { type: ObjectId},
  author_id: { type: ObjectId },
  reply_id: { type: ObjectId },
  create_at: { type: Date, default: Date.now },
  update_at: { type: Date, default: Date.now },
  is_html: { type: Boolean },
  ups: [Schema.Types.ObjectId],
  deleted: {type: Boolean, default: false},
});

ReplySchema.plugin(BaseModel);
ReplySchema.index({topic_id: 1});
ReplySchema.index({author_id: 1, create_at: -1});

module.exports = mongoose.model('Reply', ReplySchema);
