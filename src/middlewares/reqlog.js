const logger = require('../common/logger');

const ignore = /^\/(static|agent)/;

module.exports = async function (ctx, next) {
  // Assets do not out log.
  if (ignore.test(ctx.url)) {
    await next();
    return;
  }

  const t = new Date();
  logger.info('\n\nStarted', t.toISOString(), ctx.method, ctx.url, ctx.ip);

  await next();

  const duration = new Date() - t;
  logger.info('Completed', ctx.status, `(${duration}ms)`);
};
