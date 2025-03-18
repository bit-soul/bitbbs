var mongoose  = require('mongoose');
var Schema    = mongoose.Schema;

var SystemSchema = new Schema({
  user_cnt: { type: Number, default: 0},
}, { versionKey: false });

mongoose.model('System', SystemSchema);
