import Product from '../../models/product.js';
import { chromium, firefox } from 'playwright';
import { compareTwoStrings } from 'string-similarity';

function getCyberpuerta(req, res) {
  var sku = req.params.sku;
  var productCode = sku;
  productCode = productCode.toUpperCase();

  (async () => {
    console.log('---------------------------CYBERPUERTA---------------------------');
    var goOn = 0;
    var ms = Date.now();
    var mins = ms * 0.000017;

    var htmlCharacter = productCode.includes('%2F');
    if (htmlCharacter) {
      productCode = productCode.replace(/%2F/g, '/');
    }

    await Product.findById('CYBERPUERTA_' + productCode, (err, product) => {
      if (err) return res.status(508).send({ message: `-Error al realizar la peticion: ${err}` });
      if (product == null || product.time == null) {
        goOn = 1;
      } else {
        var productTime = product.time;
        if (mins - productTime > 60 || !product) {
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
      var title;
      var sku;
      var price;
      var delivery;
      var stock;

      const browser = await firefox.launch({
        headless: true,
      });
      const page = await browser.newPage();

      htmlCharacter = productCode.includes('%2F');
      if (htmlCharacter) {
        productCode = productCode.replace(/%2F/g, '/');
      }

      try {
        await page.goto('https://www.cyberpuerta.mx/index.php?cl=search&searchparam=' + productCode, {
          timeout: 10000,
          waitUntil: 'domcontentloaded',
        });

        htmlCharacter = productCode.includes('%2F');
        if (htmlCharacter) {
          productCode = productCode.replace(/%2F/g, '/');
        }
      } catch (err) {
        console.log(`###### ${err} ###### \n ###### fallo en CYBERPUERTA en el sku: ${productCode} ######`);
        res.status(500).send({ message: 'Error al realizar la llamada' });
        await browser.close();
        return;
      }

      try {
        await page.waitForLoadState('domcontentloaded');

        var check = await page.$('#content > div.clear');
        if (check) {
          check = await page.textContent('#content > div.clear');
          var index = check.indexOf(`0 éxitos para "${productCode}"`);
          console.log(index);
          if (index >= 0) {
            await browser.close();
            res.status(404).send({ message: 'No se encontro el producto' });
            return;
          }
        }

        var case1 = await page.$(
          '#content > div.grid-x.listlocator.listlocatortop.big > div.cell.small-5.locationitem'
        );

        var case2 = await page.$(
          '#productinfo > form > div.detailsInfo.clear > div:nth-child(1) > div:nth-child(2) > div > div.emdetails_notinstocktext1'
        );

        var case3 = await page.$(
          '#productinfo > form > div.detailsInfo.clear > div:nth-child(1) > div:nth-child(2) > div > div.cp-main-info-eol > div.eol_txt_1'
        );

        var case4 = true;

        //------------------------------------------------------------------------------------------------------------------------
        if (case1) {
          await page.click('#searchList > li:nth-child(1) > div > form > div.emproduct_left > a');

          await page.waitForTimeout(1000);

          try {
            title = await page.textContent(
              '#productinfo > form > div.detailsInfo.clear > div:nth-child(1) > div:nth-child(2) > div > h1',
              {
                timeout: 5000,
              }
            );
            sku = await page.textContent(
              '#productinfo > form > div.detailsInfo.clear > div:nth-child(1) > div:nth-child(2) > div > div:nth-child(2) > div.medium-8.cell',
              {
                timeout: 5000,
              }
            );
            price = await page.textContent(
              '#productinfo > form > div.detailsInfo.clear > div:nth-child(1) > div:nth-child(2) > div > div:nth-child(4) > div.medium-7.cell.cp-pr > div > div > div.mainPrice',
              {
                timeout: 5000,
              }
            );
            stock = await page.textContent(
              '#productinfo > form > div.detailsInfo.clear > div:nth-child(1) > div:nth-child(2) > div > div:nth-child(4) > div.medium-7.cell.cp-pr > div > div > div.stock',
              {
                timeout: 5000,
              }
            );
            delivery = await page.textContent(
              '#productinfo > form > div.detailsInfo.clear > div:nth-child(1) > div:nth-child(2) > div > div:nth-child(4) > div.medium-7.cell.cp-pr > div > div > div.deliverycost',
              {
                timeout: 5000,
              }
            );
            case4 = false;
          } catch {
            case2 = true;
          }
        }
        //------------------------------------------------------------------------------------------------------------------------
        if (case2) {
          case2 = await page.textContent(
            '#productinfo > form > div.detailsInfo.clear > div:nth-child(1) > div:nth-child(2) > div > div.emdetails_notinstocktext1'
          );
          var index = case2.indexOf(`Lo sentimos, por el momento este producto está agotado.`);
          if (index >= 0) {
            title = await page.textContent(
              '#productinfo > form > div.detailsInfo.clear > div:nth-child(1) > div:nth-child(2) > div > h1'
            );
            sku = await page.textContent(
              '#productinfo > form > div.detailsInfo.clear > div:nth-child(1) > div:nth-child(2) > div > div.detailsInfo_right_artnum'
            );
            price = await page.textContent(
              '#productinfo > form > div.detailsInfo.clear > div:nth-child(1) > div:nth-child(2) > div > div:nth-child(4) > div.medium-7.cell.cp-pr > div > div > div.mainPrice > span'
            );
            stock = 'Lo sentimos, por el momento este producto está agotado.';
            delivery = await page.textContent(
              '#productinfo > form > div.detailsInfo.clear > div:nth-child(1) > div:nth-child(2) > div > div:nth-child(4) > div.medium-7.cell.cp-pr > div > div > div.deliverycost'
            );
          }
          case4 = false;
        }
        //------------------------------------------------------------------------------------------------------------------------
        if (case3) {
          title = await page.textContent(
            '#productinfo > form > div.detailsInfo.clear > div:nth-child(1) > div:nth-child(2) > div > div.cp-main-info-eol > h1'
          );
          sku = await page.textContent(
            '#productinfo > form > div.detailsInfo.clear > div:nth-child(1) > div:nth-child(2) > div > div.cp-main-info-eol > div.detailsInfo_right_artnum'
          );
          price = '$0.00';
          stock = 'Fuera del Mercado';
          delivery = '$0.00';
          case4 = false;
        }

        //------------------------------------------------------------------------------------------------------------------------

        if (case4) {
          title = await page.textContent(
            '#productinfo > form > div.detailsInfo.clear > div:nth-child(1) > div:nth-child(2) > div > h1'
          );
          sku = await page.textContent(
            '#productinfo > form > div.detailsInfo.clear > div:nth-child(1) > div:nth-child(2) > div > div:nth-child(2) > div.medium-8.cell'
          );
          price = await page.textContent(
            '#productinfo > form > div.detailsInfo.clear > div:nth-child(1) > div:nth-child(2) > div > div:nth-child(4) > div.medium-7.cell.cp-pr > div > div > div.mainPrice'
          );
          stock = await page.textContent(
            '#productinfo > form > div.detailsInfo.clear > div:nth-child(1) > div:nth-child(2) > div > div:nth-child(4) > div.medium-7.cell.cp-pr > div > div > div.stock'
          );
          delivery = await page.textContent(
            '#productinfo > form > div.detailsInfo.clear > div:nth-child(1) > div:nth-child(2) > div > div:nth-child(4) > div.medium-7.cell.cp-pr > div > div > div.deliverycost'
          );
        }

        sku = sku.replace('SKU: ', '');
        sku = sku.replace(/(\r\n|\n|\r)/gm, '');
        stock = stock.replace(/[^0-9-]/g, '');
        price = price.replace(/[^0-9.-]/g, '');
        delivery = delivery.replace(/[^0-9.-]/g, '');
      } catch (err) {
        console.log(err);
        await browser.close();
        res.status(500).send({ message: 'Error al realizar la llamada' });
        return;
      }
      await browser.close();

      var product = new Product();
      product.store = 'CYBERPUERTA';
      product._id = product.store + '_' + sku;
      product.name = title;
      product.sku = sku;
      product.price = price;
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
                  delivery: delivery,
                  stock: stock,
                  time: product.time,
                },
              },
              { new: true },
              (err2, product) => {
                if (err2)
                  res.status(500).send({
                    message: `Error al actualizar el producto: ${err2}`,
                  });
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
  getCyberpuerta,
};
