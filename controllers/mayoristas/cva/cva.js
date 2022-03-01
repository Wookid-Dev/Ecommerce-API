import 'dotenv/config';

import axios from 'axios';
import Product from '../../../models/product.js';
import parser from 'fast-xml-parser';
import { chromium } from 'playwright';

function getProductCva(req, res) {
  var product = new Product();
  var sku = req.params.sku;
  var productCode = sku;
  productCode = productCode.toUpperCase();
  var htmlCharacter = productCode.includes('/');
  if (htmlCharacter) {
    productCode = productCode.replace(/[/]/g, '%2F');
  }

  function getScrappedSku() {
    return new Promise((resolve) => {
      (async () => {
        const browser = await chromium.launch({
          headless: true,
        });
        const page = await browser.newPage();
        page.setDefaultNavigationTimeout(200000);

        var htmlCharacter = productCode.indexOf('/');
        if (htmlCharacter > 0) {
          productCode = productCode.replace(/[/]/g, '%2F');
        }

        console.log(productCode);

        try {
          await page.goto(`https://www.grupocva.com/me-iniciar-sesion.php`, {
            waitUntil: 'load',
          });
          await page.fill('#usuario_me', `${process.env.USUARIO_ME}`);
          await page.fill('#pass', `${process.env.PASS_ME}`);
          await page.click(
            'body > div.cont-window > div > div.cont-login > div > div > form > input[type=submit]:nth-child(4)',
            {
              waitUntil: 'networkidle',
            }
          );

          await page.fill('#busqueda_libre', productCode);
          await page.waitForLoadState('networkidle');
          await page.click('#search-filtros > div > button');
          await page.waitForLoadState('networkidle');

          htmlCharacter = productCode.includes('%2F');
          if (htmlCharacter) {
            productCode = productCode.replace(/%2F/g, '/');
          }
          var check = await page.textContent('#get-pedidos');
          var isItThere = check.indexOf('No se encontraron resultados de tu búsqueda.');
          if (isItThere >= 0) {
            await browser.close();
            res.status(404).send({ message: 'No se encontro el producto' });
            return;
          }

          var title = await page.textContent(
            '#get-pedidos > div > div > div > div > div.mdl-card__supporting-text.is-height-desc.d-inline-flex.justify-content-md-center.align-items-center',
            { timeout: 10000 }
          );

          var price = await page.textContent(
            '#get-pedidos > div > div > div > div > form > div.mdl-card__actions.mdl-card__actions_product-price.mdl-card--border.d-inline-flex.justify-content-md-center.align-items-center > div.mdl-card__product-price.d-inline-block.mr-3 > div > span'
          );
          await browser.close();
        } catch (err) {
          console.log(`###### ${err} ###### \n ###### fallo en CVA en el sku: ${productCode} ######`);
          await browser.close();
          res.status(404).send({ message: `Error no se encontro el producto` });
          return;
        }

        try {
          var yesSir = title.indexOf(productCode);
          price = price.replace(/[^0-9.-]/g, '');
          price = parseFloat(price);

          if (title != null) {
            var yesSir = title.indexOf(productCode);
            if (yesSir >= 0) {
              console.log('Probablemente existe');
              var index = /[a-z]/i.exec(title).index;
              title = title.substring(index, title.length);
              title = title.replace(/\t/g, '');
              var chekSku = title.split(' ', 5)[2];
              console.log(chekSku);
              var isItThere = chekSku.indexOf(productCode);
              if (isItThere < 0) {
                console.log('Nope no esta');
                res.status(404).send({ message: 'No se encontro el producto' });
                return;
              }
              console.log('Ok');

              product.store = 'CVA';
              product._id = product.store + '_' + productCode;
              product.name = title;
              product.sku = productCode;
              product.price = price;
              product.stock = 'No hay existencias';
            }
          }

          resolve(product);
          res.status(200).send(product);
        } catch (err) {
          console.log(`###### ${err} ###### \n ###### fallo en CVA en el sku: ${productCode} ######`);
          await browser.close();
          res.status(404).send({ message: `Error al encontrar el producto` });
          return;
        }
      })();
    });
  }
  //----------------------------------------------------------------------------------------------

  function getProduct(product) {
    return new Promise((resolve, reject) => {
      console.log(product);
      htmlCharacter = productCode.includes('%23');
      if (htmlCharacter) {
        productCode = productCode.replace(/%23/g, '#');
      }
      var config = {
        method: 'get',
        url: `http://www.grupocva.com/catalogo_clientes_xml/lista_precios.xml?cliente=28911&marca=%25&grupo=%25&clave=%25&codigo=${productCode}&MonedaPesos=1`,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      axios(config)
        .then(function (response) {
          var result = parser.parse(response.data);
          console.log(result.articulos.item);

          var price = result.articulos.item.precio;
          var stock = result.articulos.item.disponible;
          if (price == null && stock == null) {
            price = result.articulos.item[0].precio;
            stock = result.articulos.item[0].disponible;
          }
          if (stock < 0) {
            stock = 0;
          }

          product.store = 'CVA';
          product._id = product.store + '_' + productCode;
          product.name = result.articulos.item.descripcion;
          product.sku = productCode;
          product.storeId = result.articulos.item.clave;
          product.price = price;
          product.stock = stock;

          resolve(product);

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
                      storeId: result.articulos.item.clave,
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
          reject(err);
        });
    });
  }

  async function doYourThing() {
    console.log('---------------------------CVA---------------------------');
    try {
      await getProduct(product);
    } catch (err) {
      if (err) {
        console.log('Scrapping');
        await getScrappedSku();
      }
    }
  }
  doYourThing();
}

export default {
  getProductCva,
};
