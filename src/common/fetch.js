import fetch from 'node-fetch';
import proxyagent from 'socks-proxy-agent';

import config from '../config/index.js';

var agent = null;
if (config.socks_proxy_url && config.socks_proxy_url !== '') {
  agent = new proxyagent.SocksProxyAgent(config.proxyurl);
}

async function fetchWithTimeout(url, options, timeout = 15000) {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('Request timed out: ' + url));
    }, timeout);
  });

  return Promise.race([fetch(url, options), timeoutPromise]);
}

export async function fetchData(url, method = 'GET', body = null) {
  try {
    const options = {
      agent: agent,
      method: method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
      },
    };
    if (method.toUpperCase() === 'POST' && body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetchWithTimeout(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return {
      code: 0,
      data: await response.text(),
    };
  } catch (err) {
    return {
      code: -999,
      mess: err.toString(),
    };
  }
}
