var cache  = require('../common/cache');
var moment = require('moment');

var SEPARATOR = '^_^@T_T';

var makePerDayLimiter = function (identityName, identityFn) {
  return function (name, limitCount, options) {
    /*
    options.showJson = true 表示调用来自API并返回结构化数据；否则表示调用来自前段并渲染错误页面
    */
    return function (req, res, next) {
      var identity = identityFn(req);
      var YYYYMMDD = moment().format('YYYYMMDD');
      var key      = YYYYMMDD + SEPARATOR + identityName + SEPARATOR + name + SEPARATOR + identity;

      cache.get(key, function (err, count) {
        if (err) {
          return next(err);
        }
        count = count || 0;
        if (count < limitCount) {
          count += 1;
          cache.set(key, count, 60 * 60 * 24);
          res.set('X-RateLimit-Limit', limitCount);
          res.set('X-RateLimit-Remaining', limitCount - count);
          next();
        } else {
          res.status(403);
          if (options.showJson) {
            res.send({success: false, error_msg: 'limit: current action limited in ' + limitCount + ' times every day'});
          } else {
            res.render('notify/notify', { error: 'limit: current action limited in ' + limitCount + ' times every day'});
          }
        }
      });
    };
  };
};

exports.peruserperday = makePerDayLimiter('peruserperday', function (req) {
  return (req.user || req.session.user)._id;
});

exports.peripperday = makePerDayLimiter('peripperday', function (req) {
  var realIP = req.get('x-real-ip');
  if (!realIP && !global.config.debug) {
    throw new Error('should provide `x-real-ip` header')
  }
  return realIP;
});
