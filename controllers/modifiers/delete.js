import Product from '../../models/product.js';

function deleteProduct(req, res) {
  let productId = req.params.productId;

  Product.findByIdAndDelete(productId, (err, product) => {
    if (!product) return res.status(404).send({ message: 'El producto no existe' });

    if (err) res.status(500).send({ message: `Error al realizar la peticion: ${err}` });

    res.status(200).send({ message: 'El producto se ha eliminado' });
  });
}

export default {
  deleteProduct,
};
