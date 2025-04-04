async function connectWallet(wallet) {
  let address = null;
  switch (wallet) {
    case 'UniSat':
      address = await connectUniSat();
      break;
    case 'Xverse':
      address = await connectXverse();
      break;
    default:
      alert('wallet error: ' + wallet);
      break;
  }
  return address;
}

async function signMessage(mess, wallet, addr) {
  let sign = null;
  switch (wallet) {
    case 'UniSat':
      sign = await signUniSat(mess, addr);
      break;
    case 'Xverse':
      sign = await signXverse(mess, addr);
      break;
    default:
      alert('wallet error: ' + wallet);
  }
  return sign ? sign.sign : null;
}
