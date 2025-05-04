var User         = require('../proxy').User;
var Topic        = require('../proxy').Topic;
var cache        = require('../common/cache');
var xmlbuilder   = require('xmlbuilder');
var renderHelper = require('../common/render_helper');
var _            = require('lodash');
var moment = require('moment');

exports.index = async function (ctx, next) {
  try {
    let page = parseInt(ctx.query.page, 10) || 1;
    page = page > 0 ? page : 1;
    const tab = ctx.query.tab || 'all';

    let query = {};
    if (!tab || tab === 'all') {
      query.tab = { $nin: ['job', 'dev'] };
    } else if (tab === 'good') {
      query.good = true;
    } else {
      query.tab = tab;
    }

    if (!query.good) {
      query.create_at = { $gte: moment().subtract(1, 'years').toDate() };
    }

    const limit = global.config.list_topic_count;
    const options = { skip: (page - 1) * limit, limit: limit, sort: '-top -last_reply_at' };

    const [
      topics,
      tops,
      no_reply_topics,
      pages
    ] = await Promise.all([
      Topic.getTopicsByQuery(query, options),

      // 取排行榜上的用户
      (async () => {
        let tops = await cache.get('tops');
        if (tops) return tops;
        tops = await User.getUsersByQuery({ is_block: false }, { limit: 10, sort: '-score' });
        await cache.set('tops', tops, 60);
        return tops;
      })(),

      // 取0回复的主题
      (async () => {
        let noReply = await cache.get('no_reply_topics');
        if (noReply) return noReply;
        noReply = await Topic.getTopicsByQuery({ reply_count: 0, tab: { $nin: ['job', 'dev'] } }, { limit: 5, sort: '-create_at' });
        await cache.set('no_reply_topics', noReply, 60);
        return noReply;
      })(),

      // 取分页数据
      (async () => {
        const key = JSON.stringify(query) + 'pages';
        let pages = await cache.get(key);
        if (pages) return pages;
        const count = await Topic.getCountByQuery(query);
        pages = Math.ceil(count / limit);
        await cache.set(key, pages, 60);
        return pages;
      })()
    ]);

    const tabName = renderHelper.tabName(tab);
    await ctx.render('index', {
      topics,
      current_page: page,
      list_topic_count: limit,
      tops,
      no_reply_topics,
      pages,
      tabs: global.config.tabs,
      tab,
      pageTitle: tabName && (tabName + 'category')
    });
  } catch (err) {
    return next(err);
  }
};

exports.sitemap = async function (ctx, next) {
  try {
    let sitemapData = await cache.get('sitemap');

    if (!sitemapData) {
      const urlset = xmlbuilder.create('urlset', {
        version: '1.0',
        encoding: 'UTF-8'
      });
      urlset.att('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9');

      const topics = await Topic.getLimit5w();

      topics.forEach(topic => {
        urlset.ele('url').ele('loc', `http://bitbbs.bitsoul.xyz/topic/${topic._id}`);
      });

      sitemapData = urlset.end();
      await cache.set('sitemap', sitemapData, 3600 * 24); // 缓存一天
    }

    ctx.type = 'xml';
    ctx.body = sitemapData;

  } catch (err) {
    return next(err);
  }
};
