exports.errorPage = async function (ctx, next) {

  ctx.render404 = function (error) {
    ctx.status = 404;
    return ctx.render('notify/notify', { error });
  };

  ctx.renderError = function (error, statusCode = 400) {
    ctx.status = statusCode;
    return ctx.render('notify/notify', { error });
  };

  await next();
};
