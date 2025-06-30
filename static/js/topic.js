function initEditor(){
  const lodash = _;
  var editor = new Editor({
    status: []
  });
  var $el = $(this);

  editor.render(this);
  $(this).data('editor', editor);

  var $input = $(editor.codemirror.display.input);
  $input.keydown(function(event){
    if (event.keyCode === 13 && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      $el.closest('form').submit();
    }
  });

  //get all reply users name and id
  var allUsers = $('.reply_author').map(function (idx, ele) {
    var name = $(ele).text().trim();
    var href = $(ele).attr('href');
    var userId = href ? href.split('/user/')[1] : null;
    return { name: name, id: userId };
  }).toArray();
  var currentUserName = $('.user_card .user_name').text().trim();
  var currentUserId = $('.user_card .user_name').attr('href').split('/user/')[1];
  allUsers.push({ name: currentUserName, id: currentUserId });
  allUsers = lodash.uniq(allUsers, function(user) {
    return user.name + user.id;
  });

  // config at
  var codeMirrorGoLineUp = CodeMirror.commands.goLineUp;
  var codeMirrorGoLineDown = CodeMirror.commands.goLineDown;
  var codeMirrorNewlineAndIndent = CodeMirror.commands.newlineAndIndent;
  $input.atwho({
    at: '@',
    data: allUsers,
    tpl: "<li onclick='atwhoclicked(event)' data-value='[@${name}](/user/${id})'>${name}</li>",
    insert_tpl: "<span id='${id}'>${atwho-data-value}</span>",
  })
  .on('shown.atwho', function () {
    CodeMirror.commands.goLineUp = lodash.noop;
    CodeMirror.commands.goLineDown = lodash.noop;
    CodeMirror.commands.newlineAndIndent = lodash.noop;
  })
  .on('hidden.atwho', function () {
    CodeMirror.commands.goLineUp = codeMirrorGoLineUp;
    CodeMirror.commands.goLineDown = codeMirrorGoLineDown;
    CodeMirror.commands.newlineAndIndent = codeMirrorNewlineAndIndent;
  });
}

function commentReply(event) {
  var $btn = $(event.currentTarget);
  var parent = $btn.closest('.reply_area');
  var editorWrap = parent.find('.reply2_form');
  if (editorWrap.is(':visible')) {
    editorWrap.hide('fast');
  } else {
    parent.find('.reply2_area').prepend(editorWrap);
    var textarea = editorWrap.find('textarea.editor');
    var name = $btn.closest('.author_content').find('.reply_author').text().trim();
    var userId = $btn.closest('.author_content').find('.reply_author').attr('href').split('/user/')[1];
    var editor = textarea.data('editor');
    editorWrap.show('fast', function () {
      var cm = editor.codemirror;
      cm.focus();
      if(cm.getValue().indexOf(generateAtString(name, userId)) < 0) {
        editor.push(generateAtString(name, userId)+' ');
      }
    });
  }
}

function deleteReply(event, csrf) {
  var $me = $(event.currentTarget);
  if (confirm('sure to delete this reply?')) {
    var reply_id = null;
    if ($me.hasClass('delete_reply_btn')) {
      reply_id = $me.closest('.reply_item').attr('reply_id');
    }
    if ($me.hasClass('delete_reply2_btn')) {
      reply_id = $me.closest('.reply2_item').attr('reply_id');
    }
    var data = {
      reply_id: reply_id,
      _csrf: csrf,
    };
    $.post('/reply/' + reply_id + '/delete', data, function (data) {
      if (data.status === 'success') {
        if ($me.hasClass('delete_reply_btn')) {
          $me.closest('.reply_item').remove();
        }
        if ($me.hasClass('delete_reply2_btn')) {
          $me.closest('.reply2_item').remove();
        }
      }
    }, 'json');
  }
  return false;
}

function upReply() {
  var $this = $(this);
  var replyId = $this.closest('.reply_area').attr('reply_id');
  $.ajax({
    url: '/reply/' + replyId + '/up',
    method: 'POST',
  }).done(function (data) {
    if (data.success) {
      var currentCount = Number($this.prev('.up-count').text().trim()) || 0;
      if (data.action === 'up') {
        $this.prev('.up-count').text(currentCount + 1);
        $this.html('<use xlink:href="/static/img/icons.svg#thumbs-up-s" />');
      } else if (data.action === 'down') {
        $this.prev('.up-count').text(currentCount - 1);
        $this.html('<use xlink:href="/static/img/icons.svg#thumbs-up-o" />');
      } else {
        ;
      }
    } else {
      alert(data.message);
    }
  }).fail(function (xhr) {
    if (xhr.status === 403) {
      alert('Please login to up');
    }
  });
}

