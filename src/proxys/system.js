import modelSystem from '../models/system.js';

export async function incrementUserCnt () {
  const result = await modelSystem.findOneAndUpdate(
    {}, // 查找条件, 匹配第一条记录
    { $inc: { user_cnt: 1 } }, // 计数器加1
    { new: true, upsert: true } // 返回更新后的值，如果不存在则创建
  );

  return result.user_cnt;
}
