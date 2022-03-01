import Product from '../../models/product.js';
import { firefox, chromium } from 'playwright';
import Normalized from '../modifiers/normalize.js';

function getPcel(req, res) {
  var sku = req.params.sku;
  var productCode = sku;
  productCode = productCode.toUpperCase();

  (async () => {
    console.log('---------------------------PCEL---------------------------', productCode);
    var htmlCharacter = productCode.includes('%2F');
    if (htmlCharacter) {
      productCode = productCode.replace(/%2F/g, '/');
    }

    var goOn = 0;
    var ms = Date.now();
    var mins = ms * 0.000017;
    await Product.findById('PCEL_' + productCode, (err, product) => {
      if (err) return res.status(508).send({ message: `Error al realizar la peticion: ${err}` });
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

      var delivery = 0;
      var total = 0;
      var cont = 0;
      var array = [];
      var storage = [];

      const browser = await firefox.launch({
        headless: true,
      });
      const page = await browser.newPage();
      page.setDefaultNavigationTimeout(200000);
      htmlCharacter = productCode.includes('%2F');
      if (htmlCharacter) {
        productCode = productCode.replace(/%2F/g, '/');
      }

      try {
        await page.goto(`https://pcel.com/index.php?route=product/search&filter_name=${productCode}`, {
          waitUntil: 'domcontentloaded',
          timeout: 15000,
        });

        htmlCharacter = productCode.includes('%2F');
        if (htmlCharacter) {
          productCode = productCode.replace(/%2F/g, '/');
        }

        await page.waitForTimeout(7000);
      } catch (err) {
        await browser.close();
        console.log(`###### ${err} ###### \n ###### fallo en PCEL en el sku: ${productCode} ######`);
        res.status(400).send({ message: `Error al realizar la busqueda` });
        return;
      }
      try {
        var invalidProd = await page.$('#content > div:nth-child(4)');
        if (invalidProd) {
          invalidProd = await page.textContent('#content > div:nth-child(4)');
          invalidProd = invalidProd.replace(/(\r\n|\n|\r)/gm, '');
        }
        var noProd1 = invalidProd.includes(`${productCode} no obtuvo resultados`);
        var noProd2 = invalidProd.includes('No hay Productos que cumplen el criterio de la Búsqueda.');
        if (noProd1 || noProd2) {
          await browser.close();
          res.status(400).send({ message: `No se encontro el producto ${productCode}` });
          return;
        }
        var productList = await page.$('#content > div.product-list');
        if (productList) {
          await page.click(
            '#content > div.product-list > table > tbody > tr:nth-child(1) > td:nth-child(1) > div.image > a > img'
          );
        }
        var title = await page.textContent('#content > h1');
        var storeId = await page.getAttribute(
          '#content > div.product-info > div.right > table > tbody > tr:nth-child(1) > td:nth-child(1) > div > span:nth-child(3)',
          'data-sku'
        );
        var price = await page.$(
          '#content > div.product-info > div.right > table > tbody > tr:nth-child(1) > td:nth-child(3) > div.price > span.price-new'
        );
        if (price) {
          price = await page.textContent(
            '#content > div.product-info > div.right > table > tbody > tr:nth-child(1) > td:nth-child(3) > div.price > span.price-new'
          );
        }
        if (!price) {
          price = await page.getAttribute(
            '#content > div.product-info > div.right > table > tbody > tr:nth-child(1) > td:nth-child(3)',
            'data-price'
          );
        }
        await page.click(
          '#content > div.product-info > div.right > table > tbody > tr:nth-child(1) > td:nth-child(3) > div.cart > div.ver-stock > a'
        );
        var stock = await page.textContent(`#pcel-stock-${storeId} > table > tbody`);
        var description = await page.textContent(
          `#content > div.product-info > div.right > table > tbody > tr:nth-child(1) > td:nth-child(1) > div`
        );
        price = price.replace(/[$,]/g, '');
        price = parseFloat(price);
        if (price < 600) {
          await page.click(
            '#content > div.product-info > div.right > table > tbody > tr:nth-child(1) > td:nth-child(3) > div.cart > div:nth-child(1) > img.button.addToCart'
          );
          await page.waitForTimeout(2000);
          await page.goto(`https://pcel.com/index.php?route=checkout/cart`);
          await page.click('#content > div:nth-child(5) > div.cart-heading.first-cart-heading');
          delivery = await page.textContent('#quote > table > tbody > tr:nth-child(2) > td:nth-child(3) > label');
        }
        await browser.close();
      } catch (err) {
        await browser.close();
        console.log(`###### ${err} ###### \n ###### fallo en PCEL en el sku: ${productCode} ######`);
        res.status(404).send({ message: `Error al obtener el producto` });
        return;
      }
      await browser.close();
      try {
        //  descripcion
        var a = description.indexOf('Modelo:');
        var b = description.indexOf('Envío en:');
        for (var i = a; i < b; i++) {
          array.push(description[i]);
        }
        var joinedArray = array.join('');
        joinedArray = joinedArray.replace(/(\r\n|\n|\r|\s)/gm, '');
        joinedArray = joinedArray.split('Modelo:');
        var sku = joinedArray[1];
        if (sku == undefined) {
          sku = productCode;
        }
        //  stock
        stock = stock.replace(/(\r\n|\n|\r|\s)/gm, '');
        var c = stock.replace(/[^0-9.]/g, ' ');
        c = c.split(' ');
        for (var x = 0; x < c.length; x++) {
          if (!isNaN(parseFloat(c[x]))) {
            if (cont == 0) {
              storage.push({ bajoPedido: c[x] });
            }
            if (cont == 1) {
              storage.push({ morones: c[x] });
            }
            if (cont == 2) {
              storage.push({ centroDistribucion: c[x] });
            }
            if (cont == 3) {
              storage.push({ guadalajara: c[x] });
            }
            total += parseFloat(c[x]);
            cont++;
          }
        }
        storage.push({ total: total });
      } catch (err) {
        console.log(`###### ${err} ###### \n ###### fallo en PCEL en el sku: ${productCode} ######`);
        await browser.close();
        res.status(500).send({ message: `Error manipulando los datos` });
        return;
      }

      var product = new Product();
      product.store = 'PCEL';
      product._id = product.store + '_' + sku;
      product.name = Normalized.normalized(title);
      product.sku = sku;
      product.delivery = delivery;
      product.stock = total;
      product.storage = storage;
      product.price = price;
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
                  name: Normalized.normalized(title),
                  sku: sku,
                  delivery: delivery,
                  stock: total,
                  storage: storage,
                  price: price,
                  time: product.time,
                },
              },
              { new: true },
              (err2, product) => {
                if (err2) {
                  res.status(500).send({ message: `Error al actualizar el producto: ${err2}` });
                } else {
                  res.status(200).send({ product });
                }
              }
            );
          }
        } else {
          res.status(200).send(newProduct);
        }
      });
    }
  })();
}

export default {
  getPcel,
};
