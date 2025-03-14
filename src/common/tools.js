var bcrypt = require('bcryptjs');
var moment = require('moment');

moment.locale('en');

// 格式化时间
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

exports.bhash = function (str, callback) {
  bcrypt.hash(str, 10, callback);
};

exports.bcompare = function (str, hash, callback) {
  bcrypt.compare(str, hash, callback);
};
