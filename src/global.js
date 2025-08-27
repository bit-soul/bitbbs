import config from './config/index.js';

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
mongoose.connect(config.mongodb_cfg.db, {
  maxPoolSize: 10,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
}, function (err) {
  if (err) {
    console.log(`connect to ${config.mongodb_cfg.db} error: ${err.message}`);
    process.exit(1);
  }
});

if (config.debug) {
  const traceMQuery = function (method, info, query) {
    return function (err, result, millis) {
      if (err) {
        console.log('traceMQuery error:', err)
      }
      const infos = [];
      infos.push(query._collection.collection.name + "." + method);
      infos.push(JSON.stringify(info));
      infos.push((millis + 'ms'));

      console.log("MONGO", infos.join(' '));
    };
  };

  mongoose.Mongoose.prototype.mquery.setGlobalTraceFunction(traceMQuery);
}
