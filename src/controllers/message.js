import Router from '@koa/router';
import * as proxyMessage from '../proxys/message.js';

const router = new Router();

router.get('/my/messages', async (ctx, next) => {
  const user_id = ctx.session.user_id;

  // 并发获取已读和未读消息原始数据
  const [has_read, unread] = await Promise.all([
    proxyMessage.getReadMessagesByUserId(user_id),
    proxyMessage.getUnreadMessageByUserId(user_id)
  ]);

  // 辅助函数：填充消息详情
  const fillMessages = async (messages) => {
    const filled = await Promise.all(
      messages.map(msg => proxyMessage.getMessageRelations(msg))
    );
    return filled.filter(doc => !doc.is_invalid);
  };

  // 填充详情并过滤无效项
  const [has_read_messages, hasnot_read_messages] = await Promise.all([
    fillMessages(has_read),
    fillMessages(unread)
  ]);

  // 标记未读为已读（不等待）
  proxyMessage.updateMessagesToRead(user_id, unread).catch(console.error);

  // 渲染视图（保持原res.render模式）
  return await ctx.render('message/index', {
    has_read_messages,
    hasnot_read_messages
  });
});

export default router;
