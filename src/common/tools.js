const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const moment = require('moment');

moment.locale('en');

exports.formatDate = function (date, friendly) {
  date = moment(date);

  if (friendly) {
    return date.fromNow();
  } else {
    return date.format('YYYY-MM-DD HH:mm');
  }

};

exports.getFormattedDate = function() {
    const date = new Date();
    return date.getFullYear() + 
           String(date.getMonth() + 1).padStart(2, '0') + 
           String(date.getDate()).padStart(2, '0');
}

exports.getFormattedTime = function() {
    const date = new Date();
    return String(date.getHours()).padStart(2, '0') +
           String(date.getMinutes()).padStart(2, '0') +
           String(date.getSeconds()).padStart(2, '0');
}

exports.validateId = function (str) {
  return (/^[a-zA-Z0-9\-_]+$/i).test(str);
};

exports.bhash = async function (str) {
  return await bcrypt.hash(str, 10);
};

exports.bcompare = async function (str, hash) {
  return await bcrypt.compare(str, hash);
};

exports.md5 = function (str) {
  return crypto.createHash('md5').update(str).digest('hex');
}

exports.uuid = function () {
  return crypto.randomUUID();
}

exports.generateauthkey = function (userid, maxage) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let authkey = '';
  for (let i = 0; i < 10; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    authkey += chars[randomIndex];
  }

  global.authkeys[authkey] = [userid, maxage];
  setTimeout(()=> {
    delete global.authkeys[authkey];
  }, 600 * 1000);

  return authkey;
}

exports.sleep = async (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

exports.retryTimes = async (fun, times, interval) => {
  let last_error;

  for (let retry_cnt = 0; retry_cnt < times; ++retry_cnt) {
    try {
      return await fun();
    } catch (error) {
      await sleep(interval);
      last_error = error;
    }
  }

  throw last_error;
}

exports.utf8ForXml= function (inputStr) {
  return inputStr.replace(/[^\x09\x0A\x0D\x20-\xFF\x85\xA0-\uD7FF\uE000-\uFDCF\uFDE0-\uFFFD]/gm, '');
}
