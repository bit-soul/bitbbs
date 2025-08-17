import mongoose from 'mongoose';
const { Schema } = mongoose;
const { ObjectId } = Schema;
import BaseModel from './base_model.js';

/*
 * type:
 * reply: xx 回复了你的话题
 * reply2: xx 在话题中回复了你
 * follow: xx 关注了你
 * at: xx ＠了你
 */
const MessageSchema = new Schema({
  type: { type: String },
  master_id: { type: ObjectId},
  author_id: { type: ObjectId },
  topic_id: { type: ObjectId },
  reply_id: { type: ObjectId },
  has_read: { type: Boolean, default: false },
  create_at: { type: Date, default: Date.now }
}, { versionKey: false });
MessageSchema.plugin(BaseModel);
MessageSchema.index({master_id: 1, has_read: -1, create_at: -1});

export default mongoose.model('Message', MessageSchema);
