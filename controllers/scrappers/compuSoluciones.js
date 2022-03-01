import 'dotenv/config';
import Product from '../../models/product.js';
import axios from 'axios';
import jwt from 'jsonwebtoken';

async function getCompuSoluciones(req, res) {
  var sku = req.params.sku;
  var productCode = sku;
  productCode = productCode.toUpperCase();

  var htmlCharacter = productCode.includes('%2F');
  if (htmlCharacter) {
    productCode = productCode.replace(/%2F/g, '/');
  }

  var today = new Date().getTime();
  today = today / 1000;
  today = parseInt(today);
  var tomorrow = today + 86400;

  var headers = {
    alg: 'HS256',
    typ: 'JWT',
    kid: 'DWu1lLYq4etfGLrHL1Vp',
  };
  var payload = {
    iat: today,
    exp: tomorrow,
  };
  var secret = `${process.env.SECRET_COMPUSOL}`;
  var token = jwt.sign(payload, secret, { header: headers });

  var config = {
    method: 'get',
    url: `https://fargate.siclik.mx:9009/v1/products/${sku}`,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  axios(config)
    .then(function (response) {
      var total = 0;
      var result = response.data;
      var sku = result.sku;
      var title = result.name;
      var price = result.pricing.listPrice;
      var storage = result.inventory.locations;

      for (let i = 0; i < storage.length; i++) {
        total = total + storage[i].quantity;
      }

      var product = new Product();
      product.store = 'COMPU-SOLUCIONES';
      product._id = product.store + '_' + sku;
      product.name = title;
      product.sku = sku;
      product.price = price;
      product.stock = total;
      product.delivery = '-';
      product.storage = storage;

      console.log(product);

      product.save((err, newProduct) => {
        newProduct = product;
        if (err) {
          if (err.code == 11000) {
            Product.findByIdAndUpdate(
              product._id,
              {
                $set: {
                  name: title,
                  price: price,
                  stock: total,
                  sku: sku,
                  storage: storage,
                  delivery: '-',
                },
              },
              { new: true },
              (err2, product) => {
                if (err2) {
                  res.status(500).send({
                    message: `Error al actualizar el producto: ${err2}`,
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
      console.log(`###### ${err} ###### \n ###### fallo en CompuSoluciones en el sku: ${productCode} ######`);
      res.status(404).send({ message: `Error al encontrar el producto:` });
    });
}

export default {
  getCompuSoluciones,
};
