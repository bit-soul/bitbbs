import * as proxyUser  from '../src/proxys/user.js';
import * as proxyTopic from '../src/proxys/topic.js';
import * as proxyReply from '../src/proxys/reply.js';

import * as tools from '../src/common/tools.js';

function randomInt() {
  return (Math.random() * 10000).toFixed(0);
}

function mockUser(user) {
  return 'mock_user=' + JSON.stringify(user) + ';';
}

export const emptyFunction = () => {};

export function findRouterHandler(router, method, path) {
  const route = router.stack.find(r => r.path === path && r.methods.includes(method));
  if (!route || router.stack.length !== 1) {
    return null;
  }
  return route.stack[0].handle;
}

export async function createUser() {
  const key = new Date().getTime() + '_' + randomInt();
  const passhash = await tools.bhash('pass');
  return await proxyUser.newAndSave('alsotang' + key, passhash, 'alsotang' + key + '@gmail.com', '', false);
}

export async function createUserByNameAndPwd(name, pwd) {
  const passhash = await tools.bhash(pwd);
  return await proxyUser.newAndSave(name, passhash, name + new Date() + '@gmail.com', '', true);
}

export async function createTopic(authorId) {
  const key = new Date().getTime() + '_' + randomInt();
  return await proxyTopic.newAndSave('topic title' + key, 'test topic content' + key, 'share', authorId);
}

export async function createReply(topicId, authorId) {
  return await proxyReply.newAndSave('I am content', topicId, authorId);
}

export async function createSingleUp(replyId, userId) {
  const reply = await proxyReply.getReply(replyId);
  reply.ups = [userId];
  await reply.save();
  return reply;
}

let initSupportDone = false;
export let normalUser;
export let normalUserCookie;
export let normalUser2;
export let normalUser2Cookie;
export let adminUser;
export let adminUserCookie;
export let testTopic;
export let testReply;

export async function initSupport() {
  if (initSupportDone) {
    return;
  }

  initSupportDone = true;
  try {
    const [user, user2, admin] = await Promise.all([
      createUser(),
      createUser(),
      createUser()
    ]);

    normalUser = user;
    normalUserCookie = mockUser(user);

    normalUser2 = user2;
    normalUser2Cookie = mockUser(user2);

    const adminObj = JSON.parse(JSON.stringify(admin));
    adminObj.is_admin = true;
    adminUser = admin;
    adminUserCookie = mockUser(adminObj);

    const topic = await createTopic(user._id);
    testTopic = topic;

    const reply = await createReply(topic._id, user._id);
    testReply = reply;
  } catch (err) {
    console.error('Init test data error: ', err);
    throw err;
  }
}
