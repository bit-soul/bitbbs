import mongoose from 'mongoose';
const { Schema } = mongoose;
const { ObjectId } = Schema;
import BaseModel from './base_model.js';

import config from '../config/index.js';

const UserSchema = new Schema({
  name: { type: String},
  biog: { type: String },
  icon: { type: String },

  addr: { type: String},

  email: { type: String},
  pass: { type: String },

  githubId: { type: String},
  githubUsername: {type: String},
  githubAccessToken: {type: String},

  score: { type: Number, default: 0 },
  topic_count: { type: Number, default: 0 },
  reply_count: { type: Number, default: 0 },
  mark_topic_count: { type: Number, default: 0 },

  follower_count: { type: Number, default: 0 },
  following_count: { type: Number, default: 0 },

  active: { type: Boolean, default: false },
  sequence: { type: Number, default: Date.now },
  create_at: { type: Date, default: Date.now },
  update_at: { type: Date, default: Date.now },
  is_advance: { type: Boolean, default: false },
  is_block: {type: Boolean, default: false},

  retrieve_time: {type: Number},
  retrieve_key: {type: String},

  accessToken: {type: String},
}, { versionKey: false });

UserSchema.plugin(BaseModel);

UserSchema.virtual('avatar_url').get(function() {
  return this.icon || config.site_static_host + '/static/img/nobody.png';
});

UserSchema.virtual('isAdvanced').get(function() {
  return this.score > 1000 || this.is_advance;
});

UserSchema.index({email: 1}, {unique: true, sparse: true});
UserSchema.index({addr: 1}, {unique: true, sparse: true});
UserSchema.index({score: -1});
UserSchema.index({githubId: 1});
UserSchema.index({accessToken: 1});

UserSchema.pre('save', async function() {
  const now = new Date();
  this.update_at = now;
});

export default mongoose.model('User', UserSchema);
