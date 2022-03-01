import 'dotenv/config';

import axios from 'axios';
import parser from 'fast-xml-parser';

async function getMarcasExel(req, res) {
  var data =
    '<?xml version="1.0" encoding="utf-8"?>' +
    '<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">' +
    '<soap12:Body>' +
    '<Obtener_Marcas xmlns="http://ws.exel.com.mx:8181/">' +
    `<Usuario>${process.env.USUARIO_EXEL}</Usuario>` +
    `<Password>${process.env.PASS_EXEL}</Password>` +
    '</Obtener_Marcas>' +
    '</soap12:Body>' +
    '</soap12:Envelope>';

  var config = {
    method: 'post',
    url: 'http://ws.exel.com.mx:8181/xL4.asmx',
    headers: {
      'Content-Type': 'text/xml',
    },
    data: data,
  };

  axios(config)
    .then(function (response) {
      console.log('---------------------------EXEL MARCAS---------------------------');
      var xml = parser.parse(response.data);
      var result = xml['soap:Envelope']['soap:Body']['Obtener_MarcasResponse']['Obtener_MarcasResult'];

      res.status(200).send(result);
    })
    .catch(function (err) {
      console.log(`###### ${err} ###### \n ###### fallo en EXEL MARCAS ######`);
      console.log(err);
      res.status(404).send({ message: `Error al realizar la llamada` });
    });
}

export default {
  getMarcasExel,
};
