const helper = require('../../src/common/helper');

describe('common/helper', () => {
  describe('markdown', () => {
    test('should render code inline', () => {
      const text = '`var a = 1;`';
      const rendered = helper.markdown(text);
      expect(rendered).toBe('<div class="markdown-text"><p><code>var a = 1;</code></p>\n</div>');
    });

    test('should render fence', () => {
      const text = "```js\nvar a = 1;\n```";
      const rendered = helper.markdown(text);
      expect(rendered).toBe('<div class="markdown-text"><pre class="prettyprint language-js"><code>var a = 1;\n</code></pre></div>');
    });

    test('should render code block', () => {
      const text = '    var a = 1;';
      const rendered = helper.markdown(text);
      expect(rendered).toBe('<div class="markdown-text"><pre class="prettyprint"><code>var a = 1;</code></pre></div>');
    });
  });

  describe('escapeBiog', () => {
    test('should escape content', () => {
      const signature = '我爱北京<script>alert(1)\n</script>';
      const escaped = helper.escapeBiog(signature);
      expect(escaped).toBe('我爱北京&lt;script&gt;alert(1)<br>&lt;/script&gt;');
    });
  });

  describe('#tabName', () => {
    test('should translate', () => {
      expect(helper.tabName('share')).toBe('Share');
    });
  });
});
