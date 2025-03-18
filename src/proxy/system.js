var System = require('../models').System;

exports.incrementUserCnt = async function(callback) {
  const result = await System.findOneAndUpdate(
    { }, // 查找条件, 匹配第一条记录
    { $inc: { user_cnt: 1 } }, // 计数器加1
    { new: true, upsert: true } // 返回更新后的值，如果不存在则创建
  );
  callback(result.user_cnt);
  return result.user_cnt;
}
