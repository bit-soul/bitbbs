function initAdvanceBtn() {
  var $me = $(this);
  var action = $me.attr('action');
  var params = {
    user_id: '<%= user._id %>',
    _csrf: '<%- csrf %>'
  };
  $.post('/user/' + action, params, function (data) {
    if (data.status === 'success') {
      if (action === 'set_advance') {
        $me.html('cancel advance');
        $me.attr('action', 'cancel_advance');
      } else {
        $me.html('set as advance');
        $me.attr('action', 'set_advance');
      }
    }
  }, 'json');
}

function initBlockBtn() {
  var $me = $(this);
  var action = $me.attr('action');
  var params = {
    _csrf: '<%- csrf %>',
    action: action
  };
  if (action === 'set_block' && !confirm('sure to block this user')) {
    return;
  }
  $.post('/user/<%- user._id %>/block', params, function (data) {
    if (data.status === 'success') {
      if (action === 'set_block') {
        $me.html('cancel block');
        $me.attr('action', 'cancel_block');
      } else if (action === 'cancel_block') {
        $me.html('block user');
        $me.attr('action', 'set_block');
      }
    }
  }, 'json');
}

function initDeleteAllBtn() {
  var $me = $(this);
  var params = {
    _csrf: '<%- csrf %>',
  };
  if (!confirm('sure to delete?')) {
    return;
  }
  $.post('/user/<%- user._id %>/delete_all', params, function (data) {
    if (data.status === 'success') {
      alert('success');
    }
  }, 'json');
}

function initFollowBtn() {
  var $me = $(this);
  var action = $me.attr('action');
  var params = {
    follow_id: '<%= user._id %>',
    _csrf: '<%- csrf %>'
  };
  $.post('/user/' + action, params, function (data) {
    if (data.status === 'success') {
      var $btns = $('.follow_btn');
      if (action === 'follow') {
        $btns.html('unFollow');
        $btns.attr('action', 'un_follow');
      } else {
        $btns.html('Follow');
        $btns.attr('action', 'follow');
      }
      $btns.toggleClass('btn-success');
    }
  }, 'json');
}
