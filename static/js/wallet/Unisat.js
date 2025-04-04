function iUniSat() {
  if (typeof window['unisat'] === 'undefined') {
    alert('Please install UniSat!');
    return false;
  }
  return true;
}

async function listenUniSat(handler) {
  if (typeof window['unisat'] !== 'undefined') {
    window['unisat'].on('accountsChanged', handler);
  }
}

async function connectUniSat() {
  if (iUniSat()) {
    try {
      const accounts = await window['unisat'].requestAccounts();
      if (!accounts || accounts.length == 0) {
        throw { message: 'Can not find any account!' };
      }
      return accounts[0];
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

async function signUniSat(mess, addr) {
  try {
    //connect unisat and check current address
    const address = await connectUniSat();
    if (!address) {
      return null;
    }
    if (address !== addr) {
      throw { message: 'Address mismatch with wallet!' };
    }

    //check in the mainnet
    const net = await window['unisat'].getNetwork();
    if (net != 'livenet') {
      throw { message: 'Please switch Unisat to Mainnet!' };
    }

    //sign message
    const sign = await window['unisat'].signMessage(mess);
    console.log('unisat sign: ', sign);

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
