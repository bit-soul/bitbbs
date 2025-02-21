var utility = require('utility');
var path    = require('path');
var fs      = require('fs');

var s3sdk = require("@aws-sdk/client-s3");
var s3presigner = require("@aws-sdk/s3-request-presigner");

//s3 client
var s3_client = null;
if (global.config.s3_client && global.config.s3_client.secretAccessKey !== 'your secret key') {
  s3_client = new s3sdk.S3Client({
    region: global.config.s3_client.region,
    endpoint: global.config.s3_client.endpoint === '' ? null : global.config.s3_client.endpoint,
    credentials: {
      accessKeyId: global.config.s3_client.accessKeyId,
      secretAccessKey: global.config.s3_client.secretAccessKey,
    },
  });
}

async function createPresignedUrl(bucketName, key) {
  const command = new s3sdk.PutObjectCommand();
    return await s3presigner.getSignedUrl(s3_client, 
        new s3sdk.PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            ContentType: 'image/jpeg',
            ContentLength: 12699,
        }),
        { expiresIn: 3600, signableHeaders: new Set(['content-type', 'content-length']) });
};


var local = {
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

module.exports = s3_client || local;
