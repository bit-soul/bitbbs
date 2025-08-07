//fix run node18 in win7
require('os').hostname=()=>"localhost"

require('@dotenvx/dotenvx').config({path:'./env/local.env'});
require("./src/app.js");
