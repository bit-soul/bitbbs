$(document).ready(function () {
  var windowHeight = $(window).height();
  var $backtotop = $('#backtotop');
  var top = windowHeight - $backtotop.height() - 200;


  function moveBacktotop() {
    $backtotop.css({ top: top, right: 0});
  }

  function footerFixBottom() {
      if($(document.body).height() < windowHeight){
          $("#footer").addClass('fix-bottom');
      }else{
          $("#footer").removeClass('fix-bottom');
      }
  }

  $backtotop.click(function () {
    $('html,body').animate({ scrollTop: 0 });
    return false;
  });
  $(window).scroll(function () {
    var windowHeight = $(window).scrollTop();
    if (windowHeight > 200) {
      $backtotop.fadeIn();
    } else {
      $backtotop.fadeOut();
    }
  });

  moveBacktotop();
  footerFixBottom();
  $(window).resize(moveBacktotop);
  $(window).resize(footerFixBottom);

  $('.topic_content a,.reply_content a').attr('target', '_blank');

  // pretty code
  prettyPrint();

  // data-loading-text="提交中"
  $('.submit_btn').click(function () {
    $(this).button('loading');
  });

  // 广告的统计信息
  $('.sponsor_outlink').click(function () {
    var $this = $(this);
    var label = $this.data('label');
    ga('send', 'event', 'banner', 'click', label, 1.00, {'nonInteraction': 1});
  });
});

function generateAtString(name, uid) {
  return '[@' + name.trim() + '](/user/' + uid.trim() + ')';
}

function share2twitter(title, link, tab) {
var tweet = 
`👻👻👻

💬 ${title} 

@bitsoul_xyz #bitbbs #bitsoul #${tab}
${link}`

window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`, '_blank');
}