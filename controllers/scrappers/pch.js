'use strict';
import 'dotenv/config';

import Product from '../../models/product.js';
import { firefox, chromium } from 'playwright';
import Normalized from '../modifiers/normalize.js';

function getPch(req, res) {
  var sku = req.params.sku;
  var productCode = sku;
  productCode = productCode.toUpperCase();

  (async () => {
    console.log('---------------------------PCH-MAYOREO---------------------------', productCode);
    var goOn = 0;
    var ms = Date.now();
    var mins = ms * 0.000017;
    var openBox = true;

    var htmlCharacter = productCode.includes('%2F');
    if (htmlCharacter) {
      productCode = productCode.replace(/%2F/g, '/');
    }

    await Product.findById('PCH_' + productCode, (err, product) => {
      if (err) return res.status(508).send({ message: `-Error al realizar la peticion: ${err}` });
      if (product == null || product.time == null) {
        goOn = 1;
      } else {
        var productTime = product.time;
        if (mins - productTime > 10 || !product) {
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
        console.log(productCode);
        await page.goto(`https://www.pchmayoreo.com/customer/account/login/`, {
          waitUntil: 'domcontentloaded',
          timeout: 15000,
        });
        await page.fill('#email', `${process.env.USUARIO_PCH}`);
        await page.fill('#pass', `${process.env.PASS_PCH}`);
        await page.keyboard.press('Enter');
        await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.goto('https://www.pchmayoreo.com/catalogsearch/result/?q=' + productCode, {
          waitUntil: 'domcontentloaded',
          timeout: 0,
        });

        htmlCharacter = productCode.includes('%2F');
        if (htmlCharacter) {
          productCode = productCode.replace(/%2F/g, '/');
        }

        var elemLoad = await page.$(
          '#product-wrapper > ol > li:nth-child(1) > div > div.col-md-9.col-sm-8.col-xs-12 > div.product.details.product-item-details > h5 > a'
        );

        if (!elemLoad) {
          await browser.close();
          res.status(404).send({ message: `No se encontro el producto` });
          return;
        }
        await page.click(
          '#product-wrapper > ol > li:nth-child(1) > div > div.col-md-9.col-sm-8.col-xs-12 > div.product.details.product-item-details > h5 > a',
          { waitUntil: 'domcontentloaded' }
        );
        var title = await page.textContent(
          '#maincontent > div.row > div > div.row.product-detail-infomation-sticky-parent > div.col-sm-6.col-xs-12.product-detail-infomation.product-detail-infomation-sticky > div > div > h1'
        );
        sku = await page.textContent(
          '#maincontent > div.row > div > div.row.product-detail-infomation-sticky-parent > div.col-sm-6.col-xs-12.product-detail-infomation.product-detail-infomation-sticky > div > div > div.product-sub-infomation > div.product.attribute.sku > span'
        );
        var specialPrice = await page.$(
          '#maincontent > div.row > div > div.row.product-detail-infomation-sticky-parent > div.col-sm-6.col-xs-12.product-detail-infomation.product-detail-infomation-sticky > div > div > div.product-info-price > div > span.special-price'
        );
        var price = await page.$(
          '#maincontent > div.row > div > div.row.product-detail-infomation-sticky-parent > div.col-sm-6.col-xs-12.product-detail-infomation.product-detail-infomation-sticky > div > div > div.product-info-price > div > span > meta:nth-child(2)'
        );

        if (specialPrice) {
          price = await page.getAttribute(
            '#maincontent > div.row > div > div.row.product-detail-infomation-sticky-parent > div.col-sm-6.col-xs-12.product-detail-infomation.product-detail-infomation-sticky > div > div > div.product-info-price > div > span.special-price > span > meta:nth-child(3)',
            'content',
            { timeout: 6000 }
          );
        }
        if (price) {
          price = await page.getAttribute(
            '#maincontent > div.row > div > div.row.product-detail-infomation-sticky-parent > div.col-sm-6.col-xs-12.product-detail-infomation.product-detail-infomation-sticky > div > div > div.product-info-price > div > span > meta:nth-child(2)',
            'content',
            { timeout: 6000 }
          );
        }
        if (!price && !specialPrice) {
          await browser.close();
          console.log('Producto no disponible');
          res.status(404).send({ message: `Producto no disponible` });
          return;
        }
        var priceCurrency = await page.textContent(
          '#maincontent > div.row > div > div.row.product-detail-infomation-sticky-parent > div.col-sm-6.col-xs-12.product-detail-infomation.product-detail-infomation-sticky > div > div > span'
        );
        var dolar = await page.textContent(
          'body > main > div > header > div.top-header-content > div > div > div > div > ul > li:nth-child(1) > div > div:nth-child(1)'
        );
        var stock = await page.$(
          '#maincontent > div.row > div > div.row.product-detail-infomation-sticky-parent > div.col-sm-6.col-xs-12.product-detail-infomation.product-detail-infomation-sticky > div > div > div.product-sub-infomation > div.product-info-stock-sku > div > span'
        );
        if (stock) {
          stock = await page.textContent(
            '#maincontent > div.row > div > div.row.product-detail-infomation-sticky-parent > div.col-sm-6.col-xs-12.product-detail-infomation.product-detail-infomation-sticky > div > div > div.product-sub-infomation > div.product-info-stock-sku > div > span'
          );
        } else {
          stock = 'No disponible';
        }

        await browser.close();
      } catch (err) {
        await browser.close();
        console.log(`###### ${err} ###### \n ###### fallo en PCH en el sku: ${productCode} ######`);
        res.status(500).send({ message: `Error al realizar la peticion: ${err}` });
        return;
      }
      try {
        var specialChar = dolar.includes('$');
        if (specialChar) {
          dolar = dolar.replace(/[$\s]/g, '');
          dolar = parseFloat(dolar);
        }
        openBox = sku.includes('(OB)');
        if (openBox) {
          console.log('Prod. Open Box ');
          openBox = true;
        }
        price *= 1.16;
        if (priceCurrency == 'USD') {
          price *= dolar;
        }
        price = parseFloat(price).toFixed(2);
      } catch (err) {
        console.log(`###### ${err} ###### \n ###### fallo en PCH en el sku: ${productCode} ######`);
        res.status(500).send({ message: `Error al realizar la peticion` });
        return;
      }

      let product = new Product();
      product.store = 'PCH';
      product._id = product.store + '_' + sku;
      product.name = Normalized.normalized(title);
      product.sku = sku;
      product.stock = stock;
      product.delivery = '$250.00 aprox';
      product.price = price;
      product.time = mins;
      product.openBox = openBox;

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
                  sku: sku,
                  openBox: openBox,
                  stock: stock,
                  time: product.time,
                  delivery: '$250.00 aprox',
                },
              },
              { new: true },
              (err2, product) => {
                if (err2) res.status(500).send({ message: `Error al actualizar el producto: ${err2}` });
                res.status(200).send({ product });
              }
            );
          }
          if (err.code != 11000) {
            res.status(500).send({ message: `Error al realizar la peticion: ${err}` });
          }
        } else {
          res.status(200).send(newProduct);
        }
      });
    }
  })();
}

export default {
  getPch,
};
