//*****************************************************************************
// load global variable
//*****************************************************************************
import config from './config/index.js';
if (!config.debug && config.oneapm_key) {
  // import 'oneapm';
}

//*****************************************************************************
// import modules
//*****************************************************************************
import fs from 'fs';
import url from 'url';
import path from 'path';
import lodash from 'lodash';

import Koa from 'koa';
import koarouter from '@koa/router';
import koastatic from 'koa-static';
import koamount from 'koa-mount';
import koaejs from '@koa/ejs';
import koabody from 'koa-body';
import koaredis from 'koa-redis';
import * as koaonerror from 'koa-onerror';
import * as koasession from 'koa-session';

import koacors from '@koa/cors';
import koacsrf from 'koa-csrf';
import koahelmet from 'koa-helmet';
import koapassport from 'koa-passport';
import { Strategy as GitHubStrategy } from 'passport-github';
import gracefulShutdown from 'http-graceful-shutdown';

import * as midAuth from './middlewares/auth.js';
import * as midProxy from './middlewares/proxy.js';
import * as midReqlog from './middlewares/reqlog.js';
import * as midRender from './middlewares/render.js';
import * as midGithub from './middlewares/github.js';

import logger from './common/logger.js';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//*****************************************************************************
// create app and load middlewares
//*****************************************************************************
const app = new Koa();

// onerror
koaonerror.onerror(app);

//logger
if (!fs.existsSync(config.log_dir)) {
  fs.mkdirSync(config.log_dir, { recursive: true });
}
if(config.debug) {
  app.use(midReqlog.reqlog);
  app.use(midRender.times);
}

//staticfile
var staticDir = path.join(__dirname, '../static');
if(config.diststatic){
  staticDir = path.join(__dirname, '../dist/static');
}
app.use(koamount('/static', koastatic(staticDir)));

var uploadDir = path.join(__dirname, '../upload');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use(koamount('/upload', koastatic(uploadDir)));

// session
app.keys = [config.session_secret];
const session_config = {
  key: config.session_cookie_key, /** Cookie key (default is koa:sess) */
  maxAge: config.session_max_age, /** Session expiration time in milliseconds */
  autoCommit: true, /** Automatically add session to response header (default: true) */
  overwrite: true, /** Allow overwriting session cookie (default: true) */
  httpOnly: true, /** HTTPOnly to prevent JS access and reduce XSS risk (default: true) */
  signed: true, /** Sign the cookie (default: true) */
  rolling: false, /** Refresh session on every response (default: false) */
  renew: true, /** Renew session if it's about to expire (default: false) */
  store: koaredis(config.koaredis_cfg), /** Use Redis as session store */
  sameSite: 'lax', /** (string) session cookie sameSite options (default null, don't set it) */
};
app.use(koasession.createSession(session_config, app));

// csrf
if (!config.debug) {
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
koapassport.use(new GitHubStrategy(config.GITHUB_OAUTH, midGithub.strategy));

//ejs
koaejs(app, {
  root: path.join(__dirname, 'views'),
  viewExt: 'ejs',
  layout: 'layout',
  cache: config.cache,
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
if (!config.debug) {
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
(async function(){

  await loadRouters(path.join(__dirname, './controllers'));

  async function loadRouters(router_path)
  {
    //if router_path is a directory, then call loadRouters for each of it's items
    if(fs.lstatSync(router_path).isDirectory())
    {
      var items=fs.readdirSync(router_path);
      items.forEach(function(item, index, array){
        loadRouters(path.join(router_path, item));
      });
    }
    //if router_path is js file, then load it as router
    else if(router_path.slice(-3) === '.js')
    {
      var router_handler = (await import(url.pathToFileURL(router_path))).default;
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
global.server = app.listen(config.port, "127.0.0.1");
gracefulShutdown(global.server);
