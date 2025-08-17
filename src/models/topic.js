import lodash from 'lodash';
import mongoose from 'mongoose';
const { Schema } = mongoose;
const { ObjectId } = Schema;
import BaseModel from './base_model.js';

import config from '../config/index.js';

const TopicSchema = new Schema({
  title: { type: String },
  content: { type: String },
  author_id: { type: ObjectId },
  top: { type: Boolean, default: false }, // 置顶帖
  good: { type: Boolean, default: false }, // 精华帖
  lock: { type: Boolean, default: false }, // 被锁定主题
  reply_count: { type: Number, default: 0 },
  visit_count: { type: Number, default: 0 },
  mark_count: { type: Number, default: 0 },
  create_at: { type: Date, default: Date.now },
  update_at: { type: Date, default: Date.now },
  last_reply: { type: ObjectId },
  last_reply_at: { type: Date, default: Date.now },
  is_html: { type: Boolean },
  tab: { type: String },
  tags: [{ type: String }],
  deleted: {type: Boolean, default: false},
});

TopicSchema.plugin(BaseModel);
TopicSchema.index({create_at: -1});
TopicSchema.index({top: -1, last_reply_at: -1});
TopicSchema.index({author_id: 1, create_at: -1});

TopicSchema.virtual('tabName').get(function () {
  var tab  = this.tab;
  var pair = lodash.find(config.tabs, function (_pair) {
    return _pair[0] === tab;
  });

  if (pair) {
    return pair[1];
  } else {
    return '';
  }
});

export default mongoose.model('Topic', TopicSchema);
