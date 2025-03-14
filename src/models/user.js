var mongoose  = require('mongoose');
var BaseModel = require("./base_model");
var Schema    = mongoose.Schema;
var utility   = require('utility');
var _ = require('lodash');

var UserSchema = new Schema({
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
  collect_topic_count: { type: Number, default: 0 },

  follower_count: { type: Number, default: 0 },
  following_count: { type: Number, default: 0 },

  active: { type: Boolean, default: false },
  create_at: { type: Date, default: Date.now },
  update_at: { type: Date, default: Date.now },
  is_star: { type: Boolean, default: false },
  is_block: {type: Boolean, default: false},

  retrieve_time: {type: Number},
  retrieve_key: {type: String},

  accessToken: {type: String},
}, { versionKey: false });

UserSchema.plugin(BaseModel);
UserSchema.virtual('avatar_url').get(function () {
  var url = this.icon || '/static/img/nobody.png';

  // www.gravatar.com 被墙
  url = url.replace('www.gravatar.com', 'gravatar.com');

  // 让协议自适应 protocol，使用 `//` 开头
  if (url.indexOf('http:') === 0) {
    url = url.slice(5);
  }

  // 如果是 github 的头像，则限制大小
  if (url.indexOf('githubusercontent') !== -1) {
    url += '&s=120';
  }

  return url;
});

UserSchema.virtual('isAdvanced').get(function () {
  // 积分高于 1000 则认为是高级用户
  return this.score > 1000 || this.is_star;
});

UserSchema.index({email: 1}, {unique: true, sparse: true});
UserSchema.index({addr: 1}, {unique: true, sparse: true});
UserSchema.index({score: -1});
UserSchema.index({githubId: 1});
UserSchema.index({accessToken: 1});

UserSchema.pre('save', function(next){
  var now = new Date();
  this.update_at = now;
  next();
});

mongoose.model('User', UserSchema);
