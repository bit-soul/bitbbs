var mongoose = require('mongoose');
var logger = require('../common/logger')

mongoose.connect(global.config.mongodb_cfg.db, {
  poolSize: 20,
  useCreateIndex: true,
  useNewUrlParser: true,
  reconnectTries: 5,
  reconnectInterval: 3000,
  serverSelectionTimeoutMS: 5000,
}, function (err) {
  if (err) {
    logger.error('connect to %s error: ', global.config.mongodb_cfg.db, err.message);
    process.exit(1);
  }
});

// models
require('./system');
require('./user');
require('./topic');
require('./reply');
require('./topic_collect');
require('./message');

exports.System       = mongoose.model('System');
exports.User         = mongoose.model('User');
exports.Topic        = mongoose.model('Topic');
exports.Reply        = mongoose.model('Reply');
exports.TopicCollect = mongoose.model('TopicCollect');
exports.Message      = mongoose.model('Message');
