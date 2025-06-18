const nodemailer = require('nodemailer');
const tools  = require('./tools');
const logger = require('./logger');

const transporter   = nodemailer.createTransport(global.config.mail_opts);
const SITE_ROOT_URL = 'http://' + global.config.host;

/**
 * Send an email
 * @param {Object} data 邮件对象
 */
exports.sendMail = async function (data) {
  if (global.config.debug) {
    return;
  }

  try {
    await tools.retryTimes(
      async () => {
        await transporter.sendMail(data);
      },
      5,        // 重试 5 次
      1000      // 每次间隔 1 秒（可以根据需要调整）
    );
    logger.info('send mail success', data);
  } catch (err) {
    logger.error('send mail finally error', err, data);
  }
};

/**
 * 发送激活通知邮件
 * @param {String} who 接收人的邮件地址
 * @param {String} token 重置用的token字符串
 * @param {String} name 接收人的用户名
 */
exports.sendActiveMail = function (who, name, token, uid) {
  var from    = `${global.config.bbsname} <${global.config.mail_opts.auth.user}>`;
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
  var from    = `${global.config.bbsname} <${global.config.mail_opts.auth.user}>`;
  var to      = who;
  var subject = global.config.bbsname + ' Community Password Reset';
  var html    = '<p>Hello, ' + name + '</p>' +
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
