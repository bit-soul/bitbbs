import * as proxyTopic from '../proxys/topic.js';
import * as cache from '../common/cache.js';
import * as helper from '../common/helper.js';
import * as tools from '../common/tools.js';

import config from '../config/index.js';

import Router from '@koa/router';
import data2xml from 'data2xml';

const toxml = data2xml({ xmlDecl: { version: '1.0', encoding: 'UTF-8' } });

const router = new Router();

router.get('/rss', async (ctx, next) => {
  if (!config.rss) {
    ctx.status = 404;
    ctx.body = 'Please set `rss` in config.js';
    return;
  }

  ctx.set('Content-Type', 'application/xml');

  let rss = await cache.get('rss');

  if (!config.debug && rss) {
    ctx.body = rss;
    return;
  }

  const opt = {
    limit: config.rss.max_rss_items,
    sort: '-create_at',
  };

  const topics = await proxyTopic.getTopicsByQuery({ tab: { $nin: ['dev'] } }, opt);

  const rss_obj = {
    _attr: { version: '2.0' },
    channel: {
      title: config.rss.title,
      link: config.rss.link,
      language: config.rss.language,
      description: config.rss.description,
      item: []
    }
  };

  topics.forEach(function (topic) {
    rss_obj.channel.item.push({
      title: topic.title,
      link: config.rss.link + '/topic/' + topic._id,
      guid: config.rss.link + '/topic/' + topic._id,
      description: helper.markdown(topic.content),
      author: topic.author.name,
      pubDate: topic.create_at.toUTCString()
    });
  });

  let rssContent = toxml('rss', rss_obj);
  rssContent = tools.utf8ForXml(rssContent);
  await cache.set('rss', rssContent, 60 * 5); // 5分钟缓存

  ctx.body = rssContent;
});

export default router;
