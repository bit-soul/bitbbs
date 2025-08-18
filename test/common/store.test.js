import fs from 'fs';
import path from 'path';
import config from '../config/index.js';
import store from '../../src/common/store.js';
import * as tools from '../../src/common/tools.js';

describe('common/store', () => {
  describe('local', () => {
    //test('should upload a file', async () => {
    //  //upload file
    //  const file = fs.createReadStream(path.join(__dirname, 'at.test.js'));
    //  const filename = 'at.test.js';
    //  const data = await store.upload(file, { filename });
    //  const newFilename = data.url.match(/([^\/]+\.js)$/)[1];
    //  const newFilePath = path.join(config.upload.path, newFilename);

    //  // Wait for file to be written
    //  await tools.sleep(1000);

    //  // Check if file exists and clean up
    //  expect(fs.existsSync(newFilePath)).toBe(true);
    //  fs.unlinkSync(newFilePath);
    //});
  });
});
