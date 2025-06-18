const renders = require('../common/renders');
const logger  = require('../common/logger');
const lodash  = require('lodash');

exports.times = async function (ctx, next) {
  const originalRender = ctx.render;

  ctx.render = async function (view, options = {}) {
    const t = new Date();

    await originalRender.call(ctx, view, options);

    const duration = new Date() - t;
    logger.info('Render view', view, `(${duration}ms)`);
  };

  await next();
};

exports.extend = async function (ctx, next) {
  ctx.state.config = global.config;
  ctx.state.helper = renders;
  ctx.state.lodash = lodash;
  await next();
};
