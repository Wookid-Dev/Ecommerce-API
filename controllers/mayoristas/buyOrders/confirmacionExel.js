import 'dotenv/config';

import axios from 'axios';
import parser from 'fast-xml-parser';

function postConfirmationExel(req, res) {
  let orderId = req.body.numeroOrden; //SC_OV_EX_01

  var data =
    `<?xml version="1.0" encoding="utf-8"?>` +
    `<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">` +
    `<soap:Body>` +
    `<Confirmar_Pre_Orden_Venta xmlns="http://ws.exel.com.mx:8181/">` +
    `<Usuario>${process.env.USUARIO_EXEL}</Usuario>` +
    `<Password>${process.env.PASS_EXEL}</Password>` +
    `<Orden>${orderId}</Orden>` +
    `</Confirmar_Pre_Orden_Venta>` +
    `</soap:Body>` +
    `</soap:Envelope>`;

  var config = {
    method: 'post',
    url: 'http://ws.exel.com.mx:8181/XLStoreFacade.asmx',
    headers: {
      'Content-Type': 'text/xml',
    },
    data: data,
  };

  axios(config)
    .then(function (response) {
      let xml = parser.parse(response.data);

      console.log(
        xml['soap:Envelope']['soap:Body']['Confirmar_Pre_Orden_VentaResponse']['Confirmar_Pre_Orden_VentaResult']
      );

      res.status(200).send(xml);
    })
    .catch(function (err) {
      console.log(err);
      res.status(400).send({ message: `Error: ${err}` });
    });
}

export default {
  postConfirmationExel,
};
