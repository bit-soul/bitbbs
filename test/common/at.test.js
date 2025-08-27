import * as at from '../../src/common/at.js';
import * as message from '../../src/common/message.js';


const matched_users = ['A-aZ-z0-9_', 'begin_with_spaces',
  'multi_in_oneline', 'around_text', 'end_with_no_space',
  'begin_with_no_spaces', 'end_with_no_space2',
  'begin_with_no_spaces2', 'alsotang', 'alsotang2',
  'tangzhanli', 'liveinjs'];

const text =
`
  @A-aZ-z0-9_
  @中文
    @begin_with_spaces @multi_in_oneline
  Text More Text @around_text ![Pic](/public/images/cnode_icon_32.png)
  @end_with_no_space中文
  Text 中文@begin_with_no_spaces
  @end_with_no_space2@begin_with_no_spaces2

  jysperm@gmail.com @alsotang

  https://medium.com/@nodejs/announcing-a-new-experimental-modules-1be8d2d6c2ff

  @alsotang2


  \`\`\`
  呵呵 \`\`\`
  @alsotang3
  \`\`\`

  \`\`\`js
     @flow
  \`\`\`

  \`\`\`@alsotang4\`\`\`

  @
  @@

  \`@code_begin_with_no_space\`
  code: \`@in_code\`

      @in_pre

  \`\`\`
  @in_oneline_pre
  \`\`\`

  \`\`\`
    Some Code
    Code @in_multi_line_pre
  \`\`\`

  [@be_link](/user/be_link) [@be_link2](/user/be_link2)

  @alsotang @alsotang
  aldjf
  @alsotang @tangzhanli

  [@alsotang](/user/alsotang)

  @liveinjs 没事儿，能力和热情更重要，北京北京，想的就邮件给我i5ting@126.com
`.trim().replace(/^ {2}/gm, '');


describe('common/at', function () {
  describe('fetchUserIds', () => {
    test('should find users', () => {
      const users = at.fetchUserIds(text);
      expect(users).toBeDefined();
      expect(users).toEqual(matched_users);
    });

    test('find 0 user', () => {
      const users = at.fetchUserIds('no users match in text @ @@@@ @ @@@ @哈哈 @ testuser1');
      expect(users.length).toBe(0);
    });
  });


  describe('sendMessageToMentionUsers', () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });

    test('should send message to all mention users', async () => {
      const text = `@${global.support.adminUser.name} @${global.support.normalUser2.name} @notexitstuser Hello BitBBS`;
      const atUserIds = [String(global.support.adminUser._id), String(global.support.normalUser2._id)];
      const receivedUserIds = [];

      jest.spyOn(message, 'sendAtMessage').mockImplementation(
        async (atUserId, authorId, topicId, replyId) => {
          receivedUserIds.push(String(atUserId));
        }
      );

      await at.sendMessageToMentionUsers(text, global.support.testTopic._id, global.support.normalUser._id);
      expect(receivedUserIds.sort()).toEqual(atUserIds.sort());
    });

    test('should not send message to no mention users', async () => {
      const text = 'abc no mentions';
      jest.spyOn(message, 'sendAtMessage').mockImplementation(async () => {
        throw new Error('should not call me');
      });

      await at.sendMessageToMentionUsers(text, global.support.testTopic._id, global.support.normalUser._id);
    });

    test('should not send at msg to author', async () => {
      const text = `@${global.support.normalUser.name} hello`;
      jest.spyOn(message, 'sendAtMessage').mockImplementation(() => {
        throw new Error('should not call me');
      });

      await at.sendMessageToMentionUsers(text, global.support.testTopic._id, global.support.normalUser._id);
    });
  });


  describe('textShowProcess', () => {
    test('just equal now', async () => {
      const text_show = await at.textShowProcess(text);
      expect(text_show).toBe(text);
    });
  });
});
