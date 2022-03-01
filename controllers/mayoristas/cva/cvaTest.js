import axios from 'axios';
import Product from '../../../models/product.js';
import parser from 'fast-xml-parser';

function cvaInfo(req, res) {
  var product = new Product();
  var sku = req.params.sku;
  var productCode = sku;
  productCode = productCode.toUpperCase();
  var htmlCharacter = productCode.includes('/');
  if (htmlCharacter) {
    productCode = productCode.replace(/[/]/g, '%2F');
  }
  console.log(product);
  htmlCharacter = productCode.includes('%23');
  if (htmlCharacter) {
    productCode = productCode.replace(/%23/g, '#');
  }
  var config = {
    method: 'get',
    url: `http://www.grupocva.com/catalogo_clientes_xml/lista_precios.xml?cliente=28911&marca=%25&grupo=%25&clave=%25&codigo=${productCode}&MonedaPesos=1`,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  axios(config)
    .then(function (response) {
      var result = parser.parse(response.data);
      console.log(result);
      if (result.articulos == '') {
        console.log('No encontrado');
        res.status(404).send({ message: 'Prod no encontrado' });
        return;
      }
      var stock = result.articulos.item.disponible;
      if (stock < 0) {
        stock = 0;
      }

      product = {
        descripcion: result.articulos.item.descripcion,
        codFabricante: result.articulos.item.codigo_fabricante,
        clave: result.articulos.item.clave,
        precio: result.articulos.item.precio,
        disponible: result.articulos.item.disponible,
        grupo: result.articulos.item.grupo,
        marca: result.articulos.item.marca,
        moneda: result.articulos.item.moneda,
        imagen: result.articulos.item.imagen,
      };
      try {
        res.status(200).send(product);
      } catch (err) {
        console.log(err);
        res.status(404).send({ message: 'Prod no encontrado' });
      }
    })
    .catch(function (err) {
      console.log(err);
    });
}

export default {
  cvaInfo,
};
