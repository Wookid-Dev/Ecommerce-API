import 'dotenv/config';

import axios from 'axios';
import Product from '../../models/product.js';
import { chromium, firefox } from 'playwright';

function getProductIntcomex(req, res) {
  console.log('---------------------------INTCOMEX---------------------------');
  var sku = req.params.sku;
  var productCode = sku;
  productCode = productCode.toUpperCase();
  var array = [];

  var htmlCharacter = productCode.indexOf('/');
  if (htmlCharacter > 0) {
    productCode = productCode.replace(/[/]/g, '%2F');
  }

  (async () => {
    const browser = await firefox.launch({
      headless: false,
    });
    const page = await browser.newPage();

    try {
      await page.goto(`https://store.intcomex.com/es-XMX/Products/ByKeyword?term=${productCode}&typeSearch=&r=true`, {
        waitUntil: 'domcontentloaded',
        timeout: 10000,
      });
      htmlCharacter = productCode.indexOf('%2F');
      if (htmlCharacter > 0) {
        productCode = productCode.replace(/%2F/g, '/');
      }

      var x = await page.$(
        '#detail-products-content > div.col-sm-8.col-md-9.col-xs-12 > div > div.grid-product-row.col-xs-12 > div',
        { timeout: 5000 }
      );
      if (!x) {
        await browser.close();
        res.status(404).send({ message: `Error: no se encontro el producto` });
        return;
      }
      var z = await page.textContent(
        '#detail-products-content > div.col-sm-8.col-md-9.col-xs-12 > div > div.grid-product-row.col-xs-12 > div'
      );
      await browser.close();
    } catch (err) {
      console.log(`###### ${err} ###### \n ###### fallo en INTCOMEX en el sku: ${productCode} ######`);
      await browser.close();
      res.status(500).send({ message: `Error realizar la busqueda` });
      return;
    }
    try {
      var a = z.replace(/(\r\n|\n|\r)/gm, '');
      var b = a.replace(/ +(?= )/g, '');
      var c = b.replace(/\t/g, '');
      var d = c.indexOf(productCode);
      if (d < 0) {
        console.log('No esta');
        res.status(404).send({ message: `Error: no se encontro el producto` });
        return;
      }
      var g = productCode.length;
      var n = c.indexOf('MPN:');
      var m = c.indexOf('SKU:');
      for (var i = m; i < n + g + 5; i++) {
        array.push(c[i]);
      }
      var joinedArray = array.join('');
      joinedArray = joinedArray.replace(/\s/g, '');

      var skuSplit = joinedArray.split('|')[0];
      var mpnSplit = joinedArray.split('|')[1];

      if (skuSplit) {
        var storeId = skuSplit.replace(/SKU:/g, '');
      }
      if (mpnSplit) {
        var sku = mpnSplit.replace(/MPN:/g, '');
      }
      if (sku == undefined) {
        sku = storeId;
      }

      await browser.close();
    } catch (err) {
      console.log(`###### ${err} ###### \n ###### fallo en INTCOMEX en el sku: ${productCode} ######`);
      res.status(500).send({ message: `Error al realizar la busqueda` });
      return;
    }

    //----------------------------------------------------------------------------------------------

    function getToken() {
      return new Promise((resolve) => {
        var sha256 = require('js-sha256');
        var date = new Date().toISOString().split('.')[0] + 'Z';
        var apiKey = `${process.env.APIKEY_INT}`;
        var privateKey = `${process.env.PRIVATEKEY_INT}`;
        var signature = sha256(`${apiKey},${privateKey},${date}`);
        var token = `bearer apiKey=${apiKey}&utcTimeStamp=${date}&signature=${signature}`;
        resolve(token);
      });
    }

    //----------------------------------------------------------------------------------------------

    function getProduct(token) {
      return new Promise((resolve, reject) => {
        console.log('---------------------------INTCOMEX---------------------------');
        console.log(token);
        var config = {
          method: 'get',
          url: `https://intcomex-prod.apigee.net/v1/getproduct?sku=${storeId}`,
          headers: {
            Authorization: token,
            'Content-Type': 'application/json',
            Host: 'intcomex-prod.apigee.net',
          },
        };

        axios(config)
          .then(function (response) {
            console.log(response);
            let result = response.data;

            let product = new Product();
            product.store = 'INTCOMEX';
            product._id = product.store + '_' + sku;
            product.name = result.Description;
            product.sku = sku;
            product.storeId = storeId;
            product.price = result.Price.UnitPrice + '' + result.Price.CurrencyId;
            product.stock = result.InStock;

            console.log(product);

            product.save((err, newProduct) => {
              newProduct = product;

              if (err) {
                if (err.code == 11000) {
                  Product.findByIdAndUpdate(
                    product._id,
                    {
                      $set: {
                        price: result.Price.UnitPrice + '' + result.Price.CurrencyId,
                        stock: result.InStock,
                      },
                    },
                    { new: true },
                    (err2, product) => {
                      if (err2) {
                        res.status(500).send({ message: `Error al actualizar el producto: ${err2}` });
                      }
                      res.status(200).send(product);
                    }
                  );
                } else {
                  if (err) {
                    reject(err);
                    res.status(500).send({ message: `Error al realizar la peticion: ${err}` });
                  }
                }
              } else {
                res.status(200).send(newProduct);
              }
            });
          })
          .catch(function (err) {
            console.log(`###### ${err} ###### \n ###### fallo en INTCOMEX en el sku: ${productCode} ######`);
            if (err) res.status(404).send({ message: `Error al encontrar el producto` });
          });
      });
    }

    async function doYourThing() {
      var token = await getToken();
      await getProduct(token);
    }
    doYourThing();
  })();
}

export default {
  getProductIntcomex,
};
