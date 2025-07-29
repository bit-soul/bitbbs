//*****************************************************************************
// load global variable
//*****************************************************************************
require("./global.js");

if (!global.config.debug && global.config.oneapm_key) {
  // require('oneapm');
}


//*****************************************************************************
// require modules
//*****************************************************************************
const fs = require('fs');
const path = require('path');
const lodash = require('lodash');

const Koa = require('koa');
const koaonerror = require('koa-onerror')
const koarouter = require('@koa/router');
const koastatic = require('koa-static')
const koamount = require('koa-mount');
const koaejs = require('@koa/ejs')
const koabody = require('koa-body')
const koaredis = require('koa-redis');
const koasession = require('koa-session');

const koacors = require('@koa/cors');
const koacsrf = require('koa-csrf');
const koahelmet = require('koa-helmet');
const koapassport = require('koa-passport');
const GitHubStrategy = require('passport-github').Strategy;
const gracefulShutdown = require('http-graceful-shutdown');

const midAuth = require('./middlewares/auth');
const midProxy = require('./middlewares/proxy');
const midReqlog = require('./middlewares/reqlog');
const midRender = require('./middlewares/render');
const midGithub = require('./middlewares/github');

const logger = require('./common/logger');


//*****************************************************************************
// create app and load middlewares
//*****************************************************************************
const app = new Koa();

// onerror
koaonerror.onerror(app);

//logger
if (!fs.existsSync(global.config.log_dir)) {
  fs.mkdirSync(global.config.log_dir, { recursive: true });
}
if(global.config.debug) {
  app.use(midReqlog);
  app.use(midRender.times);
}

//staticfile
var staticDir = path.join(__dirname, '../static');
if(global.config.diststatic){
  staticDir = path.join(__dirname, '../dist/static');
}
app.use(koamount('/static', koastatic(staticDir)));

var uploadDir = path.join(__dirname, '../upload');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use(koamount('/upload', koastatic(uploadDir)));

// session
app.keys = [global.config.session_secret];
const session_config = {
  key: global.config.session_cookie_key, /** Cookie key (default is koa:sess) */
  maxAge: global.config.session_max_age, /** Session expiration time in milliseconds */
  autoCommit: true, /** Automatically add session to response header (default: true) */
  overwrite: true, /** Allow overwriting session cookie (default: true) */
  httpOnly: true, /** HTTPOnly to prevent JS access and reduce XSS risk (default: true) */
  signed: true, /** Sign the cookie (default: true) */
  rolling: false, /** Refresh session on every response (default: false) */
  renew: true, /** Renew session if it's about to expire (default: false) */
  store: koaredis(global.config.koaredis_cfg), /** Use Redis as session store */
  sameSite: 'lax', /** (string) session cookie sameSite options (default null, don't set it) */
};
app.use(koasession.createSession(session_config, app));

// csrf
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

// auth user
app.use(midAuth.authUser);
app.use(midAuth.blockUser);

// oauth middleware
app.use(koapassport.initialize());
koapassport.serializeUser(function (user, done) {
  done(null, user);
});
koapassport.deserializeUser(function (user, done) {
  done(null, user);
});
koapassport.use(new GitHubStrategy(global.config.GITHUB_OAUTH, midGithub.strategy));

//ejs
koaejs(app, {
  root: path.join(__dirname, 'views'),
  viewExt: 'ejs',
  layout: 'layout',
  cache: global.config.cache,
});
app.use(midRender.extend);

//body
app.use(koabody.koaBody({
  multipart: true,
  formidable: {
    maxFileSize: 1 * 1024 * 1024, // 1MB
    keepExtensions: true
  }
}));

//helmet
if (!global.config.debug) {
  app.use(
    koahelmet({
      contentSecurityPolicy: false,
    }),
  );
}

//cors
app.use(koacors({
  origin: true,
  maxAge: 86400,
  //credentials: true,
  //expose: ['Content-Type', 'Content-Length'],
  //methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  //headers: ['Content-Type', 'Authorization', 'Accept'],
}));


//*****************************************************************************
// load proxy agent and routers
//*****************************************************************************
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
    else if(router_path.slice(-3) === '.js')
    {
      var router_handler = require(router_path);
      if(router_handler.routes !== undefined)
      {
        app.use(router_handler.routes(), router_handler.allowedMethods());
      }
      else
      {
        logger.error(`cann't load router ${router_path}`);
      }
    }
    //it's neither a directory or js file
    else
    {
      logger.info(`cann't load router ${router_path}`);
    }
  }
})();


//*****************************************************************************
// start server
//*****************************************************************************
global.server = app.listen(global.config.port, "127.0.0.1");
gracefulShutdown(global.server);
