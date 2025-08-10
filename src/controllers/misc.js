const fs = require("fs");

const midAuth = require('../middlewares/auth');
const tools   = require('../common/tools');
const store   = require('../common/store');
const logger  = require('../common/logger')

const Router    = require('@koa/router');
const validator = require('validator');
const lodash    = require('lodash');

const router = new Router();

router.get('/presignedurl',
  midAuth.userRequired,
  async (ctx, next) => {
    const fileName = ctx.query.filename;
    const fileType = ctx.query.filetype;
    const fileSize = parseInt(ctx.query.filesize, 10);

    if (fileSize > 1 * 1024 * 1024) {
      ctx.body = {
        code: -1,
        mess: 'file size too large, max size is 1MB',
      };
      return;
    }

    const userId = ctx.session.user_id;
    const formatDate = tools.getFormattedDate();
    const formatTime = tools.getFormattedTime();
    const file_name = global.config.s3_client.prefix + userId + '/' + formatDate + '/' + formatTime + '_' + fileName
    const url = await store.presignedUrl(file_name, fileType, fileSize);
    const uploadurl = new URL(url);
    uploadurl.hostname = new URL(global.config.s3_client.proxypoint).hostname;
    uploadurl.searchParams.set('bucketname', global.config.s3_client.bucket);

    ctx.body = {
      code: 0,
      data: {
        readurl: global.config.s3_client.readpoint + '/' + file_name,
        uploadurl: uploadurl.toString(),
      },
    };
  }
);

//todo 参考bootkoa
router.post('/upload',
  midAuth.userRequired,
  async (ctx, next) => {
    const file = ctx.request.files.file; // "file" 是上传字段名
    if (!file) {
      ctx.body = {
        success: false,
        msg: 'No file uploaded.'
      };
      return;
    }

    const maxSize = global.config.file_limit;
    if (file.size > maxSize) {
      ctx.body = {
        success: false,
        msg: 'File size too large. Max is ' + maxSize
      };
      return;
    }

    const stream = fs.createReadStream(file.path);
    const result = await store.upload(stream, { filename: file.name });

    ctx.body = {
      success: true,
      url: result.url,
    };
  }
);

router.get('/test', async (ctx, next) => {
  ctx.state.user ="abc";
  return await ctx.render('misc/test');
  //return await ctx.render('test', {layout:false});
  //return ctx.body='abc';
});

module.exports = router;