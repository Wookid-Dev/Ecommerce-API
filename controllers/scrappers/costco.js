import Product from '../../models/product.js';
import { firefox, chromium } from 'playwright';
import Normalized from '../modifiers/normalize.js';

function getCostco(req, res) {
  var sku = req.params.sku;
  var productCode = sku;
  (async () => {
    const browser = await chromium.launch({
      headless: true,
    });
    const page = await browser.newPage();

    await page.route('**/*', (route) => {
      return route.request().resourceType() === 'stylesheet' ||
        route.request().resourceType() === 'image' ||
        route.request().resourceType() === 'font' ||
        route.request().resourceType() === 'other'
        ? route.abort()
        : route.continue();
    });

    try {
      await page.goto(`https://www.costco.com.mx/search?text=${productCode}`, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
    } catch (error) {
      res.status(418).send({ message: 'Load timeout' });
      await browser.close();
      return;
    }

    var found = await page.$(
      'body > main > div.page-content.container.main-wrapper > sip-product-listing > sip-search-empty-page > div > div.search-empty > a'
    );

    if (found) {
      res.status(404).send({ message: `Producto no encontrado/descontinuado, error: ${e}` });
      await browser.close();
      return;
    }

    var available = `Disponible`;

    try {
      const name = await page.textContent(
        `body > main > div.page-content.container.main-wrapper > sip-product-listing > div.col-sm-9.search-page-container.ng-star-inserted > div > sip-product-search-results > sip-page-slot > sip-product-list > div > section > div.product-listing-container > ul > sip-product-list-item:nth-child(1) > li > div.product-info-wrapper > div.product-list-details > div.product-name-container > a > span`
      );
    } catch {
      const name = undefined;
    }

    try {
      let price = await page.textContent(
        `body > main > div.page-content.container.main-wrapper > sip-product-listing > div.col-sm-9.search-page-container.ng-star-inserted > div > sip-product-search-results > sip-page-slot > sip-product-list > div > section > div.product-listing-container > ul > sip-product-list-item:nth-child(1) > li > div.product-info-wrapper > div.price-panel.ng-star-inserted > sip-product-price-panel > div > div > span > sip-format-price > span`
      );
      price = price.replace('$', '');
      price = price.replace(',', '');
    } catch {
      price = undefined;
    }

    if (!name && !price) {
      res.status(404).send({ message: `Producto no encontrado/descontinuado` });
      await browser.close();
      return;
    }

    await browser.close();

    let product = new Product();
    product.store = 'COSTCO';
    product._id = product.store + '_' + productCode;
    product.name = Normalized.normalized(name);
    product.sku = sku;
    product.price = Normalized.normalized(price);
    product.stock = Normalized.normalized(available);

    product.save((err, newProduct) => {
      newProduct = product;

      if (err) {
        if (err.code == 11000) {
          Product.findByIdAndUpdate(
            product._id,
            {
              $set: {
                name: Normalized.normalized(name),
                price: Normalized.normalized(price),
                stock: available,
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
  })();
}

export default {
  getCostco,
};
