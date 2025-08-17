import lodash from 'lodash';
import config from '../config/index.js';
import logger from '../common/logger.js';
import * as helper from '../common/helper.js';


export async function times(ctx, next) {
  const originalRender = ctx.render;

  ctx.render = async function (view, options = {}) {
    const t = new Date();

    await originalRender.call(ctx, view, options);

    const duration = new Date() - t;
    logger.info('Render view', view, `(${duration}ms)`);
  };

  await next();
}

export async function extend(ctx, next) {
  ctx.state.config = config;
  ctx.state.helper = helper;
  ctx.state.lodash = lodash;
  await next();
}
