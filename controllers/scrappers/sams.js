import Product from '../../models/product.js';
import { firefox, chromium } from 'playwright';
import Normalized from '../modifiers/normalize.js';

function getSams(req, res) {
  var sku = req.params.sku;
  var productCode = sku;
  (async () => {
    console.log('---------------------------SAMS---------------------------');
    var goOn = 0;
    var ms = Date.now();
    var mins = ms * 0.000017;

    await Product.findById('SAMS_' + productCode, (err, product) => {
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
      const browser = await chromium.launch({
        headless: true,
      });
      const page = await browser.newPage();
      page.setDefaultNavigationTimeout(200000);

      try {
        await page.goto(`https://www.sams.com.mx/search/Ntt=${productCode}`, {
          waitUntil: 'domcontentloaded',
          timeout: 20000,
        });
      } catch (error) {
        res.status(418).send({ message: 'Load timeout' });
        await browser.close();
        return;
      }

      try {
        await page.click(`#sams-body > div.smx-modal.show > div.smx-dialog.desktop > span > i`);
        await page.click(
          `#productMainContaienr > div.product-listing.desktop > div.itemBox-container-wrp.grid-itemBox-wrp.first.newAtc-itemBox-container-wrp.osmosis > div > div.item-row.full-column.itemrow-img-desc > div > div.item-row-inner.itemrow-center`
        );

        var price = await page.textContent(
          '#page-ng > div > div > div.desktop.pdp-info-container > div.desktop.pdp-info-container.full-column > div.desktop.pdp-top-panel > div.desktop.pdp-cart-bar > div > div.prod-price-wrap > div.prod-price-special > span'
        );

        var title = await page.textContent(
          '#page-ng > div > div > div.desktop.pdp-info-container > div.desktop.pdp-info-container.full-column > div.desktop.pdp-top-panel > div:nth-child(1) > h1'
        );

        var stock = await page.textContent(
          '#page-ng > div > div > div.desktop.pdp-info-container > div.desktop.pdp-info-container.full-column > div.desktop.pdp-top-panel > div.desktop.pdp-cart-bar > div > div.delivery-options > div.home-delivery.icon.icoBlackbird-Icons_homedelivery > div > span.envio-text-opciones'
        );

        await browser.close();
      } catch (error) {
        res.status(418).send({ message: 'Meh error' });
        await browser.close();
        return;
      }

      let product = new Product();
      product.store = 'SAMS';
      product._id = product.store + '_' + productCode;
      product.name = Normalized.normalized(title);
      product.sku = sku;
      product.price = Normalized.normalized(price);
      product.stock = Normalized.normalized(stock);
      product.time = mins;

      product.save((err, newProduct) => {
        newProduct = product;

        if (err) {
          if (err.code == 11000) {
            Product.findByIdAndUpdate(
              product._id,
              {
                $set: {
                  name: Normalized.normalized(title),
                  price: Normalized.normalized(price),
                  stock: stock,
                  time: product.time,
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
            res.status(500).send({ message: `Error al realizar la peticion: ${err2}` });
          }
        } else {
          res.status(200).send(newProduct);
        }
      });
    }
  })();
}

export default {
  getSams,
};
