export async function github(ctx, next) {
  if (global.config.GITHUB_OAUTH.clientID === 'your GITHUB_CLIENT_ID') {
    ctx.body = 'call the admin to set github oauth.';
    return;
  }
  await next();
}

export function strategy(accessToken, refreshToken, profile, done) {
  profile.accessToken = accessToken;
  done(null, profile);
}
