var Models         = require('../models');
var User           = Models.User;
var authMiddleWare = require('../middlewares/auth');
var tools          = require('../common/tools');
var fetch          = require('../common/fetch');
var eventproxy     = require('eventproxy');
var uuid           = require('node-uuid');
var validator      = require('validator');
var brcsoul        = require('brcsoul-sdk');
var System         = require('../proxy').System;

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

  var result = {};
  var date_now = new Date();
  if( !(time>0) || date_now.getTime()<(time-600000) || date_now.getTime()>(time+600000) )
  {
      result.code = -1;
      result.mess = "please sync your local time!";
      res.send(JSON.stringify(result));
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
      res.send(JSON.stringify(result));
      return;
  }

  brcsoul.getPersonByAddr(addr)
    .then(respon => {
      if (respon.code >= 0) {
        function temp() {
          User.findOne({addr: addr}, function (err, user) {
            if (err) {
              return next(err);
            }
            if (user) {
              user.name = respon?.data?.attr?.name ? respon.data.attr.name : 'nobody_'+user.sequence.toString(36).padStart(2, '0');
              user.biog = respon?.data?.attr?.biog ? respon.data.attr.biog : '';
              user.icon = respon?.data?.attr?.icon ? brcsoul.httpExtraUrl(respon.data.attr.icon) : '';
              user.save(function (err) {
                if (err) {
                  return next(err);
                }
                authMiddleWare.gen_session(res, user._id);
                res.send(JSON.stringify({ code: 1, mess: "redirect" }));
              });
            } else {
              System.incrementUserCnt((count) => {
                var user = new User({
                  addr: addr,
                  name: respon?.data?.attr?.name ? respon.data.attr.name : 'nobody_'+count.toString(36).padStart(2, '0'),
                  biog: respon?.data?.attr?.biog ? respon.data.attr.biog : '',
                  icon: respon?.data?.attr?.icon ? brcsoul.httpExtraUrl(respon.data.attr.icon) : '',
                  active: true,
                  sequence: count,
                  accessToken: uuid.v4(),
                });
                user.save(function (err) {
                  if (err) {
                    return next(err);
                  }
                  authMiddleWare.gen_session(res, user._id);
                  res.send(JSON.stringify({ code: 1, mess: "redirect" }));
                });
              }) 
            }
          });
        }

        //icon: inscription number to inscription id
        if (respon?.data?.attr?.icon && /^[0-9]{1,16}$/.test(respon.data.attr.icon)) {
          fetch.fetchData("https://ordinals.com/inscription/" + respon.data.attr.icon)
            .then(result => {
              if (result.code === 0) {
                match = result.data.match(/\/content\/([a-f0-9]{64}.\d+)/)
                if (match) {
                  respon.data.attr.icon = "https://ordinals.com/content/" + match[1];
                }
              }
              temp();
            })
            .catch(error => {
              temp();
            })
        } else if (respon?.data?.attr?.icon && /^[a-f0-9]{64}.\d+$/.test(respon.data.attr.icon)) {
          respon.data.attr.icon = "https://ordinals.com/content/" + respon.data.attr.icon;
          temp();
        } else {
          temp();
        }
      } else {
        result.code = -1;
        result.mess = respon.mess;
        res.send(JSON.stringify(result));
      }
    })
    .catch(error => {
      result.code = -2;
      result.mess = error.message;
      res.send(JSON.stringify(result));
    })
}

exports.getauthkey = function (req, res, next) {
  var result = {};

  var maxage = parseInt(req.body.maxage);
  if(!maxage) {
    maxage = 1000 * 60 * 60 * 24 * 30;
  }

  if(!req?.session?.user?._id ) {
    result.code = -1;
    result.mess = "not login!";
    res.send(JSON.stringify(result));
    return;
  }

  if(req?.session?.is_authkey_login) {
    result.code = -1;
    result.mess = "login by authkey can not generate new authkey!";
    res.send(JSON.stringify(result));
    return;
  }

  authkey = tools.generateauthkey(req.session.user._id, maxage);
  result.code = 0;
  result.data = authkey;
  res.send(JSON.stringify(result));
}

exports.authkey_login = function (req, res, next) {
  var authkey = validator.trim(req.body.authkey);
  var authitem = global.authkeys[authkey];

  var result = {};

  if(authitem) {
      var userid = authitem[0];
      var maxage = authitem[1];
      delete global.authkeys[authkey];
      req.session.is_authkey_login = true;
      authMiddleWare.gen_session(res, userid, maxage);
      res.send(JSON.stringify({ code: 1, mess: "redirect" }));
  } else {
      result.code = -1;
      result.mess = "authkey error or timeout or used!";
      res.send(JSON.stringify(result));
  }
}