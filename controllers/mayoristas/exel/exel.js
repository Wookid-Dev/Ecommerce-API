import 'dotenv/config';

import axios from 'axios';
import Product from '../../../models/product.js';
import parser from 'fast-xml-parser';

async function getProductExel(req, res) {
  let sku = req.params.sku;
  var productCode = sku;
  var array = [];
  productCode = productCode.toUpperCase();

  var goOn = 0;
  var ms;
  var mins;
  ms = Date.now();
  mins = ms * 0.000017;

  var htmlCharacter = productCode.includes('%2F');
  if (htmlCharacter) {
    productCode = productCode.replace(/%2F/g, '/');
  }

  await Product.findById('EXEL_' + productCode, (err, product) => {
    if (err) return res.status(508).send({ message: `Error al realizar la peticion: ${err}` });
    if (product == null || product.time == null) {
      goOn = 1;
    } else {
      var productTime = product.time;
      if (mins - productTime > 2880 || !product) {
        goOn = 1;
        console.log('Llamada\n');
      } else {
        console.log('---------------------------EXEL---------------------------');
        goOn = 0;
        console.log('base de datos\n');
        console.log(product);
        res.status(200).send(product);
        return;
      }
    }
  });

  if (goOn) {
    var data =
      '<?xml version="1.0" encoding="utf-8"?>' +
      '<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">' +
      '<soap12:Body>' +
      '<Obtener_Productos_PrecioYExistencia xmlns="http://ws.exel.com.mx:8181/">' +
      `<Usuario>${process.env.USUARIO_EXEL}</Usuario>` +
      `<Password>${process.env.PASS_EXEL}</Password>` +
      '<Codigos>' +
      `<string>${productCode}</string>` +
      '<string>string</string>' +
      '</Codigos>' +
      '</Obtener_Productos_PrecioYExistencia>' +
      '</soap12:Body>' +
      '</soap12:Envelope>';

    var config = {
      method: 'post',
      url: 'http://ws.exel.com.mx:8181/xL4.asmx',
      headers: {
        'Content-Type': 'text/xml',
      },
      data: data,
    };

    axios(config)
      .then(function (response) {
        console.log('---------------------------EXEL---------------------------');
        var storeId;
        var price;
        var stock;

        var xml = parser.parse(response.data);
        var str =
          xml['soap:Envelope']['soap:Body']['Obtener_Productos_PrecioYExistenciaResponse'][
            'Obtener_Productos_PrecioYExistenciaResult'
          ];

        var result = JSON.parse(str);
        var length = result.length;

        if (length <= 0) {
          res.status(500).send({ message: `No hay productos disponibles` });
          return;
        }

        for (var i = 0; i < length; i++) {
          array.push({
            storeId: result[i].id_producto,
            city: result[i].id_localidad,
            price: result[i].precio,
            stock: result[i].existencia,
          });
        }
        console.log(array);
        if (array[1]) {
          var storeId = array[1].storeId;
          var price = array[1].price;
          var stock = array[1].stock;
        } else {
          var storeId = array[0].storeId;
          var price = array[0].price;
          var stock = array[0].stock;
        }

        let product = new Product();
        product.store = 'EXEL';
        product._id = product.store + '_' + productCode;
        product.sku = productCode;
        product.storeId = storeId;
        product.price = price;
        product.stock = stock;
        product.time = mins;
        product.storage = array;

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
                    storeId: storeId,
                    time: product.time,
                    storage: array,
                  },
                },
                { new: true },
                (err2, product) => {
                  if (err2)
                    res.status(500).send({
                      message: `Error al actualizar el producto: ${err2}`,
                    });
                  res.status(200).send(product);
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
        console.log(`###### ${err} ###### \n ###### fallo en EXEL en el sku: ${productCode} ######`);
        res.status(404).send({ message: `Error al encontrar el producto:` });
      });
  }
}

export default {
  getProductExel,
};
