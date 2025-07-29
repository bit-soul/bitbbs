const tools = require('../src/common/tools');
const proxyUser = require('../src/proxys/user');
const proxyTopic = require('../src/proxys/topic');
const proxyReply = require('../src/proxys/reply');

function randomInt() {
  return (Math.random() * 10000).toFixed(0);
}

function mockUser(user) {
  return 'mock_user=' + JSON.stringify(user) + ';';
}

exports.emptyFunction = jest.fn();

exports.findRouterHandler = function(router, method, path) {
  const route = router.stack.find(r => r.path === path && r.methods.includes(method));
  if (!route || router.stack.length !== 1) {
    return null;
  }
  return route.stack[0].handle;
}

exports.createUser = async function() {
  const key = new Date().getTime() + '_' + randomInt();
  const passhash = await tools.bhash('pass');
  return await proxyUser.newAndSave('alsotang' + key, passhash, 'alsotang' + key + '@gmail.com', '', false);
};

exports.createUserByNameAndPwd = async function(name, pwd) {
  const passhash = await tools.bhash(pwd);
  return await proxyUser.newAndSave(name, passhash, name + new Date() + '@gmail.com', '', true);
};

exports.createTopic = async function(authorId) {
  const key = new Date().getTime() + '_' + randomInt();
  return await proxyTopic.newAndSave('topic title' + key, 'test topic content' + key, 'share', authorId);
};

exports.createReply = async function(topicId, authorId) {
  return await proxyReply.newAndSave('I am content', topicId, authorId);
};

exports.createSingleUp = async function(replyId, userId) {
  const reply = await proxyReply.getReply(replyId);
  reply.ups = [userId];
  await reply.save();
  return reply;
};

exports.initSupport = async function () {
  try {
    const [user, user2, admin] = await Promise.all([
      exports.createUser(),
      exports.createUser(),
      exports.createUser()
    ]);

    exports.normalUser = user;
    exports.normalUserCookie = mockUser(user);

    exports.normalUser2 = user2;
    exports.normalUser2Cookie = mockUser(user2);

    const adminObj = JSON.parse(JSON.stringify(admin));
    adminObj.is_admin = true;
    exports.adminUser = admin;
    exports.adminUserCookie = mockUser(adminObj);

    const topic = await exports.createTopic(user._id);
    exports.testTopic = topic;

    const reply = await exports.createReply(topic._id, user._id);
    exports.testReply = reply;

  } catch (err) {
    console.error('Init test data error: ', err);
    throw err;
  }
};
