var convert      = require('data2xml')();
var Topic        = require('../proxy').Topic;
var cache        = require('../common/cache');
var renderHelper = require('../common/render_helper');
var eventproxy   = require('eventproxy');

exports.index = function (req, res, next) {
  if (!global.config.rss) {
    res.statusCode = 404;
    return res.send('Please set `rss` in config.js');
  }
  res.contentType('application/xml');

  var ep = new eventproxy();
  ep.fail(next);

  cache.get('rss', ep.done(function (rss) {
    if (!global.config.debug && rss) {
      res.send(rss);
    } else {
      var opt = {
        limit: global.config.rss.max_rss_items,
        sort: '-create_at',
      };
      Topic.getTopicsByQuery({tab: {$nin: ['dev']}}, opt, function (err, topics) {
        if (err) {
          return next(err);
        }
        var rss_obj = {
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

        var rssContent = convert('rss', rss_obj);
        rssContent = utf8ForXml(rssContent)
        cache.set('rss', rssContent, 60 * 5); // 五分钟
        res.send(rssContent);
      });
    }
  }));
};

function utf8ForXml(inputStr) {
  return inputStr.replace(/[^\x09\x0A\x0D\x20-\xFF\x85\xA0-\uD7FF\uE000-\uFDCF\uFDE0-\uFFFD]/gm, '');
}
