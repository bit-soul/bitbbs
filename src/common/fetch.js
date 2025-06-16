const fetch = require('node-fetch');
const proxyagent = require('socks-proxy-agent');

var agent = null;
if (global.config.socks_proxy_url && global.config.socks_proxy_url !== '') {
  agent = new proxyagent.SocksProxyAgent(global.config.proxyurl);
}

async function fetchWithTimeout(url, options, timeout = 15000) {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('Request timed out: ' + url));
    }, timeout);
  });

  return Promise.race([fetch(url, options), timeoutPromise]);
}

exports.fetchData = async function (url, method = 'GET', body = null) {
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
