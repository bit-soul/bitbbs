const Router = require('koa-router');
var Message    = require('../proxy/message');
const router = new Router();

router.get('/my/messages', async (ctx, next) => {
  try {
    const user_id = ctx.session.user._id;

    // 并发获取已读和未读消息原始数据
    const [has_read, unread] = await Promise.all([
      Message.getReadMessagesByUserId(user_id),
      Message.getUnreadMessageByUserId(user_id)
    ]);

    // 辅助函数：填充消息详情
    const fillMessages = async (messages) => {
      const filled = await Promise.all(
        messages.map(msg => Message.getMessageRelations(msg))
      );
      return filled.filter(doc => !doc.is_invalid);
    };

    // 填充详情并过滤无效项
    const [has_read_messages, hasnot_read_messages] = await Promise.all([
      fillMessages(has_read),
      fillMessages(unread)
    ]);

    // 标记未读为已读（不等待）
    Message.updateMessagesToRead(user_id, unread).catch(console.error);

    // 渲染视图（保持原res.render模式）
    return ctx.render('message/index', {
      has_read_messages,
      hasnot_read_messages
    });

  } catch (err) {
    return next(err);
  }
});

module.exports = router;
