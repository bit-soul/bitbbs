var mongoose = require('mongoose');
var logger = require('../common/logger')

mongoose.set('strictQuery', true);
mongoose.connect(global.config.mongodb_cfg.db, {
  maxPoolSize: 10,  
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000,
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
require('./marktopic');
require('./message');

exports.System    = mongoose.model('System');
exports.User      = mongoose.model('User');
exports.Topic     = mongoose.model('Topic');
exports.Reply     = mongoose.model('Reply');
exports.MarkTopic = mongoose.model('MarkTopic');
exports.Message   = mongoose.model('Message');
