var config_default = require('./default');

var config = {
  debug: true,
  port: 3000,
  proxyurl: 'socks://127.0.0.1:7890',

  tabs: [
    ['btc', 'BTC'],
    ['eth', 'ETH'],
    ['sol', 'SOL'],
    ['bsc', 'BSC'],
    ['ai', 'AI'],
    ['meme', 'Meme'],
    ['defi', 'Defi'],
    ['game', 'Game'],
    ['social', 'Social'],
    ['others', 'Others'],
  ],

  admins: {
    '67bbd4927b051e20a87453e5': true,
  },

  mongodb_cfg: {
    host: '127.0.0.1',
    db: 'mongodb://127.0.0.1:27017/bitbbs_local',
  },

  redis_cfg: {
    host: '127.0.0.1',
    port: 6379,
    db: 0,
    password: null,
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
    callbackURL: 'http://bitbbs.bitsoul.xyz/auth/github/callback'
  },

  rss: {
    title: 'Open BBS based on Bitcoin and Bitsoul',
    link: 'http://bitbbs.bitsoul.xyz',
    language: 'zh-cn',
    description: 'Open BBS based on Bitcoin and Bitsoul',
    max_rss_items: 50
  },

  s3_client: {
    region: 'us-east-1',
    bucket: process.env.bitbbs_store_bucket_name,
    prefix: '_S3_DEV/',
    endpoint: null,
    readpoint: 'https://bitbbsstore.bitsoul.xyz',
    accessKeyId: process.env.s3_access_key,
    secretAccessKey: process.env.s3_Secret_access_key,
  },
};

Object.assign(config_default, config);

module.exports = config_default;
