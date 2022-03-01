import 'dotenv/config';

import Product from '../../models/product.js';
import { firefox } from 'playwright';

function getAzerty(req, res) {
  var sku = req.params.sku;
  var productCode = sku;
  productCode = productCode.toUpperCase();
  (async () => {
    console.log('---------------------------AZERTY---------------------------', productCode);
    var goOn = 0;
    var ms = Date.now();
    var mins = ms * 0.000017;
    var htmlCharacter = productCode.includes('%2F');
    if (htmlCharacter) {
      productCode = productCode.replace(/%2F/g, '/');
    }
    await Product.findById('AZERTY_' + productCode, (err, product) => {
      if (err) return res.status(508).send({ message: `Error al realizar la peticion: ${err}` });
      if (product == null || product.time == null) {
        goOn = 1;
      } else {
        var productTime = product.time;
        if (mins - productTime > 0.1 || !product) {
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
      htmlCharacter = productCode.includes('/');
      if (htmlCharacter) {
        productCode = productCode.replace(/%2F/g, '%2F');
      }
      var storage = [];
      const browser = await firefox.launch({
        headless: true,
      });
      const page = await browser.newPage();

      try {
        await page.goto(`https://store.azerty.com.mx/login.xba`, {
          waitUntil: 'domcontentloaded',
        });
        await page.fill('#username', `${process.env.USUARIO_AZERTY}`);
        await page.fill('#password', `${process.env.PASS_AZERTY}`);
        await page.click(
          'body > div > div:nth-child(3) > div.row > div > div:nth-child(3) > div.span4.well.pull-right > form > fieldset > button',
          {
            waitUntil: 'domcontentloaded',
          }
        );
      } catch (err) {
        console.log(`###### ${err} ###### \n ###### fallo en AZERTY en el sku: ${productCode} ######`);
        await browser.close();
        res.status(500).send({ message: 'Error al realizar la llamada' });
        return;
      }
      try {
        await page.fill(
          'body > div > div:nth-child(2) > div > div > div > div > div > ul.nav.pull-right > form > input.search-query.span2',
          productCode
        );
        htmlCharacter = productCode.includes('%2F');
        if (htmlCharacter) {
          productCode = productCode.replace(/%2F/g, '/');
        }
        await page.keyboard.press('Enter');
        await page.waitForTimeout(5000);
        var filter = await page.$('body > div > div:nth-child(3) > div.span9 > h2');
        if (filter) {
          filter = await page.textContent('body > div > div:nth-child(3) > div.span9 > h2');
          var a = filter.indexOf(`No se encontraron productos buscando ${productCode}`);
          if (a >= 0) {
            console.log(`Error: No se encontró el producto: ${productCode}`);
            await browser.close();
            res.status(404).send({ message: `Error: No se encontró el producto: ${productCode}` });
            return;
          }
        }
      } catch (err) {
        console.log(`###### ${err} ###### \n ###### fallo en AZERTY en el sku: ${productCode} ######`);
        await browser.close();
        res.status(500).send({ message: `Error al intentar obtener producto` });
        return;
      }

      try {
        var cdmx = await page.textContent(
          'body > div > div:nth-child(3) > div.span9 > div:nth-child(1) > div:nth-child(4) > table > tbody > tr:nth-child(3) > td:nth-child(1)',
          { timeout: 10000 }
        );
        var mty = await page.textContent(
          'body > div > div:nth-child(3) > div.span9 > div:nth-child(1) > div:nth-child(4) > table > tbody > tr:nth-child(3) > td:nth-child(2)',
          { timeout: 10000 }
        );
        await page.click('body > div > div:nth-child(3) > div.span9 > div:nth-child(1) > div.span5 > a ', {
          timeout: 10000,
        });
        var title = await page.textContent('body > div > div:nth-child(3) > div.span9 > div:nth-child(2) > div > h3', {
          timeout: 10000,
        });
        var dolar = await page.textContent(
          'body > div > div:nth-child(1) > div.span8 > div.row > div.span4.customer_service > h4',
          { timeout: 10000 }
        );
        var scrapedSku = await page.textContent(
          'body > div > div:nth-child(3) > div.span9 > div:nth-child(4) > div.span5 > div.span5 > address > span:nth-child(4)',
          { timeout: 10000 }
        );
        var price = await page.textContent(
          'body > div > div:nth-child(3) > div.span9 > div:nth-child(4) > div.span5 > div:nth-child(2) > h3 > strong',
          { timeout: 10000 }
        );
        await browser.close();
      } catch (err) {
        console.log(`###### ${err} ###### \n ###### fallo en AZERTY en el sku: ${productCode} ######`);
        await browser.close();
        res.status(500).send({ message: `Error al intentar obtener producto` });
        return;
      }

      try {
        var check = scrapedSku.indexOf(productCode);
        if (check < 0) {
          res.status(404).send({ message: 'Error al intentar obtener producto' });
          await browser.close();
          return;
        }
        storage.push({ cmdx: cdmx }, { mty: mty });
        var stock = parseFloat(cdmx) + parseFloat(mty);
        dolar = dolar.replace(/[^0-9.-]/g, '');
        dolar = parseFloat(dolar);
        scrapedSku = scrapedSku.replace(/(\r\n|\n|\r|\s)/gm, '');
        var middleDash = scrapedSku.indexOf('-');
        var sku = scrapedSku.substring(middleDash + 1, scrapedSku.length);
        var currency = price.indexOf('USD');
        price = price.replace(/[^0-9.-]/g, '');
        price = parseFloat(price).toFixed(2);
        if (currency >= 0) {
          price *= dolar;
        }
      } catch (err) {
        console.log(`###### ${err} ###### \n ###### fallo en AZERTY en el sku: ${productCode} ######`);
        res.status(500).send({ message: `No se encontro el producto` });
        await browser.close();
        return;
      }
      var product = new Product();
      product.store = 'AZERTY';
      product._id = product.store + '_' + sku;
      product.name = title;
      product.sku = sku;
      product.storeId = scrapedSku;
      product.price = price;
      product.stock = stock;
      product.delivery = '-';
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
    }
  })();
}

export default {
  getAzerty,
};
