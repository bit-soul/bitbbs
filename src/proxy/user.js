var User    = require('../models/user');
var utility = require('utility');
var uuid    = require('node-uuid');

exports.getUserById = async function (id) {
  if (!id) return null;
  return await User.findOne({ _id: id });
};

exports.getUsersByIds = async function (ids) {
  return await User.find({ _id: { $in: ids } });
};

exports.getUserByMail = async function (email) {
  return await User.findOne({ email: email });
};

exports.getUsersByQuery = async function (query, opt = {}) {
  return await User.find(query, '', opt);
};

exports.newAndSave = async function (name, pass, email, icon, active = false) {
  const user = new User({
    name,
    pass,
    email,
    icon,
    active,
    accessToken: uuid.v4()
  });

  await user.save();
  return user;
};
