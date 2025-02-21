var path = require('path');

var config = {
  debug: false,
  port: 3000,
  get mini_assets() { return !this.debug; }, // 是否启用静态文件的合并压缩，详见视图中的Loader

  bbsname: 'BitBBS',
  bbslogo: '/static/images/logo.jpg',
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
  host: 'localhost', // 社区的域名
  google_tracker_id: '', // 默认的Google tracker ID，自有站点请修改，申请地址：http://www.google.com/analytics/
  cnzz_tracker_id: '', // 默认的cnzz tracker ID，自有站点请修改
  oneapm_key: '', // oneapm 是个用来监控网站性能的服务

  session_secret: 'bitbbs_secret', // 务必修改
  auth_cookie_name: 'bitbbs',

  log_dir: path.join(__dirname, '../../logs'),
  admins: { user_id: true }, // admin 可删除话题，编辑标签。把 user_id 换成你的id
  allow_sign_up: true, // 是否允许直接注册（否则只能走 github 的方式）

  mongodb_cfg: {
    host: '127.0.0.1',
    db: 'mongodb://127.0.0.1/bitbbs_prod',
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

  rss: {
    title: 'Open BBS based on Bitcoin and Bitsoul',
    link: 'http://bbs.bitsoul.xyz',
    language: 'zh-cn',
    description: 'Open BBS based on Bitcoin and Bitsoul',
    max_rss_items: 50
  },

  // file upload config, if s3_client setted, then use s3 instead
  upload: {
    path: path.join(__dirname, '../static/upload/'),
    url: '/static/upload/'
  },

  // s3 and s3 compatible storate client
  s3_client: {
    accessKeyId: 'your access key',
    secretAccessKey: 'your secret key',
    region: 'your region name',
    bucket: 'your bucket name',
    endpoint: 'url string or empty string',
  },

  file_limit: '1MB', // file upload size limit
  list_topic_count: 20, // 话题列表显示的话题数量
  create_post_per_day: 30, // 每个用户一天可以发的主题数
  create_reply_per_day: 100, // 每个用户一天可以发的评论数
  create_user_per_ip: 10, // 每个 ip 每天可以注册账号的次数
  visit_per_day: 1000, // 每个 ip 每天能访问的次数
};

module.exports = config;
