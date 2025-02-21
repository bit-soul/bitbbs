var config_default = require('./default');

var config = {
  debug: true,
  port: 3000,

  mongodb_cfg: {
    host: '127.0.0.1',
    db: 'mongodb://127.0.0.1/bitbbs_local',
  },

  redis_cfg: {
    host: '127.0.0.1',
    port: 6379,
    db: 0,
    password: '',
  },

  mail_opts: {
    host: 'smtp.126.com',
    port: 25,
    auth: {
      user: 'club@126.com',
      pass: 'club'
    },
    ignoreTLS: true,
  },

  GITHUB_OAUTH: {
    clientID: 'your GITHUB_CLIENT_ID',
    clientSecret: 'your GITHUB_CLIENT_SECRET',
    callbackURL: 'http://bbs.bitsoul.xyz/auth/github/callback'
  },

  s3_client: {
    accessKeyId: 'your access key',
    secretAccessKey: 'your secret key',
    region: 'your region name',
    bucket: 'your bucket name',
    endpoint: 'url string or empty string',
  },
};

Object.assign(config_default, config);

module.exports = config_default;
