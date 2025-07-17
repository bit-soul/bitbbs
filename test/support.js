const User = require('../proxy/user');
const Topic = require('../proxy/topic');
const Reply = require('../proxy/reply');
const tools = require('../common/tools');

function randomInt() {
  return (Math.random() * 10000).toFixed(0);
}

function findRouterHandler(router, method, path) {
  const route = router.stack.find(r => r.path === path && r.methods.includes(method));
  if (!route || router.stack.length !== 1) {
    return null;
  }
  return route.stack[0].handle;
}

const createUser = exports.createUser = async function () {
  const key = new Date().getTime() + '_' + randomInt();
  const passhash = await tools.bhash('pass');
  return await User.newAndSaveUser('alsotang' + key, passhash, 'alsotang' + key + '@gmail.com', false);
};

exports.createUserByNameAndPwd = async function (loginname, pwd) {
  const passhash = await tools.bhash(pwd);
  return await User.newAndSaveUser(loginname, passhash, loginname + +new Date() + '@gmail.com', true);
};

const createTopic = exports.createTopic = async function (authorId) {
  const key = new Date().getTime() + '_' + randomInt();
  return await Topic.newAndSaveTopic('topic title' + key, 'test topic content' + key, 'share', authorId);
};

const createReply = exports.createReply = async function (topicId, authorId) {
  return await Reply.newAndSaveReply('I am content', topicId, authorId);
};

const createSingleUp = exports.createSingleUp = async function (replyId, userId) {
  const reply = await Reply.getReply(replyId);
  reply.ups = [userId];
  await reply.save();
  return reply;
};

function mockUser(user) {
  return 'mock_user=' + JSON.stringify(user) + ';';
}

exports.initTestData = async function () {
  try {
    const [user, user2, admin] = await Promise.all([
      createUser(),
      createUser(),
      createUser()
    ]);

    exports.normalUser = user;
    exports.normalUserCookie = mockUser(user);

    exports.normalUser2 = user2;
    exports.normalUser2Cookie = mockUser(user2);

    const adminObj = JSON.parse(JSON.stringify(admin));
    adminObj.is_admin = true;
    exports.adminUser = admin;
    exports.adminUserCookie = mockUser(adminObj);

    const topic = await createTopic(user._id);
    exports.testTopic = topic;

    const reply = await createReply(topic._id, user._id);
    exports.testReply = reply;

  } catch (err) {
    console.error('Init test data error: ', err);
    throw err;
  }
};

exports.initTestData();
