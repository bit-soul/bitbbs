import modelMessage from '../models/message.js';

export async function sendReplyMessage(master_id, author_id, topic_id, reply_id) {
  const message = new modelMessage();
  message.type = 'reply';
  message.master_id = master_id;
  message.author_id = author_id;
  message.topic_id = topic_id;
  message.reply_id = reply_id;

  return await message.save();
}

export async function sendAtMessage(master_id, author_id, topic_id, reply_id) {
  const message = new modelMessage();
  message.type = 'at';
  message.master_id = master_id;
  message.author_id = author_id;
  message.topic_id = topic_id;
  message.reply_id = reply_id;

  return await message.save();
}
