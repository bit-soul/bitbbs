exports.github = async function (ctx, next) {
  if (global.config.GITHUB_OAUTH.clientID === 'your GITHUB_CLIENT_ID') {
    ctx.body = 'call the admin to set github oauth.';
    return;
  }
  await next();
};

exports.strategy = function (accessToken, refreshToken, profile, done) {
  profile.accessToken = accessToken;
  done(null, profile);
};

