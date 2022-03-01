import axios from 'axios';
import Product from '../../../models/product.js';
import { chromium } from 'playwright';
import stringSimilarity from 'string-similarity';

function getCt(req, res) {
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
      res.status(200).send({ message: `Ok: ${token}` });
    })
    .catch(function (err) {
      console.log(`###### ${err} ###### \n ###### fallo en CT en el sku: ${productCode} ######`);
      res.status(400).send({ message: `Not Ok: ${err}` });
    });
}

function getProductCt(req, res) {
  var sku = req.params.sku;
  var productCode = sku;
  productCode = productCode.toUpperCase();

  (async () => {
    const browser = await chromium.launch({
      headless: true,
    });
    const page = await browser.newPage();

    var ta;
    var tb;
    var t;
    var scrapedSku;
    var scrapedModel;
    var cases;

    try {
      ta = Date.now();
      await page.goto('https://ctonline.mx/buscar/productos?b=' + productCode, {
        waitUntil: 'domcontentloaded',
      });
      tb = Date.now();
      t = tb - ta;
      await page.waitForSelector('body > div.ct-partial_header > div > a', {
        timeout: 1000,
      });
    } catch (err) {
      console.log(`###### ${err} ###### \n ###### fallo en CT en el sku: ${productCode} ######`);
      res.status(404).send({ message: err });
      await browser.close();
      return;
    }

    page.setDefaultNavigationTimeout(t + 1000);

    try {
      cases = await page.textContent(
        'body > div.container > div > div.col-md-9.col-sm-12.products-content-wrapper > div.ct-result-list > h3',
        { timeout: t + 2000 }
      );
      if (cases == 'No se encontraron resultados') {
        sku = productCode;
        cases = 0;
      } else {
        cases = 1;
      }
    } catch {
      cases = 1;
    }

    if (cases) {
      try {
        scrapedModel = await page.textContent(
          'body > div.container > div > div.col-md-9.col-sm-12.products-content-wrapper > div.ct-result-list > div:nth-child(1) > div > div.ct-description > h6'
        );

        scrapedSku = await page.textContent(
          'body > div.container > div > div.col-md-9.col-sm-12.products-content-wrapper > div.ct-result-list > div:nth-child(1) > div > div.ct-description > h7'
        );
      } catch (err) {
        console.log(`###### ${err} ###### \n ###### fallo en CT en el sku: ${productCode} ######`);
        res.status(404).send({ message: `No se encontro el producto` });
        return;
      }
    }
    await browser.close();
    try {
      var normalizedSku = scrapedSku.replace(/["!/(),.]/g, ' ');
      var match = stringSimilarity.compareTwoStrings(sku, normalizedSku);
      if (match < 0.8) {
        res.status(404).send({ message: `No se encontro el producto` });
        return;
      }
    } catch (err) {
      console.log(`###### ${err} ###### \n ###### fallo en CT en el sku: ${productCode} ######`);
      res.status(404).send({ message: `No se encontro el producto` });
      return;
    }

    //----------------------------------------------------------------------------------------------

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
            console.log(`###### ${err} ###### \n ###### fallo en CT en el sku: ${productCode} ######`);
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
            resolve(mxn);
          })
          .catch(function (err) {
            console.log(`###### ${err} ###### \n ###### fallo en CT en el sku: ${productCode} ######`);
            reject(err);
            res.status(400).send({ message: `Not Ok pls help in usd: ${err}` });
          });
      });
    }
    //----------------------------------------------------------------------------------------------
    function getCtProduct(token, mxn) {
      console.log('---------------------------CT---------------------------');
      return new Promise((resolve, reject) => {
        var config = {
          method: 'get',
          url: `http://187.210.141.12:3001/existencia/promociones/${scrapedModel}`,
          headers: {
            'x-auth': `${token}`,
          },
        };

        axios(config)
          .then(function (response) {
            var result = response.data;
            var price = result.precio;
            if (result.moneda == 'USD') {
              price *= mxn;
            }
            var total = 0;
            var storage = result.almacenes;
            var areaCode = ['30A', '34A', '35A', '40A', '43A', '47A'];
            var localStorage = [];
            for (var i = 0; i < storage.length; i++) {
              var keyNames = Object.keys(storage[i]);
              for (var j = 0; j < areaCode.length; j++) {
                if (keyNames.includes(areaCode[j])) {
                  localStorage.push(storage[i]);
                  total += storage[i][areaCode[j]];
                }
              }
            }
            localStorage.unshift({ total: total });

            var product = new Product();
            product.store = 'CT';
            product._id = product.store + '_' + productCode;
            product.sku = productCode;
            product.storeId = scrapedModel;
            product.price = price;
            product.stock = localStorage[0]['total'];
            product.storage = localStorage;

            console.log(product);

            product.save((err, newProduct) => {
              newProduct = product;
              resolve(product);
              if (err) {
                if (err.code == 11000) {
                  Product.findByIdAndUpdate(
                    product._id,
                    {
                      $set: {
                        price: price,
                        storage: localStorage,
                        storeId: scrapedModel,
                        stock: localStorage[0]['total'],
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
                resolve(product);
                res.status(200).send(newProduct);
              }
            });
          })
          .catch(function (err) {
            if (err) {
              console.log(`###### ${err} ###### \n ###### fallo en CT en el sku: ${productCode} ######`);
              reject(err);
              res.status(404).send({ message: `No existe el producto` });
            }
          });
      });
    }
    async function doYourThing() {
      var token = await getCtToken();
      var mxn = await getUsdMxn(token);
      await getCtProduct(token, mxn);
    }
    doYourThing();
  })();
}

export default {
  getCt,
  getProductCt,
};
