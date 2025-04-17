//fix run node18 in win7
const os = require('os')
os.hostname=()=>"localhost"

//tempdata store in ram
global.authkeys = {
  //authkey: [userid, maxage]
};

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

if (!global.config.debug && global.config.oneapm_key) {
  require('oneapm');
}

require('colors');
const fs = require('fs');
var path = require('path');
var express = require('express');
var session = require('express-session');
var passport = require('passport');
require('./middlewares/mongoose_log');
require('./models');
var GitHubStrategy = require('passport-github').Strategy;
var githubStrategyMiddleware = require('./middlewares/github_strategy');
var webRouter = require('./router');
var auth = require('./middlewares/auth');
var errorPageMiddleware = require('./middlewares/error_page');
var proxyMiddleware = require('./middlewares/proxy');
var RedisStore = require('connect-redis')(session);
var _ = require('lodash');
var csurf = require('csurf');
var bodyParser = require('body-parser');
var busboy = require('connect-busboy');
var cors = require('cors');
var requestLog = require('./middlewares/request_log');
var renderMiddleware = require('./middlewares/render');
var logger = require('./common/logger');
var helmet = require('helmet');
var bytes = require('bytes');

var staticDir = path.join(__dirname, '../static');
if(config.diststatic){
  staticDir = path.join(__dirname, '../dist/static');
}
var uploadDir = path.join(__dirname, '../upload');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

if (!fs.existsSync(global.config.log_dir)) {
    fs.mkdirSync(global.config.log_dir, { recursive: true });
}

var urlinfo = require('url').parse(global.config.host);
global.config.hostname = urlinfo.hostname || global.config.host;

var app = express();

// configuration in all env
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.engine('html', require('ejs-mate'));
app.locals._layoutFile = 'layout.html';
app.enable('trust proxy');

// Request time logger 
app.use(requestLog);

if (global.config.debug) {
  // Render time
  app.use(renderMiddleware.render);
}

// static resource
app.use('/static', express.static(staticDir));
app.use('/upload', express.static(uploadDir));
app.use('/agent', proxyMiddleware.proxy);

// common middlewares
app.use(require('response-time')());
app.use(helmet.frameguard('sameorigin'));
app.use(bodyParser.json({limit: '1mb'}));
app.use(bodyParser.urlencoded({ extended: true, limit: '1mb' }));
app.use(require('method-override')());
app.use(require('cookie-parser')(global.config.session_secret));
app.use(session({
  secret: global.config.session_secret,
  store: new RedisStore({
    port: global.config.redis_cfg.port,
    host: global.config.redis_cfg.host,
    db: global.config.redis_cfg.db,
    pass: global.config.redis_cfg.password,
  }),
  resave: false,
  saveUninitialized: false,
}));

// oauth middleware
app.use(passport.initialize());

// github oauth
passport.serializeUser(function (user, done) {
  done(null, user);
});
passport.deserializeUser(function (user, done) {
  done(null, user);
});
passport.use(new GitHubStrategy(global.config.GITHUB_OAUTH, githubStrategyMiddleware));

// custom middleware
app.use(auth.authUser);
app.use(auth.blockUser());

if (!global.config.debug) {
  app.use(function (req, res, next) {
    if (req.path === '/api' || req.path.indexOf('/api') === -1) {
      csurf()(req, res, next);
      return;
    }
    next();
  });
  app.set('view cache', true);
}

// for debug
// app.get('/err', function (req, res, next) {
//   next(new Error('haha'))
// });

// set static, dynamic helpers
_.extend(app.locals, {
  config: global.config,
});

app.use(errorPageMiddleware.errorPage);
_.extend(app.locals, require('./common/render_helper'));
app.use(function (req, res, next) {
  res.locals.csrf = req.csrfToken ? req.csrfToken() : '';
  next();
});

app.use(busboy({
  limits: {
    fileSize: bytes(global.config.file_limit)
  }
}));

// routes
app.use('/', webRouter);

// error handler
if (global.config.debug) {
  app.use(require('errorhandler')());
} else {
  app.use(function (err, req, res, next) {
    logger.error(err);
    return res.status(500).send('500 status');
  });
}

app.listen(global.config.port, function () {
  logger.info('listening on port', global.config.port);
  logger.info('God bless love....');
  logger.info('You can debug your app with http://' + global.config.hostname + ':' + global.config.port);
  logger.info('');
});
