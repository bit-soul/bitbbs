const tools     = require('../common/tools');
const modelUser = require('../models/user');
const midAuth   = require('../middlewares/auth');
const midGithub = require('../middlewares/github');

const Router   = require('@koa/router');
const passport = require('koa-passport');

const router = new Router();

router.get(
  '/auth/github',
  midGithub.github, // 自定义中间件，形式为 async (ctx, next) => {...}
  passport.authenticate('github') // koa-passport 提供的 authenticate 中间件
);

/**
 * GitHub OAuth 回调
 */
router.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/signin' }), async (ctx, next) => {
  const profile = ctx.state.passport_user; // passport 插入的 user 对象
  const email = profile.emails && profile.emails[0]?.value;

  if (!email) {
    ctx.status = 500;
    return await ctx.render('sign/no_github_email');
  }

  let user = await modelUser.findOne({ githubId: profile.id });

  if (user) {
    // 已注册，更新信息
    user.githubUsername = profile.username;
    user.githubId = profile.id;
    user.githubAccessToken = profile.accessToken;
    user.icon = profile._json.avatar_url;
    user.email = email || user.email;

    await user.save();

    midAuth.gen_session(ctx.res, user._id);
    ctx.redirect('/');
  } else {
    // 未注册，跳转补充信息页
    ctx.session.profile = profile;
    ctx.redirect('/auth/github/new');
  }
});

/**
 * 显示新建 OAuth 用户信息填写页
 */
router.get('/auth/github/new', async (ctx, next) => {
  return await ctx.render('sign/new_oauth', {
    actionPath: '/auth/github/create'
  });
});

/**
 * 创建 GitHub OAuth 用户
 */
router.post('/auth/github/create', async (ctx, next) => {
  const profile = ctx.session.profile;

  if (!profile) {
    return ctx.redirect('/signin');
  }

  delete ctx.session.profile;

  const email = profile.emails && profile.emails[0]?.value;
  if (!email) {
    ctx.status = 500;
    return await ctx.render('sign/no_github_email');
  }

  const user = new modelUser({
    name: profile.username,
    pass: profile.accessToken, // 此处你可替换为随机密码
    email,
    icon: profile._json.avatar_url,
    githubId: profile.id,
    githubUsername: profile.username,
    githubAccessToken: profile.accessToken,
    active: true,
    accessToken: tools.uuid(),
  });

  await user.save();
  midAuth.gen_session(ctx.res, user._id);
  ctx.redirect('/');
});

module.exports = router;