import Product from '../../models/product.js';

function getProduct(req, res) {
  let productId = req.params.productId;

  Product.findById(productId, (err, product) => {
    if (err) return res.status(508).send({ message: `Error al realizar la peticion: ${err}` });
    if (!product) return res.status(404).send({ message: `El producto no existe` });

    res.status(200).send({ product });
  });
}

function getProducts(req, res) {
  Product.find({}, (err, products) => {
    if (err) return res.status(500), send({ message: `Error al realizar la peticion: ${err}` });
    if (!products) return res.status(404).send({ message: 'No hay productos' });

    res.status(200).send({ products });
  });
}

export default {
  getProduct,
  getProducts,
};
