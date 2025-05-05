var logger   = require('./common/logger');

/****************************************************************************************
 *
 *  tempdata store in ram
 *
 ****************************************************************************************/
global.authkeys = {
  //authkey: [userid, maxage]
};



const { URL } = require('url');
var urlinfo = new URL(global.config.host);
global.config.hostname = urlinfo.hostname || global.config.host;



var mongoose = require('mongoose');

mongoose.set('strictQuery', true);
mongoose.connect(global.config.mongodb_cfg.db, {
  maxPoolSize: 10,  
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000,
}, function (err) {
  if (err) {
    logger.error('connect to %s error: ', global.config.mongodb_cfg.db, err.message);
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
