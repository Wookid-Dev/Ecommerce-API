import 'dotenv/config';

import Products from '../../models/product.js';

import SerpApi from 'google-search-results-nodejs';
import stringSimilarity from 'string-similarity';

function getGoogleShoppingProduct(req, res, err) {
  var array = [];
  var bestMatches = [];
  let sku = req.params.sku;
  const productCode = sku;

  const search = new SerpApi.GoogleSearch(`${process.env.SERAPI_KEY}`);

  function compareValues(key, order = 'asc') {
    return function innerSort(a, b) {
      if (!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
        // property doesn't exist on either object
        return 0;
      }
      const varA = typeof a[key] === 'string' ? a[key].toUpperCase() : a[key];
      const varB = typeof b[key] === 'string' ? b[key].toUpperCase() : b[key];

      let comparison = 0;
      if (varA > varB) {
        comparison = 1;
      } else if (varA < varB) {
        comparison = -1;
      }
      return order === 'desc' ? comparison * -1 : comparison;
    };
  }

  const params = {
    q: `${productCode}`,
    tbm: 'shop',
    location: 'Ciudad de Mexico',
    hl: 'es',
    gl: 'mx',
    num: 100,
  };

  const callback = function (data) {
    try {
      for (var i = 0; i < data.shopping_results.length; i++) {
        var title = data.shopping_results[i].title;
        var link = data.shopping_results[i].link;
        var source = data.shopping_results[i].source;
        var price = data.shopping_results[i].price;
        var extractedprice = data.shopping_results[i].extracted_price;

        array.push({
          title: title,
          link: link,
          shop: source,
          price: price,
          extractedprice,
        });
      }
    } catch (error) {
      res.status(400).send({
        message: `Error: ${data.error}`,
      });
      return;
    }

    array.sort(compareValues('extractedprice'));

    const noCyberpuerta = array.filter((item) => item.shop.indexOf('Cyberpuerta.mx') < 0);

    const noIntercompras = noCyberpuerta.filter((item) => item.shop.indexOf('Intercompras.com') < 0);

    const noPcel = noIntercompras.filter((item) => item.shop.indexOf('PCEL') < 0);

    const updatedArray = noPcel.filter((item) => item.price.indexOf('mensuales') < 0);

    for (var j = 0; j < updatedArray.length; j++) {
      var matches = stringSimilarity.compareTwoStrings(productCode, updatedArray[j].title);
      if (matches > 0.4) {
        bestMatches.push({
          title: updatedArray[j].title,
          price: updatedArray[j].price,
          store: updatedArray[j].shop,
          link: updatedArray[j].link,
          rating: matches,
        });
      }
    }
    bestMatches.sort(compareValues('rating', 'desc'));

    let products = new Products();
    products._id = 'Google-Shooping' + '_' + sku;
    products.products = updatedArray;
    products.matches = bestMatches;

    res.status(200).send(products);
  };
  search.json(params, callback);
}

export default {
  getGoogleShoppingProduct,
};
