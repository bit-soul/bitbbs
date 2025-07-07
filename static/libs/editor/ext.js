var toolImage = null;

function _replaceSelection(cm, active, start, end) {
    var text;
    var startPoint = cm.getCursor('start');
    var endPoint = cm.getCursor('end');
    var end = end || '';
    if (active) {
        text = cm.getLine(startPoint.line);
        start = text.slice(0, startPoint.ch);
        end = text.slice(startPoint.ch);
        cm.setLine(startPoint.line, start + end);
    } else {
        text = cm.getSelection();
        cm.replaceSelection(start + text + end);
        startPoint.ch += start.length;
        endPoint.ch += start.length;
    }
    cm.setSelection(startPoint, endPoint);
    cm.focus();
}

function getState(cm, pos) {
    pos = pos || cm.getCursor('start');
    var stat = cm.getTokenAt(pos);
    if (!stat.type) return {};
    var types = stat.type.split(' ');
    var ret = {}, data, text;
    for (var i = 0; i < types.length; i++) {
        data = types[i];
        if (data === 'strong') {
        ret.bold = true;
        } else if (data === 'variable-2') {
        text = cm.getLine(pos.line);
        if (/^\s*\d+\.\s/.test(text)) {
            ret['ordered-list'] = true;
        } else {
            ret['unordered-list'] = true;
        }
        } else if (data === 'atom') {
        ret.quote = true;
        } else if (data === 'em') {
        ret.italic = true;
        }
    }
    return ret;
}

document.addEventListener('DOMContentLoaded', function () {
  (function(Editor, markdownit){
      // Set default options
      var md = new markdownit();
  
      md.set({
        html:         false,        // Enable HTML tags in source
        xhtmlOut:     false,        // Use '/' to close single tags (<br />)
        breaks:       true,        // Convert '\n' in paragraphs into <br>
        langPrefix:   'language-',  // CSS language prefix for fenced blocks
        linkify:      false,        // Autoconvert URL-like text to links
        typographer:  false,        // Enable smartypants and other sweet transforms
      });
  
      window.markdowniter = md;
  
      var toolbar = Editor.toolbar;
  
      var replaceTool = function(name, callback){
          for(var i=0, len=toolbar.length; i<len; i++){
              var v = toolbar[i];
              if(typeof(v) !== 'string' && v.name === name){
                  v.action = callback;
                  break;
              }
          }
      };
  
      var $body = $('body');
  
      //添加@工具
      var ToolAt = function(){
          var self = this;
      }
      ToolAt.prototype.bind = function(editor){
          var cm = editor.codemirror;
          var stat = getState(cm);
          var $input = $(editor.codemirror.display.input);
          $input.focus();
  
          var startPoint = cm.getCursor('start');
          var endPoint = cm.getCursor('start');
          endPoint.ch = endPoint.ch + 1;
  
          var input_dom = $input[0];
          var cursorPos = input_dom.selectionStart;
          input_dom.setRangeText('@');
          input_dom.selectionStart = input_dom.selectionEnd = cursorPos + 1;
  
          setTimeout(() => {
              $input.atwho('run');
              choose_cb = () => {
                  var startPoint2 = cm.getCursor('start');
                  startPoint2.ch = startPoint2.ch-1; 
                  var endPoint2 = cm.getCursor('end');
                  endPoint2.ch = endPoint2.ch-1;
                  cm.setSelection(startPoint, endPoint);
                  cm.replaceSelection('');
                  cm.setSelection(startPoint2, endPoint2);
              };
          }, 150);
      };
      var toolAt = new ToolAt();
      replaceTool('info', function(editor){
          toolAt.bind(editor);
      });
  
      //添加链接工具
      var ToolLink = function(){
          var self = this;
          this.$win = $([
              '<div class="modal hide fade" tabindex="-1" role="dialog" aria-labelledby="editorToolImageTitle" aria-hidden="true">',
                  '<div class="modal-header">',
                      '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>',
                      '<h3 id="editorToolImageTitle">Link</h3>',
                  '</div>',
                  '<div class="modal-body">',
                      '<form class="form-horizontal">',
                          '<div class="control-group">',
                              '<label class="control-label">Title</label>',
                              '<div class="controls">',
                                  '<input type="text" name="title" placeholder="Title">',
                              '</div>',
                          '</div>',
                          '<div class="control-group">',
                              '<label class="control-label">Link</label>',
                              '<div class="controls">',
                                  '<input type="text" name="link" value="http://" placeholder="Link">',
                              '</div>',
                          '</div>',
                      '</form>',
                  '</div>',
                  '<div class="modal-footer">',
                      '<button role="save">Comfirm</button>',
                  '</div>',
              '</div>'
          ].join('')).appendTo($body);
  
          this.$confirmBtn = this.$win.find('.modal-footer button').css({
              width: 80,
              height: 35,
              border: 0,
              margin: '0 auto',
              backgroundColor: '#666666',
              borderRadius: '4px',
              lineHeight: '35px',
              color: 'white',
          });
  
          this.$win.on('click', '[role=save]', function(){
              self.$win.find('form').submit();
          }).on('submit', 'form', function(){
              var $el = $(this);
              var title = $el.find('[name=title]').val();
              var link = $el.find('[name=link]').val();
  
              self.$win.modal('hide');
  
              var cm = self.editor.codemirror;
              var stat = getState(cm);
              _replaceSelection(cm, stat.link, '['+ title +']('+ link +')');
  
              $el.find('[name=title]').val('');
              $el.find('[name=link]').val('http://');
  
              return false;
          });
      };
  
      ToolLink.prototype.bind = function(editor){
          this.editor = editor;
          this.$win.modal('show');
      };
  
      var toolLink = new ToolLink();
      replaceTool('link', function(editor){
          toolLink.bind(editor);
      });
  
      //图片上传工具
      var ToolImage = function(){
          var self = this;
          this.$win = $([
              '<div class="modal hide fade" tabindex="-1" role="dialog" aria-labelledby="editorToolImageTitle" aria-hidden="true">',
                  '<div class="modal-header">',
                      '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>',
                      '<h3 id="editorToolImageTitle">Picture</h3>',
                  '</div>',
                  '<div class="modal-body">',
                      '<div class="upload-img">',
                          //'<!-- this input only run when file changed, so choose the same file no use -->'
                          '<input id="upload_file" onchange="uploadFile(this.files)" type="file" style="position:absolute; z-index: -1; visibility: hidden;" accept=".gif, .png, .jpg, .jpeg" />',
                          //'<!-- this label connected with input above, it implemented hide filename of input -->'
                          '<label for="upload_file" class="button">Upload</label>',
                          '<span class="tip"></span>',
                          '<div class="alert alert-error hide"></div>',
                      '</div>',
                  '</div>',
              '</div>'
          ].join('')).appendTo($body);
  
          this.$upload = this.$win.find('.upload-img').css({
              height: 50,
              padding: '60px 0',
              textAlign: 'center',
              border: '4px dashed#ddd'
          });
  
          this.$uploadBtn = this.$upload.find('.button').css({
              width: 86,
              height: 40,
              margin: '0 auto',
              backgroundColor: '#666666',
              borderRadius: '4px',
              lineHeight: '40px',
              fontWeight: 'bold',
              color: 'white',
          });
  
          this.$uploadTip = this.$upload.find('.tip').hide();
  
          this.file = false;
          this._csrf = $('[name=_csrf]').val();
      };
  
      ToolImage.prototype.removeFile = function(){
          //var self = this;
          this.file = false;
          this.$uploadBtn.show();
          this.$uploadTip.hide();
          document.getElementById('upload_file').value = '';
      };
  
      ToolImage.prototype.showFile = function(file){
          //var self = this;
          this.file = file;
          this.$uploadBtn.hide();
          this.$uploadTip.html('正在上传: ' + file.name).show();
          this.hideError();
      };
  
      ToolImage.prototype.showError = function(error){
          this.$upload.find('.alert-error').html(error).show();
      };
  
      ToolImage.prototype.hideError = function(error){
          this.$upload.find('.alert-error').hide();
      };
  
      ToolImage.prototype.showProgress = function(file, percentage){
          this.$uploadTip
              .html('正在上传: ' + file.name + ' ' + percentage + '%')
              .show();
      };
  
      ToolImage.prototype.bind = function(editor) {
          this.editor = editor;
          this.$win.modal('show');
      };
  
      toolImage = new ToolImage();
      replaceTool('image', function(editor){
          toolImage.bind(editor);
      });
  
      //当编辑器取得焦点时，绑定 toolImage；
      var createToolbar = Editor.prototype.createToolbar;
      Editor.prototype.createToolbar = function(items){
          createToolbar.call(this, items);
          var self = this;
          $(self.codemirror.display.input).on('focus', function(){
              toolImage.editor = self;
          });
      };
  
      //追加内容
      Editor.prototype.push = function(txt){
          var cm = this.codemirror;
          var line = cm.lastLine();
          cm.setLine(line, cm.getLine(line) + txt);
      };
  })(window.Editor, window.markdownit);
});

