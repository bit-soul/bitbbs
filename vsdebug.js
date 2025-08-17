//fix run node18 in win7
import os from 'os';
os.hostname = ()=>"localhost";

import dotenvx from '@dotenvx/dotenvx';
dotenvx.config({path:'./env/local.env'});

(async () => {
  await import("./src/app.js");
})();
