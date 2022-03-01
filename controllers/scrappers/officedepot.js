import Product from '../../models/product.js';
import { firefox, chromium } from 'playwright';
import Normalized from '../modifiers/normalize.js';

function getOfficeDepot(req, res) {
  var sku = req.params.sku;
  var productCode = sku;
  (async () => {
    const browser = await chromium.launch({
      headless: true,
    });
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(200000);

    try {
      await page.goto(`https://www.officedepot.com.mx/officedepot/en/search/?text=${productCode}`, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });
    } catch (error) {
      res.status(418).send({ message: 'Load timeout' });
      await browser.close();
      return;
    }

    var found = await page.$(
      `body > main > div.cnt-page > div.container.custom-error404 > div > div.error404-left > img`
    );
    if (found) {
      found = false;
      res.status(404).send({ message: 'Producto no encontrado/descontinuado' });
      return;
    } else {
      found = true;
    }

    var name = await page.textContent(
      `body > main > div.cnt-page > div.container.back-grid > div > div > div.yCmsContentSlot.product-grid-right-result-slot > div:nth-child(1) > div.product__switch_view.product__listing.product__grid > div.product-item > div > a.product-description.heigh-grid > div.cnt-info-head-grid > div.contnet-name > div > h2`
    );
    name = name.replace(/\n/g, '');

    var stock;
    if (Number.isInteger(productCode)) {
      if (
        (await page.$(
          `#addToCartForm${productCode} > div.cnt-default-booton > button > div > div.clic-btn-detail.hidden-xs.hidden-sm`
        )) !== null
      ) {
        stock = 'Disponible en linea';
      } else if ((await page.$(`#product_${productCode}0 > div > div.clic-btn-detail.hidden-xs.hidden-sm`)) !== null) {
        stock = 'Disponible en tienda';
      } else {
        stock = 'No disponible';
      }
    } else {
      await page.goto(`https://www.officedepot.com.mx/officedepot/en/search/?text=${name}`, {
        waitUntil: 'networkidle0',
      });
      productCode = await page.textContent(
        `body > main > div.cnt-page > div.container.back-grid > div > div > div.yCmsContentSlot.product-grid-right-result-slot > div:nth-child(1) > div.product__switch_view.product__listing.product__grid > div:nth-child(3) > div > a.product-description.heigh-grid > div.cnt-rating-sku > div.product-sku > span.name-add.font-medium`
      );
      if (
        (await page.$(
          `#addToCartForm${productCode} > div.cnt-default-booton > button > div > div.clic-btn-detail.hidden-xs.hidden-sm`
        )) !== null
      ) {
        stock = 'Disponible en linea';
      } else if ((await page.$(`#product_${productCode}0 > div > div.clic-btn-detail.hidden-xs.hidden-sm`)) !== null) {
        stock = 'Disponible en tienda';
      } else {
        stock = 'No disponible';
      }
    }

    var price = await page.textContent(
      `body > main > div.cnt-page > div.container.back-grid > div > div > div.yCmsContentSlot.product-grid-right-result-slot > div:nth-child(1) > div.product__switch_view.product__listing.product__grid > div.product-item > div > a.product-description.heigh-grid > div.cnt-info-head-grid > div.priceContainer-grid.cnt-grid-pick > div > div > div.discountedPrice-grid.cont-price-grid.bp-original`
    );
    price = price.replace('$', '');
    price = price.replace(',', '');

    await browser.close();

    var product = new Product();
    product.store = 'OFFICEDEPOT';
    product._id = product.store + '_' + productCode;
    product.name = Normalized.normalized(name);
    product.sku = sku;
    product.price = Normalized.normalized(price);
    product.stock = Normalized.normalized(stock);

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
                stock: stock,
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
  getOfficeDepot,
};
