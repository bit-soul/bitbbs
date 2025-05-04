exports.index = async function (ctx, next) {
  const q = encodeURIComponent(ctx.query.q || '');
  ctx.redirect('https://www.google.com.hk/search?q=site:bitbbs.bitsoul.xyz+' + q);
};
