const Router = require('koa-router');
const router = new Router();

router.get('/search', async (ctx, next) => {
  const q = encodeURIComponent(ctx.query.q || '');
  ctx.redirect('https://www.google.com.hk/search?q=site:bitbbs.bitsoul.xyz+' + q);
});

module.exports = router;