const Router = require('@koa/router');
const router = new Router();

router.get('/search', async (ctx, next) => {
  const q = encodeURIComponent(ctx.query.q || '');
  ctx.redirect('https://www.google.com.hk/search?q=site:bitbbs.bitsoul.xyz+' + q);
});

router.get('/test', async (ctx, next) => {
  ctx.state.user ="abc";
  return await ctx.render('test', options={
    layout: false,
  });
});

module.exports = router;