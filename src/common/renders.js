const lodash     = require('lodash');
const MarkdownIt = require('markdown-it');
const validator  = require('validator');
const jsxss      = require('xss');

const md = new MarkdownIt();

md.set({
  html:         false,        // Enable HTML tags in source
  xhtmlOut:     false,        // Use '/' to close single tags (<br />)
  breaks:       false,        // Convert '\n' in paragraphs into <br>
  linkify:      true,        // Autoconvert URL-like text to links
  typographer:  true,        // Enable smartypants and other sweet transforms
});

md.renderer.rules.fence = function (tokens, idx) {
  var token    = tokens[idx];
  var language = token.info && ('language-' + token.info) || '';
  language     = validator.escape(language);

  return '<pre class="prettyprint ' + language + '">'
    + '<code>' + validator.escape(token.content) + '</code>'
    + '</pre>';
};

md.renderer.rules.code_block = function (tokens, idx /*, options*/) {
  var token    = tokens[idx];

  return '<pre class="prettyprint">'
    + '<code>' + validator.escape(token.content) + '</code>'
    + '</pre>';
};

var myxss = new jsxss.FilterXSS({
  onIgnoreTagAttr: function (tag, name, value, isWhiteAttr) {
    // let prettyprint work
    if (tag === 'pre' && name === 'class') {
      return name + '="' + jsxss.escapeAttrValue(value) + '"';
    }
  }
});

exports.markdown = function (text) {
  return '<div class="markdown-text">' + myxss.process(md.render(text || '')) + '</div>';
};

exports.escapeBiog = function (biog) {
  return biog.split('\n').map(function (p) {
    return lodash.escape(p);
  }).join('<br>');
};

exports.staticFile = function (filePath) {
  if (filePath.indexOf('http') === 0 || filePath.indexOf('//') === 0) {
    return filePath;
  }
  return global.config.site_static_host + filePath;
};

exports.tabName = function (tab) {
  var pair = lodash.find(global.config.tabs, function (pair) {
    return pair[0] === tab;
  });
  if (pair) {
    return pair[1];
  }
};

exports.proxy = function (url) {
  return url;
  // some resource need proxy to avoid gtw
  // return '/agent?url=' + encodeURIComponent(url);
};
