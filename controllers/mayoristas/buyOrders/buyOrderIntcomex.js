import 'dotenv/config';

import axios from 'axios';

function postBuyOrderIntcomex(req, res) {
  let orderId = req.body.numeroOrden;
  let sku = req.body.sku;
  let quantity = req.body.cantidad;

  var data = JSON.stringify({
    CustomerOrderNumber: `${orderId}`,
    Tag: 'Sirscom Order',
    Items: [
      {
        Sku: `${sku}`,
        Quantity: `${quantity}`,
      },
    ],
  });
  var config = {
    method: 'post',
    url: 'https://intcomex-prod.apigee.net/v1/placeorder',
    headers: {
      Authorization: `${process.env.BEARER_INT}`,
      'Content-Type': 'application/json',
      Host: 'intcomex-test.apigee.net',
    },
    data: data,
  };

  axios(config)
    .then(function (response) {
      console.log(JSON.stringify(response.data));

      res.status(200).send(response.data);
    })

    .catch(function (err) {
      console.log(err);
      console.log(err['response']['data']);
      res.status(400).send({
        message: `Error: ${err['response']['data']['ErrorCode']}, message: ${err['response']['data']['Message']}`,
      });
    });
}

export default {
  postBuyOrderIntcomex,
};
