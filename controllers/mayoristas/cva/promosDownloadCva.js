import axios from 'axios';
import parser from 'fast-xml-parser';

function getPromoCva(req, res) {
  var config = {
    method: 'get',
    url: `http://www.grupocva.com/catalogo_clientes_xml/lista_precios.xml?cliente=28911&marca=%&grupo=%&clave=%&codigo=%`,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  axios(config)
    .then(function (response) {
      console.log(response);
      let result = parser.parse(response.data);
      console.log(result);
      res.status(200).send({ result });
    })
    .catch(function (err) {
      res.status(404).send({ message: `Error al realizar la llamada:` });
      console.log(err);
    });
}

export default {
  getPromoCva,
};
