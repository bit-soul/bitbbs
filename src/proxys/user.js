import modelUser from '../models/user.js';
import * as tools from '../common/tools.js';


export async function getUserById(id) {
  if (!id) {return null;}
  return await modelUser.findOne({ _id: id });
}

export async function getUsersByIds (ids) {
  return await modelUser.find({ _id: { $in: ids } });
}

export async function getUserByMail (email) {
  return await modelUser.findOne({ email: email });
}

export async function getUsersByQuery (query, opt = {}) {
  return await modelUser.find(query, '', opt);
}

export async function newAndSave (name, pass, email, icon, active = false) {
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
}