function uploadFile(files) {
  var file, name, size, type;
  if(files.length>0)
  {
      file = files[0];
      name = file.name;
      size = file.size;
      type = file.type;

      if(size > 1*1024*1024) {
        alert('file size too large, max size is 1MB');
        return;
      }

      var reader = new FileReader();
      reader.onload = upload;
      reader.readAsArrayBuffer(file);

      toolImage.showFile(file);
  }

  async function upload(event)
  {
      var url = `/presignedurl?filename=${name}&filetype=${type}&filesize=${size}`;
      var file_data = event.target.result;

      try {
        const response = await fetch(encodeURI(url), { method: 'GET' });
        const data = await response.json();
        
        if (data.code === 0) {
          try {
            const uploadResponse = await fetch(data.data.uploadurl, {
              method: 'PUT',
              headers: { 'Content-Type': type, 'Content-Length': size },
              body: file_data,
            });

            if(uploadResponse.status === 200) {
              toolImage.$win.modal('hide');
              var cm = toolImage.editor.codemirror;
              var stat = getState(cm);
              _replaceSelection(cm, stat.image, '!['+ file.name +']('+ data.data.readurl +')');
              toolImage.removeFile();
            } else {
              alert('status: ' + uploadResponse.status);
              toolImage.removeFile();
            }
          } catch (uploadError) {
            if (uploadError.status === 403) {
              alert('Please login to up');
            }
            toolImage.removeFile();
          }
        } else {
          alert(data.mess);
          toolImage.removeFile();
        }
      } catch (error) {
        if (error.status === 403) {
          alert('Please login to up');
        }
        toolImage.removeFile();
      }
  }
}