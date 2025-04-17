async function wallet_login(wallet) {
  let address = await connectWallet(wallet);
  if (address == null) {
    return;
  }

  var login_date = new Date();
  var login_mess = "Sign To Login BitBBS "
      + login_date.getUTCFullYear().toString().padStart(4, '0') + "/"
      +(login_date.getUTCMonth()+1).toString().padStart(2, '0') + "/"
      + login_date.getUTCDate().toString().padStart(2, '0') + " "
      + login_date.getUTCHours().toString().padStart(2, '0') + ":"
      + login_date.getUTCMinutes().toString().padStart(2, '0') + ":"
      + login_date.getUTCSeconds().toString().padStart(2, '0') + ""
      + " UTC"
      + "";
  var login_sign = await signMessage(login_mess, wallet, address);
  if(login_sign == null) {
    return;
  }

  $.ajax({
    url: "/wallet_login",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify({ 
        addr: address,  
        sign: login_sign,
        time: login_date.getTime(),
    }),
    success: function(response) {
        var res = JSON.parse(response);
        if(res.code == 1) {
          window.location.href = '/';
        } else {
          alert(res.mess);
        }
    },
    error: function(xhr, status, error) {
        alert(error);
    }
  });
}

async function get_authkey() {
  $.ajax({
    url: "/get_authkey",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify({ 
        maxage: 1000 * 60 * 60 * 24 * 30,
    }),
    success: function(response) {
        var res = JSON.parse(response);
        if(res.code == 0) {
          alert("Please use it in 10-minutes, authkey: " + res.data);
        } else {
          alert(res.mess);
        }
    },
    error: function(xhr, status, error) {
        alert(error);
    }
  });
}

async function authkey_login() {
  var authkey = prompt("Please enter your authkey:"); 
  $.ajax({
    url: "/authkey_login",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify({ 
        authkey: authkey,
    }),
    success: function(response) {
        var res = JSON.parse(response);
        if(res.code == 1) {
          window.location.href = '/';
        } else {
          alert(res.mess);
        }
    },
    error: function(xhr, status, error) {
        alert(error);
    }
  });
}