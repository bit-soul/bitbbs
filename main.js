const dotenvx = require('@dotenvx/dotenvx');
switch(process.env.APP_ENV) {
case 'dev':
  dotenvx.config({path:'./env/dev.env'});
  break;
case 'local':
  dotenvx.config({path:'./env/local.env'});
  break;
case 'pre':
  dotenvx.config({path:'./env/pre.env'});
  break;
case 'prod':
  dotenvx.config({path:'./env/prod.env'});
  break;
case 'unittest':
  dotenvx.config({path:'./env/unittest.env'});
  break;
default:
  dotenvx.config({path:'./env/local.env'});
  break;
}

require("./src/app.js");
