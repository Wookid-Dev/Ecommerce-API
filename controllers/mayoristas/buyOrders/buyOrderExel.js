import 'dotenv/config';

import axios from 'axios';
import parser from 'fast-xml-parser';

function postBuyOrderExel(req, res) {
  let orderId = req.body.numeroOrden; //SC_OV_EX_01
  let warehouse = req.body.almacen;
  let address = req.body.direccionEmbarque;
  let city = req.body.ciudad;
  let quantity = req.body.cantidad;
  let sku = req.body.sku;

  var data =
    `<?xml version="1.0" encoding="utf-8"?>` +
    `<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">` +
    `<soap:Body>` +
    `<Colocar_Orden_Venta xmlns="http://ws.exel.com.mx:8181/">` +
    `<Usuario>${process.env.USUARIO_EXEL}</Usuario>` +
    `<Password>${process.env.PASS_EXEL}</Password>` +
    `<Orden>` +
    `<Id_Contrato>0</Id_Contrato>` +
    `<Id_Licitacion>0</Id_Licitacion>` +
    `<folio>0</folio>` +
    `<Notas>Prueba</Notas>` +
    `<Id_Cliente>MXL0756</Id_Cliente>` +
    `<Lineas>` +
    `<clsLinea_Orden>` +
    `<id_plan>0</id_plan>` +
    `<precio>0</precio>` +
    `<Id_Localidad>${warehouse}</Id_Localidad>` +
    //<!--MY=MONTERREY,MX=MEXICO,GD=GUADALAJARA,SA=SALTILLO,PB=PUEBLA,VR=VERACRUZ,CN=CULIACAN,CH=CHIHUAHUA,CJ=CIUDAD JUAREZ,TJ=TIJUANA,TM=TAMPICO,MD=MERIDA,TR=TORREON,LG=LEON,QR=QUERETARO-->
    `<Id_Producto>${sku}</Id_Producto>` +
    `<Cantidad>${quantity}</Cantidad>` +
    `<Cantidad_Solicitada>${quantity}</Cantidad_Solicitada>` +
    `<BackOrder>false</BackOrder>` +
    `<id_promocion>0</id_promocion>` +
    `<descuento>0</descuento>` +
    `</clsLinea_Orden>` +
    `</Lineas>` +
    `<Termino>` +
    `<id_cliente>MXL0756</id_cliente>` +
    `<id_termino_pago></id_termino_pago>` +
    `<termino_pago></termino_pago>` +
    `</Termino>` +
    `<Informacion>` +
    `<clsInformacion_Orden_Venta>` +
    `<Id_Localidad>${city}</Id_Localidad>` +
    `<Id_Direccion_Embarque>${address}</Id_Direccion_Embarque>` +
    `<Id_Transportista>MDHL</Id_Transportista>` +
    `<Numero_Orden_Cliente>${orderId}</Numero_Orden_Cliente>` +
    `</clsInformacion_Orden_Venta>` +
    `</Informacion>` +
    `<opg></opg>` +
    `<deal></deal>` +
    `<c_UsoCFDI>G01</c_UsoCFDI>` +
    `</Orden>` +
    `</Colocar_Orden_Venta>` +
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
      console.log(xml);

      res.status(200).send(xml);
    })
    .catch(function (err) {
      console.log(err);
      res.status(400).send({ message: `Error: ${err}` });
    });
}

export default {
  postBuyOrderExel,
};
