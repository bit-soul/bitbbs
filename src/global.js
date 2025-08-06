//*****************************************************************************
// choose config file
//*****************************************************************************
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
const { URL } = require('url');
var urlinfo = new URL(global.config.host);
global.config.hostname = urlinfo.hostname || global.config.host;



/****************************************************************************************
 *
 *  tempdata store in ram
 *
 ****************************************************************************************/
global.authkeys = {
  //authkey: [userid, maxage]
};


/****************************************************************************************
 *
 *  mongoose database connection
 *
 ****************************************************************************************/
var mongoose = require('mongoose');
var logger = require('./common/logger');

mongoose.set('strictQuery', true);
mongoose.connect(global.config.mongodb_cfg.db, {
  maxPoolSize: 10,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
}, function (err) {
  if (err) {
    logger.error(`connect to ${global.config.mongodb_cfg.db} error: ${err.message}`);
    process.exit(1);
  }
});

if (global.config.debug) {
  var traceMQuery = function (method, info, query) {
    return function (err, result, millis) {
      if (err) {
        logger.error('traceMQuery error:', err)
      }
      var infos = [];
      infos.push(query._collection.collection.name + "." + method);
      infos.push(JSON.stringify(info));
      infos.push((millis + 'ms'));

      logger.debug("MONGO", infos.join(' '));
    };
  };

  mongoose.Mongoose.prototype.mquery.setGlobalTraceFunction(traceMQuery);
}
