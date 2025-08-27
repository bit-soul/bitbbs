//fix run node18 in win7
import os from 'os';
os.hostname = ()=>"localhost";

export default async () => {
  await import("../src/app.js");

  global.support = await import('./support.js');
  await global.support.initSupport();
}
