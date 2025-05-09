var express = require('express');
var wallet = require('./controllers/wallet');
var sign = require('./controllers/sign');
var site = require('./controllers/site');
var user = require('./controllers/user');
var message = require('./controllers/message');
var topic = require('./controllers/topic');
var reply = require('./controllers/reply');
var rss = require('./controllers/rss');
var staticController = require('./controllers/static');
var auth = require('./middlewares/auth');
var limit = require('./middlewares/limit');
var github = require('./controllers/github');
var search = require('./controllers/search');
var passport = require('passport');
var configMiddleware = require('./middlewares/conf');

var router = express.Router();

// home page
router.get('/', site.index);
// sitemap
router.get('/sitemap.xml', site.sitemap);

// sign controller
if (global.config.allow_sign_up) {
  router.get('/signup', sign.showSignup);  // 跳转到注册页面
  router.post('/signup', sign.signup);  // 提交注册信息
} else {
  // 进行github验证
  router.get('/signup', function (req, res, next) {
    return res.redirect('/auth/github')
  });
}
router.post('/wallet_login', wallet.wallet_login);
router.post('/authkey_login', wallet.authkey_login);
router.post('/get_authkey', wallet.getauthkey);
router.get('/signout', sign.signout);  // 登出
router.get('/signin', sign.showLogin);  // 进入登录页面
router.post('/signin', sign.login);  // 登录校验
router.get('/active_account', sign.activeAccount);  //帐号激活

router.get('/search_pass', sign.showSearchPass);  // 找回密码页面
router.post('/search_pass', sign.updateSearchPass);  // 更新密码
router.get('/reset_pass', sign.resetPass);  // 进入重置密码页面
router.post('/reset_pass', sign.updatePass);  // 更新密码

// user controller
router.get('/user/:uid', user.index); // 用户个人主页
router.get('/setting', auth.userRequired, user.showSetting); // 用户个人设置页
router.post('/setting', auth.userRequired, user.setting); // 提交个人信息设置
router.get('/advances', user.listAdvances); // 显示所有达人列表页
router.get('/users/top100', user.top100);  // 显示积分前一百用户页
router.get('/user/:uid/markedtopics', user.listMarkedTopics);  // 用户收藏的所有话题页
router.get('/user/:uid/topics', user.listTopics);  // 用户发布的所有话题页
router.get('/user/:uid/replies', user.listReplies);  // 用户参与的所有回复页
router.post('/user/set_advance', auth.adminRequired, user.toggleAdvance); // 把某用户设为达人
router.post('/user/cancel_advance', auth.adminRequired, user.toggleAdvance);  // 取消某用户的达人身份
router.post('/user/:uid/block', auth.adminRequired, user.block);  // 禁言某用户
router.post('/user/:uid/delete_all', auth.adminRequired, user.deleteAll);  // 删除某用户所有发言
router.post('/user/refresh_token', auth.userRequired, user.refreshToken);  // 刷新用户token

// message controler
router.get('/my/messages', auth.userRequired, message.index); // 用户个人的所有消息页

// topic

// 新建文章界面
router.get('/topic/create', auth.userRequired, topic.create);

router.get('/topic/:tid', topic.index);  // 显示某个话题
router.post('/topic/:tid/top', auth.adminRequired, topic.top);  // 将某话题置顶
router.post('/topic/:tid/good', auth.adminRequired, topic.good); // 将某话题加精
router.get('/topic/:tid/edit', auth.userRequired, topic.showEdit);  // 编辑某话题
router.post('/topic/:tid/lock', auth.adminRequired, topic.lock); // 锁定主题，不能再回复

router.post('/topic/:tid/delete', auth.userRequired, topic.delete);

// 保存新建的文章
router.post('/topic/create', auth.userRequired, limit.peruserperday('create_topic', global.config.create_post_per_day, {showJson: false}), topic.put);

router.post('/topic/:tid/edit', auth.userRequired, topic.update);
router.post('/topic/mark', auth.userRequired, topic.mark); // 关注某话题
router.post('/topic/unmark', auth.userRequired, topic.unmark); // 取消关注某话题

// reply controller
router.post('/:tid/reply', auth.userRequired, limit.peruserperday('create_reply', global.config.create_reply_per_day, {showJson: false}), reply.add); // 提交一级回复
router.get('/reply/:rid/edit', auth.userRequired, reply.showEdit); // 修改自己的评论页
router.post('/reply/:rid/edit', auth.userRequired, reply.update); // 修改某评论
router.post('/reply/:rid/delete', auth.userRequired, reply.delete); // 删除某评论
router.post('/reply/:rid/up', auth.userRequired, reply.up); // 为评论点赞
router.get('/presignedurl', auth.userRequired, topic.presignedurl); //上传图片
router.post('/upload', auth.userRequired, topic.upload); //上传图片

// static
router.get('/about', staticController.about);
router.get('/robots.txt', staticController.robots);

//rss
router.get('/rss', rss.index);

// github oauth
router.get('/auth/github', configMiddleware.github, passport.authenticate('github'));
router.get('/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/signin' }),
  github.callback);
router.get('/auth/github/new', github.new);
router.post('/auth/github/create', limit.peripperday('create_user_per_ip', global.config.create_user_per_ip, {showJson: false}), github.create);

router.get('/search', search.index);

//todo 理解这里是干什么的
//if (!global.config.debug) { // 这个兼容破坏了不少测试
//	router.get('/:uid', function (req, res) {
//	  res.redirect('/user/' + req.params.uid)
//	})
//}

module.exports = router;
