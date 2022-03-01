import axios from 'axios';
import parser from 'fast-xml-parser';

function getMarcasCva(req, res) {
  var config = {
    method: 'get',
    url: 'http://www.grupocva.com/catalogo_clientes_xml/marcas.xml',
    headers: {},
  };

  axios(config)
    .then(function (response) {
      console.log('---------------------------DCM MARCAS---------------------------');
      var xml = parser.parse(response.data);
      console.log(xml);
      var result = xml['marcas']['marca'];
      console.log(result);

      res.status(200).send({ marcas: result });
    })
    .catch(function (error) {
      console.log(`###### ${err} ###### \n ###### fallo en DCM MARCAS ######`);
      console.log(err);
      res.status(404).send({ message: `Error al realizar la llamada` });
    });
}

export default {
  getMarcasCva,
};
