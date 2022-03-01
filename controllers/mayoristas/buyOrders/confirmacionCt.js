import axios from 'axios';

function postConfirmationCt(req, res) {
  let orderId = req.body.numeroOrden;

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

  function orderConfirmation(token) {
    return new Promise((resolve, reject) => {
      var data = JSON.stringify({
        folio: `${orderId}`, //5063998
      });
      var config = {
        method: 'post',
        url: 'http://187.210.141.12:3001//pedido/confirmar',
        headers: {
          'Content-Type': 'application/json',
          'x-auth': `${token}`,
        },
        data: data,
      };

      axios(config)
        .then(function (response) {
          var order = response.data;
          console.log(response.data);
          res.status(200).send({ order });
          resolve(response.data);
        })
        .catch(function (err) {
          console.log(err);
          reject(err);
          res.status(400).send({ message: `Error: ${err}` });
        });
    });
  }

  async function doYourThing() {
    var token = await getCtToken();
    await orderConfirmation(token);
  }
  doYourThing();
}

export default {
  postConfirmationCt,
};
