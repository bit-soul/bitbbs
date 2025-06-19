const proxyTopic  = require('../proxys/topic');
const cache       = require('../common/cache');
const renders     = require('../common/renders');
const tools       = require('../common/tools');

const Router   = require('@koa/router');
const data2xml = require('data2xml')({ xmlDecl: { version: '1.0', encoding: 'UTF-8' } });

const router = new Router();

router.get('/rss', async (ctx, next) => {
  if (!global.config.rss) {
    ctx.status = 404;
    ctx.body = 'Please set `rss` in config.js';
    return;
  }

  ctx.set('Content-Type', 'application/xml');

  let rss = await cache.get('rss');

  if (!global.config.debug && rss) {
    ctx.body = rss;
    return;
  }

  const opt = {
    limit: global.config.rss.max_rss_items,
    sort: '-create_at',
  };

  const topics = await proxyTopic.getTopicsByQuery({ tab: { $nin: ['dev'] } }, opt);

  const rss_obj = {
    _attr: { version: '2.0' },
    channel: {
      title: global.config.rss.title,
      link: global.config.rss.link,
      language: global.config.rss.language,
      description: global.config.rss.description,
      item: []
    }
  };

  topics.forEach(function (topic) {
    rss_obj.channel.item.push({
      title: topic.title,
      link: global.config.rss.link + '/topic/' + topic._id,
      guid: global.config.rss.link + '/topic/' + topic._id,
      description: renders.markdown(topic.content),
      author: topic.author.name,
      pubDate: topic.create_at.toUTCString()
    });
  });

  let rssContent = data2xml('rss', rss_obj);
  rssContent = tools.utf8ForXml(rssContent);
  await cache.set('rss', rssContent, 60 * 5); // 5分钟缓存

  ctx.body = rssContent;
});

module.exports = router;