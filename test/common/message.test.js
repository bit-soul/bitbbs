const message = require('../../src/common/message');

describe('common/message', () => {
  let atUser, author, topic, reply;

  beforeAll(async () => {
    atUser = support.normalUser;
    author = atUser;
    reply = {};
    topic = await support.createTopic(author._id)
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('sendReplyMessage', () => {
    test('should send reply message', async () => {
      await message.sendReplyMessage(atUser._id, author._id, topic._id, reply._id);
    });
    test('should send at message', async () => {
      await message.sendAtMessage(atUser._id, author._id, topic._id, reply._id);
    });
  });
});
