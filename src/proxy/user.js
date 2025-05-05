const modelUser = require('../models/user');
const uuid      = require('node-uuid');

exports.getUserById = async function (id) {
  if (!id) return null;
  return await modelUser.findOne({ _id: id });
};

exports.getUsersByIds = async function (ids) {
  return await modelUser.find({ _id: { $in: ids } });
};

exports.getUserByMail = async function (email) {
  return await modelUser.findOne({ email: email });
};

exports.getUsersByQuery = async function (query, opt = {}) {
  return await modelUser.find(query, '', opt);
};

exports.newAndSave = async function (name, pass, email, icon, active = false) {
  const user = new modelUser({
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
