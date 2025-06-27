const moment = require('moment');
const cache = require('../common/cache');

const SEPARATOR = '^_^@T_T';

const makePerDayLimiter = (identityName, identityFn) => {
  return (name, limitCount, options = {}) => {
    /*
    options.showJson = true 表示调用来自API并返回结构化数据；否则表示调用来自前端并渲染错误页面
    */
    return async (ctx, next) => {
      const identity = identityFn(ctx);
      const YYYYMMDD = moment().format('YYYYMMDD');
      const key = `${YYYYMMDD}${SEPARATOR}${identityName}${SEPARATOR}${name}${SEPARATOR}${identity}`;

      try {
        let count = await cache.get(key);
        count = count || 0;

        if (count < limitCount) {
          count += 1;
          await cache.set(key, count, 60 * 60 * 24); // 设置缓存 24 小时

          ctx.set('X-RateLimit-Limit', limitCount.toString());
          ctx.set('X-RateLimit-Remaining', (limitCount - count).toString());

          await next();
        } else {
          ctx.status = 403;

          const message = `limit: current action limited in ${limitCount} times every day`;
          if (options.showJson) {
            return ctx.body = { success: false, error_msg: message };
          } else {
            return await ctx.render('misc/notify', { error: message });
          }
        }
      } catch (err) {
        ctx.throw(500, err);
      }
    };
  };
};

exports.peruserperday = makePerDayLimiter('peruserperday', (ctx) => {
  return (ctx.state.user || ctx.session.user)._id;
});

exports.peripperday = makePerDayLimiter('peripperday', (ctx) => {
  const realIP = ctx.get('x-real-ip');
  if (!realIP && !global.config.debug) {
    throw new Error('should provide `x-real-ip` header');
  }
  return realIP;
});
