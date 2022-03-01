import Product from '../../models/product.js';

function updateProduct(req, res) {
  let productId = req.params.productId;
  let update = req.body;
  console.log(update.name);

  Product.findByIdAndUpdate(productId, update, { new: true }, (err, productUpdated) => {
    if (err) res.status(500).send({ message: `Error al actualizar el producto: ${err}` });

    res.status(200).send({ product: productUpdated });
  });
}

export default {
  updateProduct,
};
