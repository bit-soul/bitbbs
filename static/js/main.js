//$(document).ready(function () {
document.addEventListener('DOMContentLoaded', function () {
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

  // data-loading-text="submitting..."
  $('.submit_btn').click(function () {
    $(this).button('loading');
  });

  // ads data
  $('.sponsor_outlink').click(function () {
    var $this = $(this);
    var label = $this.data('label');
    ga('send', 'event', 'banner', 'click', label, 1.00, {'nonInteraction': 1});
  });
});

function generateAtString(name, uid) {
  return '[@' + name.trim() + '](/user/' + uid.trim() + ')';
}

function twitterTextLength(str) {
  let count = 0;
  if(!str) {
    return 0;
  }
  for (const ch of str) {
    count += ch.charCodeAt(0) <= 0x7f ? 1 : 2;
  }
  return count;
}

function truncateTextForTwitter(str, max_length) {
  let truncatedContent = '';
  let count = 0;
  if(!str) {
    return '';
  }
  for (const ch of str) {
    const weight = ch.charCodeAt(0) <= 0x7f ? 1 : 2;
    if (count + weight > max_length) {
      truncatedContent += '...';
      break
    } 
    truncatedContent += ch;
    count += weight;
  }
  return truncatedContent;
}

function share2twitter(title, content, link, tab) {
const maxTweetLength = 200; //reverse 80 for others, link is 23 maxly because t.co shorted
title = truncateTextForTwitter(title, maxTweetLength);
const titleLength = twitterTextLength(title);
const maxContentLength = maxTweetLength - titleLength;
content = truncateTextForTwitter(content, maxContentLength);

var tweet;
if(content.length > 0) {
tweet = `💡 ${title} 

💬 ${content}

@bitsoul_xyz #bitbbs #bitsoul #${tab}
${link}`
} else {
tweet = `👻👻👻

💡 ${title} 

@bitsoul_xyz #bitbbs #bitsoul #${tab}
${link}`
}

window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`, '_blank');
}
