import axios from 'axios';
import parser from 'fast-xml-parser';

function catalogCtrlDcm(req, res) {
  var data =
    '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:dcm="http://dcm.com.mx.ServidorWS/">' +
    ' <soapenv:Header/> ' +
    ' <soapenv:Body> ' +
    '<dcm:getCatProduct>' +
    '<!--Optional:-->' +
    '<EncabezadoTransaccion>' +
    '<!--Optional:-->' +
    '<contrasena>B7766AB8</contrasena>' +
    '<!--Optional:-->' +
    '<usuario>RL23699</usuario>' +
    '</EncabezadoTransaccion>' +
    '</dcm:getCatProduct>' +
    '</soapenv:Body>' +
    '</soapenv:Envelope>';

  var config = {
    method: 'post',
    url: 'http://dcm.mx/ServidorDCWS/CatalogoProdWS?WSDL',
    headers: {
      'Content-Type': 'text/xml',
    },
    data: data,
  };

  axios(config)
    .then(function (response) {
      console.log('---------------------------DCM-CATALOG---------------------------');
      var result = parser.parse(response.data);
      var test = result['S:Envelope']['S:Body']['ns2:getCatProductResponse']['return'];
      console.log(test);
      res.status(200).send(result);
    })
    .catch(function (err) {
      console.log(err.response.data);
      res.status(404).send({ message: `No se pudo conseguir el catalogo` });
    });
}

export default {
  catalogCtrlDcm,
};
