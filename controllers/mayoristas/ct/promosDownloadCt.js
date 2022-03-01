import axios from 'axios';

function getPromoCt(req, res) {
  (async () => {
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
            console.log('Ok');
            resolve(token);
          })
          .catch(function (err) {
            reject(err);
            res.status(400).send({ message: `Not Ok pls help: ${err}` });
          });
      });
    }
    //----------------------------------------------------------------------------------------------
    function getProducts(token) {
      return new Promise((resolve, reject) => {
        var config = {
          method: 'get',
          url: `http://187.210.141.12:3001/existencia/promociones `,
          headers: {
            'x-auth': `${token}`,
          },
        };

        axios(config)
          .then(function (response) {
            let result = response.data;
            // console.log(result);
            res.status(200).send({ result });
          })
          .catch(function (err) {
            if (err) {
              reject(err);
              res.status(404).send({ message: `No existe el producto` });
            }
          });
      });
    }
    async function doYourThing() {
      var token = await getCtToken();
      await getProducts(token);
    }
    doYourThing();
  })();
}

export default {
  getPromoCt,
};
