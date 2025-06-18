const modelUser    = require('../models/user');
const proxyUser    = require('../proxys/user');
const proxyMessage = require('../proxys/message');


exports.adminRequired = async (ctx, next) => {
  if (!ctx.session.user) {
    await ctx.render('notify/notify', { error: 'Please Login' });
    return;
  }

  if (!ctx.session.user.is_admin) {
    await ctx.render('notify/notify', { error: 'Need Admin' });
    return;
  }

  await next();
};


exports.userRequired = async (ctx, next) => {
  if (!ctx.session || !ctx.session.user || !ctx.session.user._id) {
    ctx.status = 403;
    ctx.body = 'forbidden!';
    return;
  }

  await next();
};


exports.blockUser = () => {
  return async (ctx, next) => {
    if (ctx.path === '/signout') {
      await next();
      return;
    }

    if (ctx.session.user && ctx.session.user.is_block && ctx.method !== 'GET') {
      ctx.status = 403;
      ctx.body = 'You are blocked by Admin';
      return;
    }

    await next();
  };
};


exports.gen_session = async (ctx, userid, maxage) => {
  const auth_token = userid + '$$$$';
  const opts = {
    path: '/',
    maxAge: maxage ? maxage : 1000 * 60 * 60 * 24 * 30, // 30 days
    signed: true,
    httpOnly: true,
  };
  ctx.cookies.set(global.config.auth_cookie_name, auth_token, opts);
}


exports.authUser = async (ctx, next) => {
  ctx.state.current_user = null;

  try {
    if (global.config.debug && ctx.cookies.get('mock_user')) {
      const mockUser = JSON.parse(ctx.cookies.get('mock_user'));
      ctx.session.user = new modelUser(mockUser);
      if (mockUser.is_admin) {
        ctx.session.user.is_admin = true;
      }
      await next();
      return;
    }

    let user;
    if (ctx.session.user) {
      user = ctx.session.user;
    } else {
      const auth_token = ctx.cookies.get(global.config.auth_cookie_name, { signed: true });
      if (auth_token) {
        const auth = auth_token.split('$$$$');
        const user_id = auth[0];
        user = await proxyUser.getUserById(user_id);
      }
    }

    if (!user) {
      await next();
      return;
    }

    user = ctx.state.current_user = ctx.session.user = new modelUser(user);

    if (global.config.admins.hasOwnProperty(user._id)) {
      user.is_admin = true;
    }

    const count = await proxyMessage.getMessagesCount(user._id);
    user.messages_count = count;

    await next();
  } catch (err) {
    ctx.throw(500, err);
  }
};