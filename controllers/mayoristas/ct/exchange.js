import axios from 'axios';

function getExchangeCt(req, res) {
  function getCtToken() {
    return new Promise((resolve, reject) => {
      var data = JSON.stringify({
        email: 'ohernandez@sirscom.com.mx',
        cliente: 'DFP0168',
        rfc: 'SIR99022694A',
      });

      var config = {
        method: 'post',
        url: 'http://187.210.141.12:3001/cliente/token',
        headers: {
          'Content-Type': 'application/json',
        },
        data: data,
      };

      axios(config)
        .then(function (response) {
          var token = response.data.token;
          resolve(token);
        })
        .catch(function (err) {
          reject(err);
          res.status(400).send({ message: `Not Ok pls help: ${err}` });
        });
    });
  }
  //----------------------------------------------------------------------------------------------
  function getUsdMxn(token) {
    return new Promise((resolve, reject) => {
      var config = {
        method: 'get',
        url: 'http://187.210.141.12:3001/pedido/tipoCambio',
        headers: {
          'x-auth': `${token}`,
        },
      };

      axios(config)
        .then(function (response) {
          var mxn = response.data['tipoCambio'];
          console.log(mxn);
          res.status(200).send({ tipoCambio: mxn });
        })
        .catch(function (err) {
          reject(err);
          res.status(400).send({ message: `Not Ok pls help in usd: ${err}` });
        });
    });
  }

  async function doYourThing() {
    var token = await getCtToken();
    await getUsdMxn(token);
  }
  doYourThing();
}

export default {
  getExchangeCt,
};
