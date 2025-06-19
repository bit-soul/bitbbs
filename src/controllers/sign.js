const proxyUser = require('../proxys/user');
const midAuth   = require('../middlewares/auth');
const mail      = require('../common/mail');
const tools     = require('../common/tools');

const Router    = require('@koa/router');
const validator = require('validator');

const router = new Router();

/**
 * define some page when login just jump to the home page
 * @type {Array}
 */
var notJump = [
  '/active_account', //active page
  '/reset_pass',     //reset password page, avoid to reset twice
  '/signup',         //regist page
  '/search_pass'    //serch pass page
];

router.get('/signup', async (ctx) => {
  await ctx.render('sign/signup');
});

router.post('/signup', async (ctx, next) => {
  const name = validator.trim(ctx.request.body.name).toLowerCase();
  const email = validator.trim(ctx.request.body.email).toLowerCase();
  const pass = validator.trim(ctx.request.body.pass);
  const rePass = validator.trim(ctx.request.body.re_pass);

  // 错误渲染方法
  const renderError = async (msg) => {
    ctx.status = 422;
    await ctx.render('sign/signup', { error: msg, name, email });
  };

  // 表单验证
  if ([name, pass, rePass, email].some(item => item === '')) {
    return await renderError('信息不完整。');
  }
  if (name.length === 0) {
    return await renderError('用户名不能为空。');
  }
  if (!tools.validateId(name)) {
    return await renderError('用户名不合法。');
  }
  if (!validator.isEmail(email)) {
    return await renderError('邮箱不合法。');
  }
  if (pass !== rePass) {
    return await renderError('两次密码输入不一致。');
  }

  const users = await proxyUser.getUsersByQuery({ email });
  if (users.length > 0) {
    return await renderError('邮箱已被使用。');
  }

  const passhash = await tools.bhash(pass);
  // 创建用户
  const user = await proxyUser.newAndSave(name, passhash, email, null, false);

  // 发激活邮件
  const token = tools.md5(email + passhash + global.config.session_secret);
  await mail.sendActiveMail(email, name, token, user._id);

  await ctx.render('sign/signup', {
    success: `欢迎加入 ${global.config.bbsname}！我们已给您的注册邮箱发送了一封邮件，请点击里面的链接来激活您的帐号。`
  });
});

router.get('/signin', async (ctx) => {
  ctx.session._loginReferer = ctx.headers.referer;
  await ctx.render('sign/signin');
});

router.post('/signin', async (ctx, next) => {
  const email = validator.trim(ctx.request.body.email).toLowerCase();
  const pass = validator.trim(ctx.request.body.pass);

  if (!email || !pass) {
    ctx.status = 422;
    return ctx.render('sign/signin', { error: '信息不完整。' });
  }

  const user = await proxyUser.getUserByMail(email);
  if (!user) {
    ctx.status = 403;
    return ctx.render('sign/signin', { error: '用户名或密码错误' });
  }

  const isMatch = await tools.bcompare(pass, user.pass);
  if (!isMatch) {
    ctx.status = 403;
    return ctx.render('sign/signin', { error: '用户名或密码错误' });
  }

  if (!user.active) {
    const token = tools.md5(user.email + user.pass + global.config.session_secret);
    await mail.sendActiveMail(user.email, user.name, token, user._id);
    ctx.status = 403;
    return ctx.render('sign/signin', {
      error: `此帐号还没有被激活，激活链接已发送到 ${user.email} 邮箱，请查收。`
    });
  }

  midAuth.gen_session(ctx.res, user._id);

  let refer = ctx.session._loginReferer || '/';
  if (notJump.some(nj => refer.indexOf(nj) >= 0)) {
    refer = '/';
  }

  ctx.redirect(refer);
});

router.get('/signout', async (ctx) => {
  ctx.session = null;
  ctx.cookies.set(global.config.auth_cookie_name, '', { path: '/' });
  ctx.redirect('/');
});

router.get('/active_account', async (ctx, next) => {
  const key = validator.trim(ctx.query.key);
  const uid = validator.trim(ctx.query.uid);

  const user = await proxyUser.getUserById(uid);
  if (!user) throw new Error('[ACTIVE_ACCOUNT] no such user: ' + uid);

  const validKey = tools.md5(user.email + user.pass + global.config.session_secret);
  if (key !== validKey) {
    return ctx.render('notify/notify', { error: '信息有误，帐号无法被激活。' });
  }
  if (user.active) {
    return ctx.render('notify/notify', { error: '帐号已经是激活状态。' });
  }

  user.active = true;
  await user.save();
  return ctx.render('notify/notify', { success: '帐号已被激活，请登录' });
});

router.get('/search_pass', async (ctx) => {
  await ctx.render('sign/search_pass');
});

router.post('/search_pass', async (ctx, next) => {
  const email = validator.trim(ctx.request.body.email).toLowerCase();
  if (!validator.isEmail(email)) {
    return ctx.render('sign/search_pass', { error: '邮箱不合法', email });
  }

  const retrieveKey = tools.uuid();
  const retrieveTime = Date.now();

  const user = await proxyUser.getUserByMail(email);
  if (!user) {
    return ctx.render('sign/search_pass', { error: '没有这个电子邮箱。', email });
  }

  user.retrieve_key = retrieveKey;
  user.retrieve_time = retrieveTime;
  await user.save();

  await mail.sendResetPassMail(email, retrieveKey, user._id);

  return ctx.render('notify/notify', {
    success: '我们已给您填写的电子邮箱发送了一封邮件，请在24小时内点击里面的链接来重置密码。'
  });
});

router.get('/reset_pass', async (ctx, next) => {
  const key = validator.trim(ctx.query.key || '');
  const uid = validator.trim(ctx.query.uid || '');

  const user = await proxyUser.getUserById(uid);

  if (!user || user.retrieve_key !== key) {
    ctx.status = 403;
    return ctx.render('notify/notify', { error: '信息有误，密码无法重置。' });
  }

  const now = Date.now();
  const oneDay = 1000 * 60 * 60 * 24;
  if (!user.retrieve_time || now - user.retrieve_time > oneDay) {
    ctx.status = 403;
    return ctx.render('notify/notify', { error: '该链接已过期，请重新申请。' });
  }

  return ctx.render('sign/reset', { uid, key });
});

router.post('/reset_pass', async (ctx, next) => {
  const psw = validator.trim(ctx.request.body.psw || '');
  const repsw = validator.trim(ctx.request.body.repsw || '');
  const key = validator.trim(ctx.request.body.key || '');
  const uid = validator.trim(ctx.request.body.uid || '');

  if (psw !== repsw) {
    return ctx.render('sign/reset', { uid, key, error: '两次密码输入不一致。' });
  }

  const user = await proxyUser.getUserById(uid);
  if (user.retrieve_key !== key) {
    return ctx.render('notify/notify', { error: '错误的激活链接' });
  }

  const passhash = await tools.bhash(psw);
  user.pass = passhash;
  user.retrieve_key = null;
  user.retrieve_time = null;
  user.active = true;

  await user.save();
  return ctx.render('notify/notify', { success: '你的密码已重置。' });
});

module.exports = router;