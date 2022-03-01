import Products from '../../models/product.js';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import creds from '../../client_secret.js';

var productArray = [];

function getSheet(req, res) {
  async function accesSpreadSheet() {
    const doc = new GoogleSpreadsheet('1MmtTTpavGw5EFPCeo6UU1bfo9d4cGRn6V1KgDg_YUzM');
    await doc.useServiceAccountAuth({
      client_email: creds.client_email,
      private_key: creds.private_key,
    });

    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();

    for (var i = 0; i < rows.length; i++) {
      var product = {
        store: 'EXEL',
        _id: rows[i]._ID,
        name: rows[i].NAME,
        sku: rows[i].SKU,
        price: rows[i].PRICE,
        stock: rows[i].STOCK,
      };
      productArray.push(product);
    }

    var json = JSON.parse(JSON.stringify(productArray));

    let products = new Products();
    products._id = 'Google-Sheets_' + sheet.title;
    products.products = json;

    products.save((err, newProducts) => {
      newProducts = products;
      if (err) {
        if (err.code == 11000) {
          Products.findByIdAndUpdate(products._id, { $set: { products: json } }, { new: true }, (err2, products) => {
            if (err2)
              res.status(500).send({
                message: `Error al actualizar el producto: ${err2}`,
              });
            res.status(200).send({ products });
          });
        }
      } else {
        res.status(200).send(newProducts);
      }
    });
  }
  accesSpreadSheet();
}

export default {
  getSheet,
};
