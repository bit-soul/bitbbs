import mongoose from 'mongoose';
const { Schema } = mongoose;
const { ObjectId } = Schema;
import BaseModel from './base_model.js';


const MarkTopicSchema = new Schema({
  user_id: { type: ObjectId },
  topic_id: { type: ObjectId },
  create_at: { type: Date, default: Date.now }
}, { versionKey: false });

MarkTopicSchema.plugin(BaseModel);
MarkTopicSchema.index({user_id: 1, topic_id: 1}, {unique: true});


export default mongoose.model('MarkTopic', MarkTopicSchema);
