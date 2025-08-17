import { URL } from 'url';
import fetch from 'node-fetch';
import logger from '../common/logger.js';


const ALLOW_HOSTNAME = [
  'avatars.githubusercontent.com', 'www.gravatar.com',
  'gravatar.com', 'www.google-analytics.com',
];

export async function proxy(ctx, next) {
  const url = decodeURIComponent(ctx.query.url || '');
  const hostname = new URL(url).hostname;

  if (!ALLOW_HOSTNAME.includes(hostname)) {
    ctx.status = 400;
    ctx.body = hostname + ' is not allowed';
    return;
  }

  try {
    const response = await fetch(url, {
      headers: {
        ...ctx.headers,
        cookie: '', // remove cookie
        referer: '', // remove referer
      },
    });

    ctx.set(response.headers);

    ctx.status = response.status;
    ctx.body = response.body;
  } catch (err) {
    logger.error(err);
    ctx.status = 502;
    ctx.body = 'Proxy Error';
  }
}
