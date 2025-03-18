var System = require('../models').System;

exports.incrementUserCnt = async function(callback) {
  const result = await System.findOneAndUpdate(
    { }, // ��������, ƥ���һ����¼
    { $inc: { user_cnt: 1 } }, // ��������1
    { new: true, upsert: true } // ���ظ��º��ֵ������������򴴽�
  );
  callback(result.user_cnt);
  return result.user_cnt;
}
