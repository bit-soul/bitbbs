const multiline = require('multiline');

// about page
exports.about = async function (ctx, next) {
  await ctx.render('static/about', {
    pageTitle: 'About'
  });
};

exports.robots = async function (ctx, next) {
  ctx.type = 'text/plain';
  ctx.body = multiline(function () {;
/*
# See http://www.robotstxt.org/robotstxt.html for documentation on how to use the robots.txt file
#
# To ban all spiders from the entire site uncomment the next two lines:
# User-Agent: *
# Disallow: /
*/
  });
};
