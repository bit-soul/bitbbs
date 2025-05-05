const Router = require('koa-router');
var convert      = require('data2xml')();
var Topic        = require('../proxy/topic');
var cache        = require('../common/cache');
var renderHelper = require('../common/render_helper');
const router = new Router();

router.get('/rss', async (ctx, next) => {
  try {
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

    const topics = await Topic.getTopicsByQuery({ tab: { $nin: ['dev'] } }, opt);

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
        description: renderHelper.markdown(topic.content),
        author: topic.author.name,
        pubDate: topic.create_at.toUTCString()
      });
    });

    let rssContent = convert('rss', rss_obj);
    rssContent = utf8ForXml(rssContent);
    await cache.set('rss', rssContent, 60 * 5); // 5分钟缓存

    ctx.body = rssContent;
  } catch (err) {
    return next(err);
  }
});


function utf8ForXml(inputStr) {
  return inputStr.replace(/[^\x09\x0A\x0D\x20-\xFF\x85\xA0-\uD7FF\uE000-\uFDCF\uFDE0-\uFFFD]/gm, '');
}

module.exports = router;