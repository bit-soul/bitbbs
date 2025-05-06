const Router = require('@koa/router');
const multiline = require('multiline');

const router = new Router();

// about page
router.get('/about', async (ctx, next) => {
  await ctx.render('static/about', {
    pageTitle: 'About'
  });
});

router.get('/robots', async (ctx, next) => {
  ctx.type = 'text/plain';
  ctx.body = multiline(function () {;
/*
# See http://www.robotstxt.org/robotstxt.html for documentation on how to use the robots.txt file
#
# To ban all spiders from the entire site uncomment the next two lines:
# User-Agent: *
# Disallow: /
*/
  });
});

module.exports = router;