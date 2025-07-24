var nock = require('nock');
var support = require('./support');

beforeAll(async () => {
  global.env = 'local';
  global.config = require('../src/config/local');
  require("./global.js");
  require('../common/redis').flushdb();
  nock.enableNetConnect();
  await support.initSupport();
});

afterAll(async () => {
});
