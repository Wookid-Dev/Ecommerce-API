import Product from '../../models/product.js';

function saveProduct(req, res) {
  console.log('POST /api/product');
  console.log(req.body);

  let product = new Product();
  product.store = req.body.store;
  product._id = req.body.id;
  product.name = req.body.name;
  product.sku = req.body.sku;
  product.price = req.body.price;
  product.stock = req.body.stock;

  product.save((err, newProduct) => {
    newProduct = product;

    if (err) {
      if (err.code == 11000) {
        Product.findByIdAndUpdate(
          product._id,
          { $set: { price: req.body.price, stock: req.body.stock } },
          { new: true },
          (err2, product) => {
            if (err2) res.status(500).send({ message: `Error al actualizar el producto: ${err2}` });
            res.status(200).send({ product });
          }
        );
      }
    } else {
      res.status(200).send(newProduct);
    }
  });
}

export default {
  saveProduct,
};
