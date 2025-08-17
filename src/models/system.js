import mongoose from 'mongoose';
const { Schema } = mongoose;
const { ObjectId } = Schema;
import BaseModel from './base_model.js';

const SystemSchema = new Schema({
  user_cnt: { type: Number, default: 0},
}, { versionKey: false });

export default mongoose.model('System', SystemSchema);
