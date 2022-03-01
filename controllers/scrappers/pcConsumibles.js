import Product from '../../models/product.js';
import { firefox, chromium } from 'playwright';
import Normalized from '../modifiers/normalize.js';

function getPcConsumibles(req, res) {
  var sku = req.params.sku;
  var productCode = sku;
  productCode = productCode.toUpperCase();

  (async () => {
    console.log('---------------------------PC-CONSUMIBLES---------------------------', productCode);
    goOn = 0;
    ms = Date.now();
    mins = ms * 0.000017;

    var htmlCharacter = productCode.includes('%2F');
    if (htmlCharacter) {
      productCode = productCode.replace(/%2F/g, '/');
    }

    await Product.findById('PC-CONSUMIBLES_' + productCode, (err, product) => {
      if (err) return res.status(508).send({ message: `Error al realizar la peticion: ${err}` });
      if (product == null || product.time == null) {
        goOn = 1;
      } else {
        productTime = product.time;
        if (mins - productTime > 720 || !product) {
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

      const browser = await chromium.launch({
        headless: true,
      });

      const page = await browser.newPage();
      page.setDefaultNavigationTimeout(200000);

      try {
        await page.goto(`https://pcconsumibles.com/index.php?route=product/search&search=${productCode}`, {
          waitUntil: 'domcontentloaded',
        });
        await Promise.all([
          await page.goto(`https://pcconsumibles.com/index.php?route=product/search&search=${productCode}`, {
            waitUntil: 'domcontentloaded',
          }),
        ]);

        htmlCharacter = productCode.includes('%2F');
        if (htmlCharacter) {
          productCode = productCode.replace(/%2F/g, '/');
        }

        var check = await page.$('#content > p:nth-child(6)');
        if (check) {
          check = await page.textContent('#content > p:nth-child(6)');
          var a = check.indexOf('No hay Productos que cumplen el criterio de la búsqueda');
          if (a >= 0) {
            await browser.close();
            res.status(500).send({ message: `No se encontro el producto: ${productCode}` });
            return;
          }
        }
        await page.waitForLoadState('load');
        await page.dblclick('#content > div.product-list > div:nth-child(1) > div > div.image.col-sm-3 > a');
      } catch (err) {
        console.log(`###### ${err} ###### \n ###### fallo en PC-CONSUMIBLES en el sku: ${productCode} ######`);
        res.status(500).send({ message: `Error al realizar la busqueda` });
        await browser.close();
        return;
      }

      try {
        await page.waitForTimeout(1000);
        var title = await page.$('#tab-description > h1 > span');
        var title2 = await page.$('#title-page');

        if (title) {
          title = await page.textContent('#tab-description > h1 > span');
        }
        if (title2) {
          title = await page.textContent('#title-page');
        }

        var description = await page.textContent(
          '#quickview_product > div.col-sm-6.product-center.clearfix > div:nth-child(1) > div.description'
        );
        var price = await page.$(
          '#quickview_product > div.col-sm-6.product-center.clearfix > div:nth-child(1) > div.price > span.price-new.price-sale > span'
        );
        var price2 = await page.$(
          '#quickview_product > div.col-sm-6.product-center.clearfix > div:nth-child(1) > div.price > span.price-new'
        );

        if (price) {
          price = await page.textContent(
            '#quickview_product > div.col-sm-6.product-center.clearfix > div:nth-child(1) > div.price > span.price-new.price-sale > span'
          );
        }
        if (price2) {
          price = await page.textContent(
            '#quickview_product > div.col-sm-6.product-center.clearfix > div:nth-child(1) > div.price > span.price-new'
          );
        }
        var delivery = await page.$(
          '#quickview_product > div.col-sm-6.product-center.clearfix > div:nth-child(1) > div.price > p:nth-child(9) > strong'
        );
        var delivery2 = await page.$(
          '#quickview_product > div.col-sm-6.product-center.clearfix > div:nth-child(1) > div.price > p:nth-child(8) > strong'
        );

        if (delivery) {
          delivery = await page.textContent(
            '#quickview_product > div.col-sm-6.product-center.clearfix > div:nth-child(1) > div.price > p:nth-child(9) > strong'
          );
        }

        if (delivery2) {
          delivery = await page.textContent(
            '#quickview_product > div.col-sm-6.product-center.clearfix > div:nth-child(1) > div.price > p:nth-child(8) > strong'
          );
        }
        await browser.close();
      } catch (err) {
        console.log(`###### ${err} ###### \n ###### fallo en PC-CONSUMIBLES en el sku: ${productCode} ######`);
        await browser.close();
        res.status(404).send({ message: `Error al enocontrar el producto` });
        return;
      }

      try {
        title = description.replace(/(\r\n|\r|\t|\n)/gm, '');
        description = description.replace(/(\r\n|\r|\t)/gm, '');
        description = description.split('\n');
        description.shift();
        //---------------Descripcion

        for (var i = 0; i < description.length; i++) {
          for (var j = 0; j < description[i].length; j++) {
            if (description[i][j] == ' ') {
              description[i] = description[i].replace(/\s/gm, '');
              description[i] = description[i].substring(description[i].indexOf(':') + 1, description[i].length);
            }
          }
        }

        //---------------Precio
        price = price.replace(/[$]/gm, '');
        price = price.replace(/[,]/gm, '');
        //---------------Envio
        delivery = delivery.replace(/[$]/gm, '');
        delivery = delivery.replace(/\s/gm, '');
        description.shift();
        var stock = description[1];
        var sku = description[0];
      } catch (err) {
        console.log(`###### ${err} ###### \n ###### fallo en PC-CONSUMIBLES en el sku: ${productCode} ######`);
        res.status(404).send({ message: `Error al enocontrar el producto` });
        return;
      }

      var product = new Product();
      product.store = 'PC-CONSUMIBLES';
      product._id = product.store + '_' + sku;
      product.name = title;
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
                  name: title,
                  price: price,
                  stock: stock,
                  time: product.time,
                  sku: sku,
                  delivery: delivery,
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
  getPcConsumibles,
};
