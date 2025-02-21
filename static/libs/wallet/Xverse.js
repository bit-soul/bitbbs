function iXverse() {
  if (!(window['XverseProviders'] && window['XverseProviders'].BitcoinProvider)) {
    alert('Please install Xverse!');
    return false;
  }
  return true;
}

async function listenUniSat(handler) {
  if (window['XverseProviders'] && window['XverseProviders'].BitcoinProvider) {
    window['XverseProviders'].BitcoinProvider.addListener('accountChange', handler);
  }
}

async function connectXverse() {
  if (iXverse()) {
    try {
      const response = await window['XverseProviders'].BitcoinProvider.request('wallet_connect', null);
      if (response.result && response.result.addresses && response.result.addresses.length > 0) {
        const paymentAddressItem = response.result.addresses.find(
          (address) => address.purpose === 'payment'
        );
        const ordinalsAddressItem = response.result.addresses.find(
          (address) => address.purpose === 'ordinals'
        );
        return ordinalsAddressItem.address;
      } else {
        if (response.error && response.error.code === -32000 /*RpcErrorCode.USER_REJECTION*/) {
          throw { message: 'User rejected the request.' }
        } else {
          throw { message: 'something went wrong!' }
        }
      }
    } catch (err) {
      if (err.message) {
        alert(err.message);
      } else {
        alert(err)
      }
      return null;
    }
  }
  return null;
}

async function signXverse(mess, addr) {
  try {
    //xverse needn't connect, because it will connect when sign
    //xverse needn't check address, because it select address by parameter
  
    //check in the mainnet
    const net = await window['XverseProviders'].BitcoinProvider.request('wallet_getNetwork', null);
    if (net.status === 'error' || !(net.result && net.result.bitcoin && net.result.bitcoin.name === 'Mainnet')) {
      throw { message: 'Please switch Xverse to Mainnet!' };
    }

    //sign message
    let sign = null;
    const response = await window['XverseProviders'].BitcoinProvider.request("signMessage", {
      address: addr,
      message: mess,
    });
    if (response.result && response.result.signature) {
      sign = response.result.signature;
      console.log('xverse sign: ', sign);
    } else {
      if (response.error && response.error.code === -32000 /*RpcErrorCode.USER_REJECTION*/) {
        throw { message: 'User rejected the request.' }
      } else {
        throw { message: 'something went wrong!' }
      }
    }

    return {
      addr: addr,
      sign: sign,
      mess: mess,
    };
  } catch (err) {
    if (err.message) {
      alert(err.message);
    } else {
      alert(err)
    }
    return null;
  }
}
