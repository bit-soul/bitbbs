var utility = require('utility');
var path    = require('path');
var fs      = require('fs');

var s3sdk = require("@aws-sdk/client-s3");
var s3presigner = require("@aws-sdk/s3-request-presigner");

var s3_client = null;
if (global.config.s3_client && global.config.s3_client.secretAccessKey) {
  s3_client = new s3sdk.S3Client({
    region: global.config.s3_client.region,
    endpoint: global.config.s3_client.endpoint === '' ? null : global.config.s3_client.endpoint,
    credentials: {
      accessKeyId: global.config.s3_client.accessKeyId,
      secretAccessKey: global.config.s3_client.secretAccessKey,
    },
  });
}

async function createPresignedUrl(fileName, fileType, fileSize) {
    return await s3presigner.getSignedUrl(s3_client, 
        new s3sdk.PutObjectCommand({
            Bucket: global.config.s3_client.bucket,
            Key: fileName,
            ContentType: fileType,
            ContentLength: fileSize,
        }),
        { expiresIn: 3600, signableHeaders: new Set(['content-type', 'content-length']) });
};

var s3cloud = {
  presignedUrl: createPresignedUrl,
};


var local = {
  presignedurl: function () {
    return '/upload';
  },

  upload: function (file, options, callback) {
      var filename = options.filename;
    
      var newFilename = utility.md5(filename + String((new Date()).getTime())) +
        path.extname(filename);
    
      var upload_path = global.config.upload.path;
      var base_url    = global.config.upload.url;
      var filePath    = path.join(upload_path, newFilename);
      var fileUrl     = base_url + newFilename;
    
      file.on('end', function () {
        callback(null, {
          url: fileUrl
        });
      });
    
      file.pipe(fs.createWriteStream(filePath));
    },
}

if (s3_client) {
  module.exports = s3cloud;
} else {
  module.exports = local; 
}
