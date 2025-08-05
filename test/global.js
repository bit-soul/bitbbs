module.exports = async () => {
  require('os').hostname=()=>"localhost"
  require("../src/app.js");

  global.support = require('./support');
  await support.initSupport();
}