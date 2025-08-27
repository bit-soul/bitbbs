import fs from 'fs';
import url from 'url';
import path from 'path';

import config_dev from './dev.js';
import config_local from './local.js';
import config_pre from './pre.js';
import config_prod from './prod.js';
import config_unittest from './unittest.js';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const __projdir = path.join(__dirname, "../../");

let config_default = {
  port: 3000,
  debug: false,
  cache: true,
  diststatic: true,
  proxyurl: null,

  bbsname: 'BitBBS',
  bbslogo: '/static/logo.jpg',
  bbsogimg: '/static/ogimg.jpg',
  keywords: 'nodejs, node, express, connect, socket.io',
  description: 'BitBBS, The Open BBS based on Bitcoin and Bitsoul',

  // 右上角的导航区, 格式 [ path, title, [target=''] ]
  site_navs: [
    [ '/about', 'About' , '_self']
  ],

  // 版块
  tabs: [
    ['share', 'Share'],
    ['ask', 'Ask'],
    ['job', 'Job'],
  ],

  host: 'http://localhost:3000', // 社区的域名
  site_static_host: '', // 静态文件存储域名
  oneapm_key: '', // oneapm 是个用来监控网站性能的服务
  google_tracker_id: '', // 默认的Google tracker ID，自有站点请修改，申请地址：http://www.google.com/analytics/

  session_secret: 'bitbbs_secret', // !!!务必修改
  session_max_age: 1000 * 60 * 60 * 24 * 30,
  session_cookie_key: 'koa:sess',
  auth_cookie_name: 'bitbbs',

  log_dir: path.join(__projdir, 'logs'),
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
    dir: path.join(__projdir, 'upload'),
    url: '/upload/'
  },

  file_limit: '1MB', // file upload size limit
  list_topic_count: 20, // 话题列表显示的话题数量
  create_post_per_day: 20, // 每个用户一天可以发的主题数
  create_reply_per_day: 200, // 每个用户一天可以发的评论数
  create_user_per_ip: 10, // 每个 ip 每天可以注册账号的次数
  visit_per_day: 1000, // 每个 ip 每天能访问的次数
};

config_default.__projdir = __projdir;

switch (process.env.APP_ENV) {
case 'dev':
  Object.assign(config_default, config_dev);
  break;
case 'local':
  Object.assign(config_default, config_local);
  break;
case 'pre':
  Object.assign(config_default, config_pre);
  break;
case 'prod':
  Object.assign(config_default, config_prod);
  break;
case 'unittest':
  Object.assign(config_default, config_unittest);
  break;
default:
  Object.assign(config_default, config_local);
  break;
}

if(process.env.admins) {
  const items = process.env.admins.split(';');
  items.forEach(item => {
    config_default.admins[item.trim()] = true;
  });
}

var urlinfo = new url.URL(config_default.host);
config_default.hostname = urlinfo.hostname || config_default.host;

if(config_default.diststatic){
  config_default.static_dir = path.join(__projdir, 'dist/static');
} else {
  config_default.static_dir = path.join(__projdir, 'static');
}

if (!fs.existsSync(config_default.log_dir)) {
  fs.mkdirSync(config_default.log_dir, { recursive: true });
}
if (!fs.existsSync(config_default.upload.dir)) {
  fs.mkdirSync(config_default.upload.dir, { recursive: true });
}

export default config_default;
