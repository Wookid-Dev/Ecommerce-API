import axios from 'axios';

function postBuyOrderCT(req, res) {
  let orderId = req.body.numeroOrden;
  let warehouse = req.body.almacen;
  let payment = req.body.tipoPago;
  let name = req.body.nombre;
  let address = req.body.direccion;
  let addressNumber = req.body.exterior;
  let suburb = req.body.colonia;
  let state = req.body.estado;
  let city = req.body.ciudad;
  let postalCode = req.body.codigoPostal;
  let phoneNumber = req.body.telefono;
  let quantity = req.body.cantidad;
  let sku = req.body.sku;
  let price = req.body.precio;
  let currency = req.body.moneda;

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

  function postOrder(token) {
    return new Promise((resolve, reject) => {
      var data = JSON.stringify({
        idPedido: `${orderId}`, //5063998
        almacen: `${warehouse}`, //01a
        tipoPago: `${payment}`, //04
        envio: [
          {
            nombre: `${name}`,
            direccion: `${address}`,
            entreCalles: '---------',
            noExterior: `${addressNumber}`,
            colonia: `${suburb}`,
            estado: `${state}`,
            ciudad: `${city}`,
            codigoPostal: `${postalCode}`,
            telefono: `${phoneNumber}`,
          },
        ],
        producto: [
          {
            cantidad: `${quantity}`,
            clave: `${sku}`,
            precio: `${price}`,
            moneda: `${currency}`,
          },
        ],
      });
      var config = {
        method: 'post',
        url: 'http://187.210.141.12:3001/pedido',
        headers: {
          'Content-Type': 'application/json',
          'x-auth': `${token}`,
        },
        data: data,
      };

      axios(config)
        .then(function (response) {
          var order = response.data[0];
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
    await postOrder(token);
  }
  doYourThing();
}

export default {
  postBuyOrderCT,
};
