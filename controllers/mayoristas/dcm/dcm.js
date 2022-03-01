import axios from 'axios';
import Product from '../../../models/product.js';
import parser from 'fast-xml-parser';

function getProductDcm(req, res) {
  let sku = req.params.sku;
  var productCode = sku;
  productCode = productCode.toUpperCase();

  var data =
    '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:dcm="http://dcm.com.mx.ServidorWS/">' +
    ' <soapenv:Header/> ' +
    ' <soapenv:Body> ' +
    '<dcm:obtenerDatosIdArticulov1>' +
    '<!--Optional:-->' +
    '<EncabezadoTransaccion>' +
    '<!--Optional:-->' +
    '<contrasena>B7766AB8</contrasena>' +
    '<!--Optional:-->' +
    '<usuario>RL23699</usuario>' +
    '</EncabezadoTransaccion>' +
    '<!--Optional:-->' +
    `<Articulo>${sku}</Articulo>` +
    '</dcm:obtenerDatosIdArticulov1>' +
    '</soapenv:Body>' +
    '</soapenv:Envelope>';

  var config = {
    method: 'post',
    url: 'http://www.dcm.com.mx:8081/ServidorDCWS/DatosArticulov1',
    headers: {
      'Content-Type': 'text/xml',
    },
    data: data,
  };

  axios(config)
    .then(function (response) {
      console.log('---------------------------DCM---------------------------');
      let result = parser.parse(response.data);
      console.log(result['S:Envelope']['S:Body']['ns2:obtenerDatosIdArticulov1Response']);

      let product = new Product();
      product.store = 'DCM';
      product._id = product.store + '_' + productCode;
      product.name = result['S:Envelope']['S:Body']['ns2:obtenerDatosIdArticulov1Response'].Articulo.descripcion;
      product.sku = productCode;
      product.price = result['S:Envelope']['S:Body']['ns2:obtenerDatosIdArticulov1Response'].Articulo.precioFinal;
      product.stock = result['S:Envelope']['S:Body']['ns2:obtenerDatosIdArticulov1Response'].Articulo.disponible;
      product.storeId = result['S:Envelope']['S:Body']['ns2:obtenerDatosIdArticulov1Response'].Articulo.noArticulo;

      console.log(product);

      product.save((err, newProduct) => {
        newProduct = product;
        if (err) {
          if (err.code == 11000) {
            Product.findByIdAndUpdate(
              product._id,
              {
                $set: {
                  price: result['S:Envelope']['S:Body']['ns2:obtenerDatosIdArticulov1Response'].Articulo.precioFinal,

                  stock: result['S:Envelope']['S:Body']['ns2:obtenerDatosIdArticulov1Response'].Articulo.disponible,

                  storeId: result['S:Envelope']['S:Body']['ns2:obtenerDatosIdArticulov1Response'].Articulo.noArticulo,
                },
              },
              { new: true },
              (err2, product) => {
                if (err2)
                  res.status(500).send({
                    message: `Error al actualizar el producto: ${err2}`,
                  });
                res.status(200).send(product);
              }
            );
          } else {
            if (err) {
              res.status(500).send({ message: `Error al realizar la peticion: ${err}` });
            }
          }
        } else {
          res.status(200).send(newProduct);
        }
      });
    })
    .catch(function (err) {
      console.log(err.response.data);
      res.status(404).send({ message: `Error al encontrar el producto:` });
    });
}

export default {
  getProductDcm,
};
