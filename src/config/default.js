var path = require('path');

var config = {
  debug: false,
  cache: true,
  diststatic: true,
  port: 3000,
  proxyurl: null,

  bbsname: 'BitBBS',
  bbslogo: '/static/logo.jpg',
  bbsogimg: '/static/ogimg.jpg',
  keywords: 'nodejs, node, express, connect, socket.io',
  description: 'BitBBS, The Open BBS based on Bitcoin and Bitsoul',

  // 右上角的导航区, 格式 [ path, title, [target=''] ]
  site_navs: [
    [ '/about', 'About' ]
  ],

  // 版块
  tabs: [
    ['share', 'Share'],
    ['ask', 'Ask'],
    ['job', 'Job'],
  ],

  site_static_host: '', // 静态文件存储域名
  host: 'http://localhost:3000', // 社区的域名
  google_tracker_id: '', // 默认的Google tracker ID，自有站点请修改，申请地址：http://www.google.com/analytics/
  cnzz_tracker_id: '', // 默认的cnzz tracker ID，自有站点请修改
  oneapm_key: '', // oneapm 是个用来监控网站性能的服务
  proxyurl: '', //http请求代理服务

  session_secret: 'bitbbs_secret', // 务必修改
  auth_cookie_name: 'bitbbs',

  log_dir: path.join(__dirname, '../../logs'),
  admins: { user_id: true }, // admin 可删除话题，编辑标签。把 user_id 换成你的id
  allow_sign_up: true, // 是否允许直接注册（否则只能走 github 的方式）

  mongodb_cfg: {
    host: '127.0.0.1',
    db: 'mongodb://127.0.0.1:27017/bitbbs_default',
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

  mail_opts: null, //{
  //  host: 'smtp.126.com',
  //  port: 25,
  //  auth: {
  //    user: 'club@126.com',
  //    pass: 'club'
  //  },
  //  ignoreTLS: true,
  //},

  GITHUB_OAUTH: null, //{
  //  clientID: 'your GITHUB_CLIENT_ID',
  //  clientSecret: 'your GITHUB_CLIENT_SECRET',
  //  callbackURL: 'http://bitbbs.bitsoul.xyz/auth/github/callback'
  //},

  rss: null, //{
  //  title: 'Open BBS based on Bitcoin and Bitsoul',
  //  link: 'http://bitbbs.bitsoul.xyz',
  //  language: 'zh-cn',
  //  description: 'Open BBS based on Bitcoin and Bitsoul',
  //  max_rss_items: 50
  //},

  // s3 and s3 compatible storate client
  s3_client: null, //{
  //  region: null, //your region name,
  //  bucket: null, //your bucket name,
  //  prefix: '',
  //  endpoint: null, //url string or empty string,
  //  readpoint: null,
  //  accessKeyId: null, //your access key,
  //  secretAccessKey: null, //your secret key,
  //},

  // file upload config, if s3_client setted, then use s3 instead
  upload: {
    path: path.join(__dirname, '../../upload/'),
    url: '/upload/'
  },

  file_limit: '1MB', // file upload size limit
  list_topic_count: 20, // 话题列表显示的话题数量
  create_post_per_day: 30, // 每个用户一天可以发的主题数
  create_reply_per_day: 100, // 每个用户一天可以发的评论数
  create_user_per_ip: 10, // 每个 ip 每天可以注册账号的次数
  visit_per_day: 1000, // 每个 ip 每天能访问的次数
};

module.exports = config;