function markTopic(event, topic_id, csrf) {
  var $me = $(event.currentTarget);
  var action = $me.attr('action');
  var data = {
    topic_id: topic_id,
    _csrf: csrf,
  };
  var $countSpan = $('.topic-mark-count');
  $.post('/topic/' + action, data, function (data) {
    if (data.status === 'success') {
      if (action == 'mark') {
        $me.val('unmark');
        $me.attr('action', 'unmark');
      } else {
        $me.val('mark');
        $me.attr('action', 'mark');
      }
      $me.toggleClass('span-success');
    }
  }, 'json');
}

function deleteTopic() {
  var topicId = $(this).data('id');
  if (topicId && confirm('sure to delete this topic?')) {
    $.post('/topic/' + topicId + '/delete', { _csrf: $('#_csrf').val() }, function (result) {
      if (!result.success) {
        alert(result.message);
      } else {
        location.href = '/';
      }
    });
  }
  return false;
}

function initReplyHistory() {
  var timer = null; //dialog delay timer
  var $repliesHistory = $('.replies_history');
  var $repliesHistoryContent = $repliesHistory.find('.inner_content');

  $repliesHistory.hide();
  $repliesHistory.on('mouseenter', function(){
    clearTimeout(timer);
  }).on('mouseleave', function(){
    $repliesHistory.fadeOut('fast');
  });

  if ($('.reply2_item').length === 0) {
    $('#content').on('mouseenter', '.reply_content a', function (e) {
      clearTimeout(timer);
      var $this = $(this);
      if ($this.text()[0] === '@') {
        var offset = $this.offset();
        var width = $this.width();
        var mainOffset = $('#main').offset();
        $repliesHistory.css('left', offset.left-mainOffset.left+width+10); // magic number
        $repliesHistory.css('top', offset.top-mainOffset.top-10); // magic number
        $repliesHistory.css({
          'z-index': 1,
        });
        $repliesHistoryContent.empty();
        var chats = [];
        var replyToId = $this.closest('.reply_item').attr('reply_to_id');
        while (replyToId) {
          var $replyItem = $('.reply_item[reply_id=' + replyToId + ']');
          var replyContent = $replyItem.find('.reply_content').text().trim();
          if (replyContent.length > 0) {
            chats.push([
              $($replyItem.find('.user_avatar').html()).attr({
                height: '30px',
                width: '30px',
              }),
              (replyContent.length>300?replyContent.substr(0,300)+'...':replyContent), // reply content
              '<a href="#'+replyToId+'" class="scroll_to_original" title="go to source">↑</a>'
            ]);
          }
          replyToId = $replyItem.attr('reply_to_id');
        }
        if(chats.length > 0) {
          chats.reverse();

          $repliesHistoryContent.append('<div class="title">Dialog</div>');
          chats.forEach((pair, idx) => {
            var $chat = $repliesHistoryContent.append('<div class="item"></div>');
            $chat.append(pair[0]); //icon
            $chat.append($('<span>').text(pair[1])); //content 
            $chat.append(pair[2]); //source anchor
          });
          $repliesHistory.fadeIn('fast');
        }else{
          $repliesHistory.hide();
        }
      }
    }).on('mouseleave', '.reply_content a', function (e) {
      timer = setTimeout(function(){
        $repliesHistory.fadeOut('fast');
      }, 500);
    });
  }
}

function initImgPreviewModal() {
  var $previewModal = $('#preview-modal');
  var $previewImage = $('#preview-image');
  var $body = $('body');

  $(document).on('click', '.markdown-text img', function(e) {
    var $img = $(this);
    if ($img.parent('a').length > 0) {
      return; // img wrapped by a, need not to show preview
    }
    showModal($img.attr('src'));
  });

  $previewModal.on('click', hideModal);

  $previewModal.on('hidden.bs.modal', function() {
    $body.css('overflow-y', 'scroll'); // recover body overflow-y when modal is hidden
  })

  $previewModal.on('shown.bs.modal', function() {
    $previewModal.scrollTop(0);
  })

  function showModal(src) {
    $previewImage.attr('src', src);
    $previewModal.modal('show');
    $body.css('overflow-y', 'hidden'); // prevent body scroll when modal is shown
  }

  function hideModal() {
    $previewModal.modal('hide');
  }
}
