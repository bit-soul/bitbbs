exports.index = function (req, res, next) {
  var q = req.query.q;
  q = encodeURIComponent(q);
  res.redirect('https://www.google.com.hk/search?q=site:bbs.bitsoul.xyz+' + q);
};
