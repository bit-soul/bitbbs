const modelUser   = require('../models/user');
const proxySystem = require('../proxy/system');
const midAuth     = require('../middlewares/auth');
const tools       = require('../common/tools');
const fetch       = require('../common/fetch');

const Router    = require('@koa/router');
const uuid      = require('node-uuid');
const validator = require('validator');
const brcsoul   = require('brcsoul-sdk');

const router = new Router();

var notJump = [
  '/active_account', //active page
  '/reset_pass',     //reset password page, avoid to reset twice
  '/signup',         //regist page
  '/search_pass',    //serch pass page
];

router.post('/wallet_login', async (ctx, next) => {
  const time = parseInt(ctx.request.body.time);
  const sign = validator.trim(ctx.request.body.sign);
  const addr = validator.trim(ctx.request.body.addr).toLowerCase();

  const result = {};
  const date_now = new Date();

  if (!(time > 0) || date_now.getTime() < (time - 600000) || date_now.getTime() > (time + 600000)) {
    result.code = -1;
    result.mess = "please sync your local time!";
    ctx.body = result;
    return;
  }

  const login_date = new Date(time);
  const login_mess = "Sign To Login BitBBS " +
      + login_date.getUTCFullYear().toString().padStart(4,'0') + "/"
      +(login_date.getUTCMonth()+1).toString().padStart(2, '0') + "/"
      + login_date.getUTCDate().toString().padStart(2,'0') + " "
      + login_date.getUTCHours().toString().padStart(2,'0') + ":"
      + login_date.getUTCMinutes().toString().padStart(2,'0') + ":"
      + login_date.getUTCSeconds().toString().padStart(2,'0') + ""
      + " UTC"
      + "";

  if (!brcsoul.verifySign(addr, login_mess, sign)) {
    result.code = -1;
    result.mess = "sign error!";
    ctx.body = result;
    return;
  }

  try {
    const respon = await brcsoul.getPersonByAddr(addr);

    if (respon.code < 0) {
      result.code = -1;
      result.mess = respon.mess;
      ctx.body = result;
      return;
    }

    const attr = respon?.data?.attr || {};

    //icon: inscription number to inscription id
    if (attr.icon && /^[0-9]{1,16}$/.test(attr.icon)) {
      try {
        const result = await fetch.fetchData("https://ordinals.com/inscription/" + attr.icon);
        if (result.code === 0) {
          const match = result.data.match(/\/content\/([a-f0-9]{64}.\d+)/);
          if (match) {
            attr.icon = "https://ordinals.com/content/" + match[1];
          }
        }
      } catch (error) {
        //todo
      }
    } else if (attr.icon && /^[a-f0-9]{64}.\d+$/.test(attr.icon)) {
      attr.icon = "https://ordinals.com/content/" + attr.icon;
    }

    let user = await modelUser.findOne({ addr: addr });

    if (user) {
      user.name = attr.name ? attr.name : 'nobody_' + user.sequence.toString(36).padStart(2, '0');
      user.biog = attr.biog || '';
      user.icon = attr.icon ? brcsoul.httpExtraUrl(attr.icon) : '';
      await user.save();
    } else {
      const count = await proxySystem.incrementUserCnt();
      user = new modelUser({
        addr: addr,
        name: attr.name ? attr.name : 'nobody_' + count.toString(36).padStart(2, '0'),
        biog: attr.biog || '',
        icon: attr.icon ? brcsoul.httpExtraUrl(attr.icon) : '',
        active: true,
        sequence: count,
        accessToken: uuid.v4(),
      });
      await user.save();
    }

    midAuth.gen_session(ctx, user._id); // 假设你已支持为 Koa 注入 ctx 的 session 方法
    ctx.body = { code: 1, mess: "redirect" };

  } catch (error) {
    result.code = -2;
    result.mess = error.message;
    ctx.body = result;
  }
});


router.post('/get_authkey', async (ctx) => {
  const result = {};
  let maxage = parseInt(ctx.request.body.maxage);

  if (!maxage) {
    maxage = 1000 * 60 * 60 * 24 * 30; // 默认30天
  }

  const session = ctx.session;

  if (!session?.user?._id) {
    result.code = -1;
    result.mess = "not login!";
    ctx.body = result;
    return;
  }

  if (session?.is_authkey_login) {
    result.code = -1;
    result.mess = "login by authkey can not generate new authkey!";
    ctx.body = result;
    return;
  }

  const authkey = tools.generateauthkey(session.user._id, maxage);

  result.code = 0;
  result.data = authkey;
  ctx.body = result;
});


router.post('/authkey_login', async (ctx) => {
  const authkey = validator.trim(ctx.request.body.authkey).toUpperCase();
  const authitem = global.authkeys[authkey];
  const result = {};

  if (authitem) {
    const userid = authitem[0];
    const maxage = authitem[1];

    delete global.authkeys[authkey];

    ctx.session.is_authkey_login = true;
    midAuth.gen_session(ctx, userid, maxage);
    ctx.body = { code: 1, mess: "redirect" };
  } else {
    result.code = -1;
    result.mess = "authkey error or timeout or used!";
    ctx.body = result;
  }
});

module.exports = router;
