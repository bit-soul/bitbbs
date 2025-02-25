var fetch = require('node-fetch');
var proxyagent = require('socks-proxy-agent');

var agent = null;
if (global.config.socks_proxy_url && global.config.socks_proxy_url !== '') {
  agent = new proxyagent.SocksProxyAgent(global.config.socks_proxy_url);
}

export async function fetchWithTimeout(url, options, timeout) {
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
    const json = await response.json();
    if (!json || (typeof json.code).toLowerCase() !== 'number') {
      throw new Error('API error! invalid json.code');
    }
    return json;
  } catch (err) {
    console.log(err);
    return {
      code: -999,
      mess: err.toString(),
    };
  }
}
