require('os').hostname=()=>"localhost"
require("../src/app.js");

var nock = require('nock');
var support = require('./support');

beforeAll(async () => {
  require('../src/common/redis').flushdb();
  nock.enableNetConnect();
  await support.initSupport();
});

afterAll(async () => {
});
