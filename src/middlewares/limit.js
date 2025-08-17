import moment from 'moment';
import config from '../config/index.js';
import * as cache from '../common/cache.js';

const SEPARATOR = '^_^@T_T';

function makePerDayLimiter(identityName, identityFn) {
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
}

export const peruserperday = makePerDayLimiter('peruserperday', (ctx) => {
  return ctx.session.user_id || ctx.state.passport_user?._id;
})

export const peripperday = makePerDayLimiter('peripperday', (ctx) => {
  const realIP = ctx.get('x-real-ip');
  if (!realIP && !config.debug) {
    throw new Error('should provide `x-real-ip` header');
  }
  return realIP;
})
