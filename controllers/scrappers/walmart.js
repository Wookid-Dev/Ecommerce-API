import Product from '../../models/product.js';
import { firefox, chromium } from 'playwright';
import Normalized from '../modifiers/normalize.js';

function getWalmart(req, res) {
  var sku = req.params.sku;
  var productCode = sku;
  (async () => {
    const browser = await chromium.launch({
      headless: true,
    });
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(200000);

    try {
      await page.goto(`https://www.walmart.com.mx/productos?Ntt=${productCode}`, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });
    } catch (error) {
      res.status(418).send({ message: 'Load timeout' });
      await browser.close();
      return;
    }

    var found = await page.$(`#scrollContainer > section > div.no-results_container__3gYen > div > div > img`);

    if (found) {
      res.status(404).send({ message: 'Producto no encontrado/descontinuado' });
    } else {
      found = true;
    }

    var stock = `Disponible`;

    var name = await page.textContent(
      `#scrollContainer > section > div.narrow_container__RPH8N.narrow_large__2tHuD.narrow_noPadding__3hCGc > div.products_mainContent__3oClM > div.products_rightContent__Q6n1g > div > div > div > div > div > div.product_productCardSummary___YXeD > a.nav-link_navLink__2oJ29.product_name__1YFfY > p > div`
    );

    var price = await page.textContent(
      `#scrollContainer > section > div.narrow_container__RPH8N.narrow_large__2tHuD.narrow_noPadding__3hCGc > div.products_mainContent__3oClM > div.products_rightContent__Q6n1g > div > div > div > div > div > div:nth-child(3) > div > p`
    );
    price = price.replace('$', '');
    price = price.replace(',', '');

    await browser.close();

    var product = new Product();
    product.store = 'WALMART';
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
  getWalmart,
};
