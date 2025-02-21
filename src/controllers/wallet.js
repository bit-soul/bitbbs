var Models         = require('../models');
var User           = Models.User;
var authMiddleWare = require('../middlewares/auth');
var tools          = require('../common/tools');
var eventproxy     = require('eventproxy');
var uuid           = require('node-uuid');
var validator      = require('validator');
var brcsoul        = require('brcsoul-sdk');

var notJump = [
  '/active_account', //active page
  '/reset_pass',     //reset password page, avoid to reset twice
  '/signup',         //regist page
  '/search_pass',    //serch pass page
];

exports.wallet_login = function (req, res, next) {
  var time = parseInt(req.body.time);
  var sign = validator.trim(req.body.sign);
  var addr = validator.trim(req.body.addr).toLowerCase();

  var date_now = new Date();
  if( !(time>0) || date_now.getTime()<(time-600000) || date_now.getTime()>(time+600000) )
  {
      result.code = -1;
      result.mess = "please sync your local time!";
      ctx.response.body = result;
      return;
  }

  var login_date = new Date(time);
  var login_mess = "Sign To Login BitBBS "
      + login_date.getUTCFullYear().toString().padStart(4,'0') + "/"
      +(login_date.getUTCMonth()+1).toString().padStart(2, '0') + "/"
      + login_date.getUTCDate().toString().padStart(2,'0') + " "
      + login_date.getUTCHours().toString().padStart(2,'0') + ":"
      + login_date.getUTCMinutes().toString().padStart(2,'0') + ":"
      + login_date.getUTCSeconds().toString().padStart(2,'0') + ""
      + " UTC"
      + "";
    
  if(brcsoul.verifySign(addr, login_mess, sign)==false)
  {
      result.code = -1;
      result.mess = "sign error!";
      ctx.response.body = result;
      return;
  }

  User.findOne({addr: addr}, function (err, user) {
    if (err) {
      return next(err);
    }
    if (user) {
      user.save(function (err) {
        if (err) {
          return next(err);
        }
        authMiddleWare.gen_session(user, res);
        res.send(JSON.stringify({ code: 1, mess: "redirect" }));
      });
    } else {
      var user = new User({
        addr: addr,
        name: "nobody",
        active: true,
        accessToken: uuid.v4(),
      });
      user.save(function (err) {
        if (err) {
          return next(err);
        }
        authMiddleWare.gen_session(user, res);
        res.send(JSON.stringify({ code: 1, mess: "redirect" }));
      });
    }
  });
}
