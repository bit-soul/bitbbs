import Router from '@koa/router';

const router = new Router();

// about page
router.get('/about', async (ctx, next) => {
  return await ctx.render('misc/about', {
    pageTitle: 'About'
  });
});

router.get('/robots', async (ctx, next) => {
  ctx.type = 'text/plain';
  ctx.body =
`
# See http://www.robotstxt.org/robotstxt.html for documentation on how to use the robots.txt file
#
# To ban all spiders from the entire site uncomment the next two lines:
# User-Agent: *
# Disallow: /
*/
`
});

export default router;
