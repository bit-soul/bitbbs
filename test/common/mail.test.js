import * as mail from '../../src/common/mail.js';

describe('common/mail', () => {
  describe('sendActiveMail', () => {
    test('should ok', () => {
      mail.sendActiveMail('shyvo1987@gmail.com', 'token', 'jacksontian');
    });
  });

  describe('sendResetPassMail', () => {
    test('should ok', () => {
      mail.sendResetPassMail('shyvo1987@gmail.com', 'token', 'jacksontian');
    });
  });
});
