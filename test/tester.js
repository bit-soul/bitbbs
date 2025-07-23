var nock = require('nock');

// eslint-disable-next-line no-undef
beforeAll(() => {
  global.env = 'local';
  global.config = require('../src/config/local');
  require("./global.js");
  require('../common/redis').flushdb();
  nock.enableNetConnect();
});

// eslint-disable-next-line no-undef
afterAll(() => {

});
