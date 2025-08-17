//*****************************************************************************
// choose config file
//*****************************************************************************
switch (process.env.APP_ENV) {
case 'dev':
  global.env = 'dev';
  global.config =  (await import('./config/dev.js')).default;
  break;
case 'local':
  global.env = 'local';
  global.config =  (await import('./config/local.js')).default;
  break;
case 'pre':
  global.env = 'pre';
  global.config =  (await import('./config/pre.js')).default;
  break;
case 'prod':
  global.env = 'prod';
  global.config =  (await import('./config/prod.js')).default;
  break;
case 'unittest':
  global.env = 'unittest';
  global.config =  (await import('./config/unittest.js')).default;
  break;
default:
  global.env = 'local';
  global.config =  (await import('./config/local.js')).default;
  break;
}
if(process.env.admins) {
  const items = process.env.admins.split(';');
  items.forEach(item => {
    global.config.admins[item.trim()] = true;
  });
}

import { URL } from 'url';
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
import mongoose from 'mongoose';

mongoose.set('strictQuery', true);
mongoose.connect(global.config.mongodb_cfg.db, {
  maxPoolSize: 10,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
}, function (err) {
  if (err) {
    console.log(`connect to ${global.config.mongodb_cfg.db} error: ${err.message}`);
    process.exit(1);
  }
});

if (global.config.debug) {
  var traceMQuery = function (method, info, query) {
    return function (err, result, millis) {
      if (err) {
        console.log('traceMQuery error:', err)
      }
      var infos = [];
      infos.push(query._collection.collection.name + "." + method);
      infos.push(JSON.stringify(info));
      infos.push((millis + 'ms'));

      console.log("MONGO", infos.join(' '));
    };
  };

  mongoose.Mongoose.prototype.mquery.setGlobalTraceFunction(traceMQuery);
}
