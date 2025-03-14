var config_default = require('./default');

var config = {
  debug: true,
  port: 3000,
  proxyurl: 'socks://127.0.0.1:7890',

  admins: {
    '67bbd4927b051e20a87453e5': true,
  },

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
    region: 'us-east-1',
    bucket: 'bitbbsstore.bitsoul.xyz',
    prefix: '_S3_DEV/',
    endpoint: null,
    clienturl: 'https://bitbbsstore.bitsoul.xyz',
    accessKeyId: process.env.s3_access_key,
    secretAccessKey: process.env.s3_Secret_access_key,
  },
};

Object.assign(config_default, config);

module.exports = config_default;
