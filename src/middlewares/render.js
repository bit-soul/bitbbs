const logger = require('../common/logger');

exports.render = async function (ctx, next) {
  const originalRender = ctx.render;

  ctx.render = async function (view, options = {}) {
    const t = new Date();

    await originalRender.call(ctx, view, options);

    const duration = new Date() - t;
    logger.info('Render view', view, `(${duration}ms)`);
  };

  await next();
};
