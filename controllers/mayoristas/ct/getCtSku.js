import { chromium } from 'playwright';

function getCtSku(req, res) {
  var sku = req.params.sku;
  var productCode = sku;
  productCode = productCode.toUpperCase();

  (async () => {
    const browser = await chromium.launch({
      headless: true,
    });
    const page = await browser.newPage();

    var ta;
    var tb;
    var t;
    var scrapedSku;
    var scrapedModel;
    var cases;

    try {
      ta = Date.now();
      await page.goto('https://ctonline.mx/buscar/productos?b=' + productCode, {
        waitUntil: 'domcontentloaded',
      });
      tb = Date.now();
      t = tb - ta;
      await page.waitForSelector('body > div.ct-partial_header > div > a', {
        timeout: 3000,
      });
    } catch (err) {
      console.log(`###### ${err} ###### \n ###### fallo en SKU-CT en el sku: ${productCode} ######`);
      res.status(404).send({ message: err });
      await browser.close();
      return;
    }

    page.setDefaultNavigationTimeout(t + 1000);

    try {
      cases = await page.textContent(
        'body > div.container > div > div.col-md-9.col-sm-12.products-content-wrapper > div.ct-result-list > h3',
        { timeout: t + 2000 }
      );
      if (cases == 'No se encontraron resultados') {
        sku = productCode;
        cases = 0;
      } else {
        cases = 1;
      }
    } catch {
      cases = 1;
    }

    if (cases) {
      try {
        scrapedModel = await page.textContent(
          'body > div.container > div > div.col-md-9.col-sm-12.products-content-wrapper > div.ct-result-list > div:nth-child(1) > div > div.ct-description > h6'
        );

        scrapedSku = await page.textContent(
          'body > div.container > div > div.col-md-9.col-sm-12.products-content-wrapper > div.ct-result-list > div:nth-child(1) > div > div.ct-description > h7'
        );
      } catch (err) {
        console.log(`###### ${err} ###### \n ###### fallo en SKU-CT en el sku: ${productCode} ######`);
        res.status(404).send({ message: `No se encontro el producto` });
        return;
      }
    }
    await browser.close();

    var check = scrapedModel.indexOf(productCode);
    if (check < 0) {
      res.status(404).send({ message: 'No se encontro el producto' });
    }
    var normalizedSku = scrapedSku.replace(/["!/(),.]/g, '');
    res.status(200).send({ sku: normalizedSku });
  })();
}

export default {
  getCtSku,
};
