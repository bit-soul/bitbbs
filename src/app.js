//choose config file
switch (process.env.APP_ENV) {
  case 'dev':
    global.env = 'dev';
    global.config = require('./config/dev');
    break;
  case 'local':
    global.env = 'local';
    global.config = require('./config/local');
    break;
  case 'pre':
    global.env = 'pre';
    global.config = require('./config/pre');
    break;
  case 'prod':
    global.env = 'prod';
    global.config = require('./config/prod');
    break;
  case 'unittest':
    global.env = 'unittest';
    global.config = require('./config/unittest');
    break;
  default:
    global.env = 'local';
    global.config = require('./config/local');
    break;
}
if(process.env.admins) {
  const items = process.env.admins.split(';');
  items.forEach(item => {
    global.config.admins[item.trim()] = true;
  });
}

const fs = require('fs');
const path = require('path');
const lodash = require('lodash');

const Koa = require('koa');
const koaonerror = require('koa-onerror')
const koastatic = require('koa-static')
const koabody = require('koa-body')
const koasession = require('koa-session');
const koaredis = require('koa-redis');
const koaejs = require('@koa/ejs')
const koacors = require('@koa/cors');
const koacsrf = require('koa-csrf');
const koapassport = require('koa-passport');
const koahelmet = require('koa-helmet');
const koarouter = require('@koa/router');

const midAuth = require('./middlewares/auth');
const midErrpage = require('./middlewares/errpage');
const midProxy = require('./middlewares/proxy');
const midReqlog = require('./middlewares/reqlog');
const midRender = require('./middlewares/render');
const midGithub = require('./middlewares/github');

const logger = require('./common/logger');

const GitHubStrategy = require('passport-github').Strategy;

// load global variable
require("./global.js");

if (!global.config.debug && global.config.oneapm_key) {
  require('oneapm');
}

const app = new Koa();

// security
if (!global.config.debug) {
  const csrf = new koacsrf();
  app.use(async (ctx, next) => {
    const path = ctx.path;
    if (path !== '/api' && !path.startsWith('/api/')) {
      await csrf.middleware()(ctx, next);
    } else {
      await next();
    }
  });
}

app.use(async (ctx, next) => {
  ctx.state.csrf = ctx.csrf || '';
  await next();
});

app.use(koahelmet());

// onerror
koaonerror.onerror(app);

//ejs
koaejs(app, {
  root: path.join(__dirname, 'views'),
  viewExt: 'ejs',
  layout: 'layout',
  cache: global.config.cache,
  compileDebug: global.config.debug,
});
app.use(midRender.extend);

// session
app.keys = [global.config.koa_session_app_key];
const session_config = {
    key: 'koa:tt', /**  cookie的key。 (默认是 koa:sess) */
    maxAge: global.config.koa_session_max_age,   /**  session 过期时间，以毫秒ms为单位计算 。*/
    autoCommit: true, /** 自动提交到响应头。(默认是 true) */
    overwrite: true, /** 是否允许重写 。(默认是 true) */
    httpOnly: true, /** 是否设置HttpOnly，如果在Cookie中设置了"HttpOnly"属性，那么通过程序(JS脚本、Applet等)将无法读取到Cookie信息，这样能有效的防止XSS攻击。  (默认 true) */
    signed: true, /** 是否签名。(默认是 true) */
    rolling: false, /** 是否每次响应时刷新Session的有效期。(默认是 false) */
    renew: true, /** 是否在Session快过期时刷新Session的有效期。(默认是 false) */
    store: koaredis(global.config.koaredis_config)
};
app.use(koasession.createSession(session_config, app));

//body
app.use(koabody.koaBody({
  multipart: true,
  formidable: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    keepExtensions: true
  }
}));

//cors
app.use(koacors({
    maxAge: 86400000,
    exposeHeaders: "Content-Type, Set-tt-Cookie, Content-Length",
    //allowHeaders: 
    //credentials: true,
}));

//logger
if (!fs.existsSync(global.config.log_dir)) {
    fs.mkdirSync(global.config.log_dir, { recursive: true });
}
if(global.config.enable_log) {
  app.use(midReqlog);
  app.use(midRender.times);
}

// auth user
app.use(midAuth.authUser);
app.use(midAuth.blockUser());

// oauth middleware
app.use(koapassport.initialize());
koapassport.serializeUser(function (user, done) {
  done(null, user);
});
koapassport.deserializeUser(function (user, done) {
  done(null, user);
});
koapassport.use(new GitHubStrategy(global.config.GITHUB_OAUTH, midGithub.strategy));

//staticfile
var staticDir = path.join(__dirname, '../static');
if(config.diststatic){
  staticDir = path.join(__dirname, '../dist/static');
}
app.use(koastatic(staticDir));

var uploadDir = path.join(__dirname, '../upload');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
app.use(koastatic(uploadDir));

// error page
app.use(midErrpage.errorPage);

//graceful-shutdown
//app.use(require("./middleware/graceful_shutdown.js"));

// proxy agent
const router = new koarouter();
router.all('/agent/(.*)', midProxy.proxy);

//load routers recursively
(function(){

   loadRouters(path.join(__dirname, './controllers'));

   function loadRouters(router_path)
   {
      //if router_path is a directory, then call loadRouters for each of it's items
      if(fs.lstatSync(router_path).isDirectory())
      {  
         var items=fs.readdirSync(router_path); 
         items.forEach(function(item, index, array){
            loadRouters(router_path + '/' + item);
         });
      }
      //if router_path is js file, then load it as router
      else if(router_path.slice(-3) == '.js')
      {  
         var router_handler = require(router_path); 
         if(router_handler.routes != undefined)
         {
            app.use(router_handler.routes(), router_handler.allowedMethods());
         }
         else
         {
            console.log('[alert]: cann\'t load router ' + router_path);
         }
      }
      //it's neither a directory or js file
      else
      {  
         console.log('[alert]: router skip file ' + router_path);
      }
   }
})();

/*延后60秒退出*/
global.shutdown = false;
global.shutdown_cnt = 0;
function graceful_shutdown()
{
  ++global.shutdown_cnt;
  if(global.shutdown_cnt>=3)
  {
    console.log("exit: " + Date.now())
    process.exit();
  }

  if(global.shutdown==false)
  {
    global.shutdown = true;
    console.log("preshut: " + Date.now());
    setTimeout(function(){
      console.log("exit: " + Date.now())
      process.exit();
    }, 60000)
  }
  else
  {
    console.log("shuting...");
  }
}
if(!global.config.debug) {
  process.on('SIGINT', graceful_shutdown);
  process.on('SIGTERM', graceful_shutdown);
}

/*启动服务*/
app.listen(global.config.port, "127.0.0.1");