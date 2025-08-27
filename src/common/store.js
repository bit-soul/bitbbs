import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';

import * as s3sdk from '@aws-sdk/client-s3';
import * as s3presigner from '@aws-sdk/s3-request-presigner';

import config from '../config/index.js';
import * as tools from './tools.js';


var s3_client = null;
if (config.s3_client && config.s3_client.secretAccessKey) {
  s3_client = new s3sdk.S3Client({
    region: config.s3_client.region,
    endpoint: config.s3_client.endpoint === '' ? null : config.s3_client.endpoint,
    credentials: {
      accessKeyId: config.s3_client.accessKeyId,
      secretAccessKey: config.s3_client.secretAccessKey,
    },
  });
}

async function createPresignedUrl(fileName, fileType, fileSize) {
  return await s3presigner.getSignedUrl(s3_client,
    new s3sdk.PutObjectCommand({
      Bucket: config.s3_client.bucket,
      Key: fileName,
      ACL: 'public-read',
      ContentType: fileType,
      ContentLength: fileSize,
    }),
    { expiresIn: 600, signableHeaders: new Set(['content-type', 'content-length']) });
}

var s3cloud = {
  presignedUrl: createPresignedUrl,
};


var local = {
  presignedurl: function () {
    return '/upload';
  },

  upload: async function (file, options) {
    const filename = options.filename;

    const newFilename =
      tools.md5(filename + String(Date.now())) + path.extname(filename);

    const base_url = config.upload.url;
    const upload_dir = config.upload.dir;
    const filePath = path.join(upload_dir, newFilename);
    const fileUrl = base_url + newFilename;

    await pipeline(file, fs.createWriteStream(filePath));

    return { url: fileUrl };
  },
};


let store;

if (s3_client) {
  store = s3cloud;
} else {
  store = local;
}

export default store;
