const mongoose  = require('mongoose');
const Schema    = mongoose.Schema;

const SystemSchema = new Schema({
  user_cnt: { type: Number, default: 0},
}, { versionKey: false });

module.exports = mongoose.model('System', SystemSchema);
