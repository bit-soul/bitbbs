const modelUser = require('../models/user');
const tools     = require('../common/tools');

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
    accessToken: tools.uuid()
  });

  await user.save();
  return user;
};
