import modelUser from '../models/user.js';
import * as proxyUser from '../proxys/user.js';
import * as proxyMessage from '../proxys/message.js';

import config from '../config/index.js';

export async function adminRequired(ctx, next) {
  if (!ctx.session.user_id) {
    return await ctx.render('misc/notify', { error: 'Please Login' });
  }

  if (!ctx.session.is_admin) {
    return await ctx.render('misc/notify', { error: 'Need Admin' });
  }

  await next();
}


export async function userRequired(ctx, next) {
  if (!ctx.session || !ctx.session.user_id) {
    ctx.status = 403;
    ctx.body = 'forbidden!';
    return;
  }

  await next();
}


export async function blockUser(ctx, next) {
  if (ctx.path === '/signout') {
    await next();
    return;
  }

  if (ctx.session.user_id && ctx.session.is_block && ctx.method !== 'GET') {
    ctx.status = 403;
    ctx.body = 'You are blocked by Admin';
    return;
  }

  await next();
}


export async function gen_session(ctx, userid, maxage) {
  const auth_token = userid + '$$$$';
  const opts = {
    path: '/',
    maxAge: maxage ? maxage : 1000 * 60 * 60 * 24 * 30, // 30 days
    signed: true,
    httpOnly: true,
    sameSite: 'lax',
  };
  ctx.cookies.set(config.auth_cookie_name, auth_token, opts);
}


export async function authUser(ctx, next) {
  ctx.state.current_user = null;

  try {
    if (config.debug && ctx.cookies.get('mock_user')) {
      const mockUser = JSON.parse(ctx.cookies.get('mock_user'));
      const model_user = new modelUser(mockUser);
      await model_user.save();
      ctx.session.user_id = model_user._id.toString();
      ctx.session.is_block = model_user.is_block;
      if (mockUser.is_admin) {
        ctx.session.is_admin = true;
      }
      await next();
      return;
    }

    let user;
    if (ctx.session.user_id) {
      user = await proxyUser.getUserById(ctx.session.user_id);
    } else {
      const auth_token = ctx.cookies.get(config.auth_cookie_name, { signed: true });
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

    const model_user = new modelUser(user);
    await model_user.save();
    ctx.session.user_id = model_user._id.toString();
    ctx.session.is_block = model_user.is_block;
    user = ctx.state.current_user = model_user;

    // eslint-disable-next-line no-prototype-builtins
    if (config.admins.hasOwnProperty(user._id)) {
      user.is_admin = true;
    }

    const count = await proxyMessage.getMessagesCount(user._id);
    user.messages_count = count;

    await next();
  } catch (err) {
    ctx.throw(500, err);
  }
}
