import 'dotenv/config';

import axios from 'axios';
import Product from '../../models/product.js';

function getProductTeam(req, res) {
  var sku = req.params.sku;
  var productCode = sku;
  productCode = productCode.toUpperCase();
  var array = [];

  function getTeamToken() {
    return new Promise((resolve, reject) => {
      var data = JSON.stringify({
        username: `${process.env.USUARIO_TEAM}`,
        password: `${process.env.PASS_TEAM}`,
      });

      var config = {
        method: 'post',
        url: 'https://apisteam.teamnet.com.mx/api/Autenticacion',
        headers: {
          username: `${process.env.USUARIO_TEAM}`,
          password: `${process.env.PASS_TEAM}`,
          'Content-Type': 'application/json',
        },
        data: data,
      };

      axios(config)
        .then(function (response) {
          var token = response.data.token;
          console.log(token);
          resolve(token);
        })
        .catch(function (err) {
          console.log(`${err}\n fallo en TEAM en el sku: ${productCode}`);
          res.status(500).send({
            message: `Error al actualizar el producto: ${err}`,
          });
          reject(err);
        });
    });
  }
  //----------------------------------------------------------------------------------------------
  function getProduct(token) {
    console.log('---------------------------TEAMNET---------------------------');
    var config = {
      method: 'get',
      url: `https://apisteam.teamnet.com.mx/api/EnsambleH/${productCode}?username=conexionws@sirscom.com.mx`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    };

    axios(config)
      .then(function (response) {
        var result = response.data;

        var title = result.name;
        sku = result.sku;
        var storeId = result.internalid;
        var price = result.precio_lista;
        var storage = result.inventario;
        var stock = result.total_stock;

        var product = new Product();
        product.store = 'TEAM';
        product._id = product.store + '_' + sku;
        product.name = title;
        product.sku = sku;
        product.storeId = storeId;
        product.price = price;
        product.storage = storage;
        product.stock = stock;

        console.log(product);

        product.save((err, newProduct) => {
          newProduct = product;
          if (err) {
            if (err.code == 11000) {
              Product.findByIdAndUpdate(
                product._id,
                {
                  $set: {
                    price: price,
                    stock: stock,
                    sku: sku,
                    storage: storage,
                  },
                },
                { new: true },
                (err, product) => {
                  if (err) {
                    res.status(500).send({
                      message: `Error al actualizar el producto: ${err}`,
                    });
                  } else {
                    res.status(200).send(product);
                  }
                }
              );
            } else {
              if (err) {
                res.status(500).send({ message: `Error al realizar la peticion: ${err}` });
              }
            }
          } else {
            res.status(200).send(newProduct);
          }
        });
      })
      .catch(function (err) {
        // console.log(err);
        res.status(404).send({ message: 'No se encontro el producto' });
      });
  }

  async function doYourThing() {
    var token = await getTeamToken();
    await getProduct(token);
  }
  doYourThing();
}

export default {
  getProductTeam,
};
