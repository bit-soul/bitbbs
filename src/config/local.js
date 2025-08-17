import config_default from './default.js';

var config = {
  debug: true,
  cache: false,
  diststatic: false,
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

  session_secret: process.env.session_secret,
  session_max_age: 1000 * 60 * 60 * 1, // 1 hour for local development
  session_cookie_key: 'koa:sess',
  auth_cookie_name: 'bitbbs',

  admins: {
    '67bbd4927b051e20a87453e5': true,
  },

  mongodb_cfg: {
    host: '127.0.0.1',
    db: 'mongodb://127.0.0.1:27017/bitbbs_local?directConnection=true&family=4',
  },

  koaredis_cfg: {
    host: '127.0.0.1',
    port: 6379,
    db: 0,
    password: null,
  },

  ioredis_cfg: {
    host: '127.0.0.1',
    port: 6379,
    db: 1,
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

  //s3_client: {
  //  region: 'us-east-1',
  //  bucket: process.env.bitbbs_store_bucket_name,
  //  prefix: '_S3_DEV/',
  //  endpoint: null,
  //  readpoint: 'https://bitbbsstore.bitsoul.xyz',
  //  accessKeyId: process.env.s3_access_key,
  //  secretAccessKey: process.env.s3_Secret_access_key,
  //},
  s3_client: {
    region: 'auto',
    bucket: process.env.bitbbs_store_bucket_name,
    prefix: 'upload/',
    endpoint: process.env.r2_endpoint,
    readpoint: 'https://bitbbsdevres.bitsoul.xyz',
    proxypoint: 'https://presignedurlproxy.bitsoul.xyz',
    accessKeyId: process.env.r2_access_key_id,
    secretAccessKey: process.env.r2_secret_access_key,
  },
};

Object.assign(config_default, config);

export default config_default;
