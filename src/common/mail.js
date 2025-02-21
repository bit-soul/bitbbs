var mailer        = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var util          = require('util');
var logger = require('./logger');
var transporter     = mailer.createTransport(smtpTransport(global.config.mail_opts));
var SITE_ROOT_URL = 'http://' + global.config.host;
var async = require('async')

/**
 * Send an email
 * @param {Object} data 邮件对象
 */
var sendMail = function (data) {
  if (global.config.debug) {
    return;
  }

  // 重试5次
  async.retry({times: 5}, function (done) {
    transporter.sendMail(data, function (err) {
      if (err) {
        // 写为日志
        logger.error('send mail error', err, data);
        return done(err);
      }
      return done()
    });
  }, function (err) {
    if (err) {
      return logger.error('send mail finally error', err, data);
    }
    logger.info('send mail success', data)
  })
};
exports.sendMail = sendMail;

/**
 * 发送激活通知邮件
 * @param {String} who 接收人的邮件地址
 * @param {String} token 重置用的token字符串
 * @param {String} name 接收人的用户名
 */
exports.sendActiveMail = function (who, name, token, uid) {
  var from    = util.format('%s <%s>', global.config.bbsname, global.config.mail_opts.auth.user);
  var to      = who;
  var subject = global.config.bbsname + ' Community Account Activation';
  var html    = '<p>Hello, ' + name + '</p>' +
      '<p>We have received your registration information for the ' + global.config.bbsname + ' community. Please click the link below to activate your account:</p>' +
      '<a href="' + SITE_ROOT_URL + '/active_account?key=' + token + '&uid=' + uid + '">Activation Link</a>' +
      '<p>If you have not registered on ' + global.config.bbsname + ' community, it means someone has misused your email address. Please delete this email, and we apologize for any inconvenience caused.</p>' +
      '<p>' + global.config.bbsname + ' Community Best Regards.</p>';

  exports.sendMail({
    from: from,
    to: to,
    subject: subject,
    html: html
  });
};

/**
 * 发送密码重置通知邮件
 * @param {String} who 接收人的邮件地址
 * @param {String} token 重置用的token字符串
 * @param {String} name 接收人的用户名
 */
exports.sendResetPassMail = function (who, token, name) {
  var from = util.format('%s <%s>', global.config.bbsname, global.config.mail_opts.auth.user);
  var to = who;
  var subject = global.config.bbsname + ' Community Password Reset';
  var html = '<p>Hello, ' + name + '</p>' +
      '<p>We have received a request to reset your password for ' + global.config.bbsname + ' community. Please click the link below within 24 hours to reset your password:</p>' +
      '<a href="' + SITE_ROOT_URL + '/reset_pass?key=' + token + '&name=' + name + '">Reset Password Link</a>' +
      '<p>If you have not registered on ' + global.config.bbsname + ' community, it means someone has misused your email address. Please delete this email, and we apologize for any inconvenience caused.</p>' +
      '<p>' + global.config.bbsname + ' Community Best Regards.</p>';
  exports.sendMail({
    from: from,
    to: to,
    subject: subject,
    html: html
  });
};
