var Models         = require('../models');
var User           = Models.User;
var authMiddleWare = require('../middlewares/auth');
var tools          = require('../common/tools');
var eventproxy     = require('eventproxy');
var uuid           = require('node-uuid');
var validator      = require('validator');

exports.callback = function (req, res, next) {
  var profile = req.user;
  var email = profile.emails && profile.emails[0] && profile.emails[0].value;
  if (!email) {
    return res.status(500)
      .render('sign/no_github_email');
  }
  User.findOne({githubId: profile.id}, function (err, user) {
    if (err) {
      return next(err);
    }
    // 当用户已经注册，通过 github 登陆将会更新他的资料
    if (user) {
      user.githubUsername = profile.username;
      user.githubId = profile.id;
      user.githubAccessToken = profile.accessToken;
      user.icon = profile._json.avatar_url;
      user.email = email || user.email;


      user.save(function (err) {
        if (err) {
          return next(err);
        }
        authMiddleWare.gen_session(user, res);
        return res.redirect('/');
      });
    } else {
      // 如果用户还未存在，则建立新用户
      req.session.profile = profile;
      return res.redirect('/auth/github/new');
    }
  });
};

exports.new = function (req, res, next) {
  res.render('sign/new_oauth', {actionPath: '/auth/github/create'});
};

exports.create = function (req, res, next) {
  var profile = req.session.profile;

  var ep = new eventproxy();
  ep.fail(next);

  if (!profile) {
    return res.redirect('/signin');
  }
  delete req.session.profile;

  var email = profile.emails && profile.emails[0] && profile.emails[0].value;
  if (!email) {
    return res.status(500)
      .render('sign/no_github_email');
  }
  var user = new User({
    name: profile.username,
    pass: profile.accessToken,
    email: email,
    icon: profile._json.avatar_url,
    githubId: profile.id,
    githubUsername: profile.username,
    githubAccessToken: profile.accessToken,
    active: true,
    accessToken: uuid.v4(),
  });
  user.save(function (err) {
    if (err) {
      return next(err);
    }
    authMiddleWare.gen_session(user, res);
    res.redirect('/');
  });
};
