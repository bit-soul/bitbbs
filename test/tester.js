require('os').hostname=()=>"localhost"

var nock = require('nock');
var support = require('./support');

require("../src/app.js");

beforeAll(async () => {
  require('../src/common/redis').flushdb();
  nock.enableNetConnect();
  await support.initSupport();
});

afterAll(async () => {
});
