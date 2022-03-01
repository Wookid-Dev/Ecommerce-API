import 'dotenv/config';

import Product from '../../models/product.js';
import { chromium, firefox } from 'playwright';

function getIngram(req, res) {
  var sku = req.params.sku;
  var productCode = sku;
  productCode = productCode.toUpperCase();

  (async () => {
    console.log('---------------------------INGRAM---------------------------', productCode);
    var goOn = 0;
    var ms = Date.now();
    var mins = ms * 0.000017;

    var htmlCharacter = productCode.includes('%2F');
    if (htmlCharacter) {
      productCode = productCode.replace(/%2F/g, '/');
    }

    await Product.findById('INGRAM_' + productCode, (err, product) => {
      if (err) return res.status(508).send({ message: `Error al realizar la peticion: ${err}` });
      if (product == null || product.time == null) {
        goOn = 1;
      } else {
        var productTime = product.time;
        if (mins - productTime > 2880 || !product) {
          goOn = 1;
          console.log('scrapeada\n');
        } else {
          goOn = 0;
          console.log('base de datos\n');
          console.log(product);
          res.status(200).send(product);
        }
      }
    });

    if (goOn) {
      var storage = [];
      htmlCharacter = productCode.includes('/');
      if (htmlCharacter) {
        productCode = productCode.replace(/%2F/g, '%2F');
      }

      const browser = await firefox.launch({
        headless: true,
      });
      const page = await browser.newPage();

      try {
        await Promise.all([
          await page.goto(
            `https://mx.ingrammicro.com/Site/Login/IdpWidget?returnurl=https%3A%2F%2Fmx.ingrammicro.com%2FSite%2FSearch%23keywords%253a${productCode}`,
            { waitUntil: 'load', timeout: 15000 }
          ),
        ]);

        htmlCharacter = productCode.includes('%2F');
        if (htmlCharacter) {
          productCode = productCode.replace(/%2F/g, '/');
        }

        await page.fill('#okta-signin-username', `${process.env.USUARIO_INGRAM}`);
        await page.fill('#okta-signin-password', `${process.env.PASS_INGRAM}`);
        await page.keyboard.press('Enter', {
          waitUntil: 'domcontentloaded',
          timeout: 15000,
        });
      } catch (err) {
        console.log(`###### ${err} ###### \n ###### fallo en INGRAM en el sku: ${productCode} ######`);
        await browser.close();
        res.status(500).send({ message: 'Error al realizar la llamada' });
        return;
      }
      try {
        await page.waitForTimeout(10000);
        var searchResults1 = await page.$('#searchResults > meta:nth-child(2)');
        var searchResults2 = await page.$('#searchResults > meta:nth-child(1)');

        if (searchResults1) {
          var searchNumber = await page.getAttribute('#searchResults > meta:nth-child(2)', 'content');
          if (searchNumber == '0') {
            await browser.close();
            res.status(404).send({ message: 'Producto no encontrado' });
            return;
          }
        }

        if (searchResults2) {
          var searchNumber = await page.getAttribute('#searchResults > meta:nth-child(1)', 'content');
          if (searchNumber == '0') {
            await browser.close();
            res.status(404).send({ message: 'Producto no encontrado' });
            return;
          }
        }
      } catch (err) {
        console.log(`###### ${err} ###### \n ###### fallo en INGRAM en el sku: ${productCode} ######`);
        console.log(err);
        res.status(404).send({ message: 'Producto no encontrado' });
        await browser.close();
        return;
      }

      try {
        await page.waitForSelector(
          '#searchResults > div.grid-column.js-favorite-lines-container > div:nth-child(1) > div > div > div.col-md-6.col-sm-6 > div.p-line-slv-3.product-name > a > p',
          { waitUntil: 'domcontentloaded', timeout: 15000 }
        );
        var title = await page.$(
          '#searchResults > div.grid-column.js-favorite-lines-container > div:nth-child(1) > div > div > div.col-md-6.col-sm-6 > div.p-line-slv-3.product-name > a > p',
          { waitUntil: 'domcontentloaded', timeout: 15000 }
        );
        if (title) {
          title = await page.textContent(
            '#searchResults > div.grid-column.js-favorite-lines-container > div:nth-child(1) > div > div > div.col-md-6.col-sm-6 > div.p-line-slv-3.product-name > a > p'
          );
        } else {
          await browser.close();
          res.status(404).send({ message: `Producto no encontrado` });
          return;
        }
        var scrapedVpn = await page.textContent(
          '#searchResults > div.grid-column.js-favorite-lines-container > div:nth-child(1) > div > div > div.col-md-6.col-sm-6 > div:nth-child(3) > div.col-md-3.font-12.product.info.sku.padding-label-item.show',
          { waitUntil: 'domcontentloaded', timeout: 15000 }
        );
        var scrapedSku = await page.textContent(
          '#searchResults > div.grid-column.js-favorite-lines-container > div:nth-child(1) > div > div > div.col-md-6.col-sm-6 > div:nth-child(3) > div.col-md-3.font-12.product.info.vpn.padding-label-item.show',
          { waitUntil: 'domcontentloaded', timeout: 15000 }
        );
        var vpn = scrapedVpn.substring(scrapedVpn.indexOf(':') + 2);
        sku = scrapedSku.substring(scrapedSku.indexOf(':') + 2);
        await page.waitForTimeout(3000);
        var price = await page.textContent(`#BBB_${vpn}`, {
          waitUntil: 'domcontentloaded',
          timeout: 15000,
        });
        var download = await page.$('#login-mode-cntl > ul > li > a > span > span:nth-child(1)');
        var stock = await page.$(`#AAA_${vpn}`, { timeout: 10000 });

        if (stock) {
          stock = await page.textContent(`#AAA_${vpn}`, { timeout: 10000 });
        }
        if (download) {
          stock = 'Descargable';
        }

        if (stock != 'Agotado') {
          for (var i = 1; i <= 8; i++) {
            var location = await page.$(
              `#InStockInfoPopoverContent_${vpn} > table > tbody > tr:nth-child(${i}) > td.text-align-left`
            );
            if (location) {
              location = await page.textContent(
                `#InStockInfoPopoverContent_${vpn} > table > tbody > tr:nth-child(${i}) > td.text-align-left`
              );
              var inventory = await page.textContent(
                `#InStockInfoPopoverContent_${vpn} > table > tbody > tr:nth-child(${i}) > td:nth-child(2)`
              );
              storage.push({ Estado: location, Inventario: inventory });
            }
          }
        }
        await browser.close();
      } catch (err) {
        console.log(`###### ${err} ###### \n ###### fallo en INGRAM en el sku: ${productCode} ######`);
        console.log(err);
        await browser.close();
        res.status(404).send({ message: 'Error al intentar extraer informacion del producto' });
        return;
      }

      if (sku.indexOf(productCode) < 0 && vpn.indexOf(productCode) < 0) {
        res.status(404).send({ message: `No se encontro el producto` });
        return;
      }

      var z = stock.indexOf('Agotado');
      if (z < 0 && !isNaN(stock)) {
        stock = stock.split('(')[1];
        stock = stock.replace(/[^0-9.-]/g, '');
      }

      z = stock.indexOf('Disponible');
      if (z >= 0) {
        stock = 1;
      }

      var product = new Product();
      product.store = 'INGRAM';
      product._id = product.store + '_' + sku;
      product.name = title;
      product.sku = sku;
      product.storeId = vpn;
      product.price = price;
      product.stock = stock;
      product.delivery = '$80.00-$200.00';
      product.storage = storage;
      product.time = mins;

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
                  stock: stock,
                  time: product.time,
                  sku: sku,
                  storage: storage,
                  delivery: '$80.00-$200.00',
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
    }
  })();
}

export default {
  getIngram,
};
