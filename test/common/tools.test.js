const tools = require('../../src/common/tools');

describe('common/tools', () => {
  describe('formatDate', () => {
    test('should format date', () => {
      const result = tools.formatDate(new Date(0));
      expect(result).toMatch(/1970\-01\-01 0\d:00/);
    });

    test('should format date friendly', () => {
      const result = tools.formatDate(new Date(), true);
      expect(result).toBe('几秒前');
    });
  });
});
