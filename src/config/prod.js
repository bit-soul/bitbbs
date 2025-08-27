const config = {
  port: 3000,
  debug: false,
  cache: true,
  diststatic: true,
  proxyurl: 'socks5://host.docker.internal:40000',

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

  host: 'https://bitbbs.bitsoul.xyz',
  site_static_host: 'https://bitbbsres.bitsoul.xyz',

  session_secret: process.env.session_secret,
  session_max_age: 1000 * 60 * 60 * 24 * 30, // 30 days for production
  session_cookie_key: 'koa:sess',
  auth_cookie_name: 'bitbbs',

  admins: {
  },

  mongodb_cfg: {
    host: 'host.docker.internal',
    db: 'mongodb://host.docker.internal:27017/bitbbs_prod',
  },

  koaredis_cfg: {
    host: 'host.docker.internal',
    port: 6379,
    db: 8,
    password: null,
  },

  ioredis_cfg: {
    host: 'host.docker.internal',
    port: 6379,
    db: 9,
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
    region: 'auto',
    bucket: process.env.bitbbs_store_bucket_name,
    prefix: 'upload/',
    endpoint: process.env.r2_endpoint,
    readpoint: 'https://bitbbsres.bitsoul.xyz',
    proxypoint: 'https://presignedurlproxy.bitsoul.xyz',
    accessKeyId: process.env.r2_access_key_id,
    secretAccessKey: process.env.r2_secret_access_key,
  },
};

export default config;
