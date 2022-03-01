import axios from 'axios';
import parser from 'fast-xml-parser';

function postBuyOrderDcm(req, res) {
  let sku = req.body.sku;
  let quantity = req.body.cantidad;
  let warehouse = req.body.almacen;
  let commentaries = req.body.observaciones;
  let orderId = req.body.folio;
  console.log(req.body);

  var data =
    `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:dcm="http://dcm.com.mx.ServidorWS/">` +
    `<soapenv:Header/>` +
    `<soapenv:Body>` +
    `<dcm:LevantamientoOCv1>` +
    `<EncabezadoTransaccion>` +
    `<contrasena>B7766AB8</contrasena>` +
    `<usuario>RL23699</usuario>` +
    `</EncabezadoTransaccion>` +
    `<OrdenCompraDireccion>` +
    `<detalleOC>` +
    `<articulo>${sku}</articulo>` +
    `<cantidad>${quantity}</cantidad>` +
    `<codigoAlmacen>${warehouse}</codigoAlmacen>` +
    `</detalleOC>` +
    `<encabezadoOC>` +
    `<claveDireccion></claveDireccion>` +
    `<observaciones>${commentaries}</observaciones>` +
    `<paqueteria></paqueteria>` +
    `</encabezadoOC>` +
    `</OrdenCompraDireccion>` +
    `<OrdenCompra>${orderId}</OrdenCompra>` +
    `</dcm:LevantamientoOCv1>` +
    `</soapenv:Body>` +
    `</soapenv:Envelope>`;

  var config = {
    method: 'post',
    url: 'http://www.dcm.com.mx:8081/ServidorDCWS/GeneracionPedidov1',
    headers: {
      'Content-Type': 'text/xml',
    },
    data: data,
  };
  axios(config)
    .then(function (response) {
      try {
        var order = response.data;
        console.log(response.data[0]);
        res.status(200).send(order);
      } catch (err) {
        console.log(err);
        res.status(400).send(err);
      }
    })
    .catch(function (err) {
      console.log(err['response']['data']);
      let errorXml = parser.parse(err['response']['data']);
      let message = errorXml['S:Envelope']['S:Body']['S:Fault'].faultstring;

      res.status(400).send({ message: `Error: ${message}` });
    });
}

export default {
  postBuyOrderDcm,
};
