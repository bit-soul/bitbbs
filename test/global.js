import os from 'os';

export default async () => {
  os.hostname = ()=>"localhost";
  await import("../src/app.js");

  global.support = await import('./support.js');
  await global.support.initSupport();
}
