import Product from '../../models/product.js';
import { firefox, chromium } from 'playwright';
import Normalized from '../modifiers/normalize.js';

function getIntercompras(req, res) {
  console.log('---------------------------INTERCOMPRAS---------------------------', productCode);
  var sku = req.params.sku;
  var productCode = sku;
  productCode = productCode.toUpperCase();
  (async () => {
    var goOn = 0;
    var ms = Date.now();
    var mins = ms * 0.000017;
    var htmlCharacter = productCode.includes('%2F');
    if (htmlCharacter) {
      productCode = productCode.replace(/%2F/g, '/');
    }
    await Product.findById('INTERCOMPRAS_' + productCode, (err, product) => {
      if (err) return res.status(508).send({ message: `-Error al realizar la peticion: ${err}` });
      if (product == null || product.time == null) {
        goOn = 1;
      } else {
        var productTime = product.time;
        if (mins - productTime > 30 || !product) {
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

      const browser = await firefox.launch({
        headless: true,
      });
      const page = await browser.newPage();
      page.setDefaultNavigationTimeout(200000);

      await page.route('**/*', (route) => {
        return route.request().resourceType() === 'stylesheet' ||
          route.request().resourceType() === 'image' ||
          route.request().resourceType() === 'font' ||
          route.request().resourceType() === 'other'
          ? route.abort()
          : route.continue();
      });

      console.log(productCode);

      try {
        await page.goto(`https://intercompras.com/advanced_search_result.php?keywords=${productCode + '~'}`, {
          waitUntil: 'domcontentloaded',
          timeout: 10000,
        });

        htmlCharacter = productCode.includes('%2F');
        if (htmlCharacter) {
          productCode = productCode.replace(/%2F/g, '/');
        }

        var check = await page.textContent('#bodyContent > div > h1');
        check = check.indexOf('No se encontraron productos que coincidan con su búsqueda.');
        if (check >= 0) {
          await browser.close();
          res.status(404).send({ message: `No se encontro el producto` });
          return;
        }
        var title = await page.textContent(
          '#bodyContent > div > div.divContentProductInfo > div.divProductListInfoProductFlex > div.divProductListTitle > a',
          { timeout: 10000 }
        );
        var sku = await page.textContent(
          '#bodyContent > div > div.divContentProductInfo > div.divProductListInfoProductFlex > div.divProductListFeature',
          { timeout: 10000 }
        );
        var price = await page.$(
          '#bodyContent > div > div.divContentProductInfo > div.divProductListInfoProductFlex > div.divProductListPriceContainer > div.divProductListPrice',
          { timeout: 10000 }
        );
        if (!price) {
          price = await page.textContent(
            '#bodyContent > div > div.divContentProductInfo > div.divProductListInfoProductFlex > div.divProductListPriceContainer > div.divProductListNormalPrice',
            { timeout: 10000 }
          );
        }
        price = await page.textContent(
          '#bodyContent > div > div.divContentProductInfo > div.divProductListInfoProductFlex > div.divProductListPriceContainer > div.divProductListPrice',
          { timeout: 10000 }
        );
        var stock = await page.textContent(
          '#bodyContent > div > div.divContentProductInfo > div.divProductListInfoProductFlex > div.divProductListPriceContainer > div.divProductListAvailable > span',
          { timeout: 10000 }
        );
        var delivery = await page.textContent(
          '#bodyContent > div > div.divContentProductInfo > div.divProductListInfoProductFlex > div.divProductListPriceContainer > div.divProductListShipping',
          { timeout: 10000 }
        );

        await browser.close();
      } catch (err) {
        console.log(`###### ${err} ###### \n ###### fallo en INTERCOMPRAS en el sku: ${productCode} ######`);
        await browser.close();
        res.status(404).send({ message: `Error: No se encontro el producto: ${productCode}` });
        return;
      }

      try {
        sku = sku.split('Modelo: ')[1];
        sku = sku.replace(/\s/gm, '');

        price = price.replace(/[^0-9.-]/g, '');

        var plus = delivery.indexOf('+');
        var freeDelivery = delivery.indexOf('Gratis');
        if (plus >= 0) {
          delivery = delivery.split('+ ')[1];
          delivery = delivery.replace(/[^0-9.-]/g, '');
        }
        if (freeDelivery >= 0) {
          delivery = 'Envío Estándar Gratis';
        }
      } catch (err) {
        console.log(`###### ${err} ###### \n ###### fallo en INTERCOMPRAS en el sku: ${productCode} ######`);
        await browser.close();
        res.status(500).send({ message: `Error al manejar la informacion del producto` });
        return;
      }

      var product = new Product();
      product.store = 'INTERCOMPRAS';
      product._id = product.store + '_' + sku;
      product.name = Normalized.normalized(title);
      product.sku = sku;
      product.price = price;
      product.stock = stock;
      product.delivery = delivery;
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
                  price: price,
                  stock: stock,
                  delivery: delivery,
                  time: product.time,
                  sku: sku,
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
  getIntercompras,
};
