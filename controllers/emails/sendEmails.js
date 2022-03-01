import axios from 'axios';

function sendEmail(req, res) {
  var subject = req.headers.subject;
  var to = req.headers.to;
  var name = req.headers.name;
  var subject = req.headers.subject;
  var html = req.headers.html;
  var key = req.headers.key;

  var data = JSON.stringify({
    personalizations: [
      {
        to: [
          {
            email: `${to}`,
            name: `${name}`,
          },
        ],
      },
    ],
    from: {
      email: 'ventas@clicksale.mx',
      name: 'Click Sale Ventas',
    },
    reply_to: {
      email: 'ventas@clicksale.mx',
      name: 'Click Sale Ventas',
    },
    subject: `${subject}`,
    content: [
      {
        type: 'text/html',
        value: `${html}`,
      },
    ],
    attachments: [
      {
        content: 'test',
        filename: 'index.html',
        type: 'text/html',
        disposition: 'attachment',
      },
    ],
  });

  var config = {
    method: 'post',
    url: 'https://api.sendgrid.com/v3/mail/send',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    data: data,
  };

  axios(config)
    .then(function (response) {
      console.log(JSON.stringify(response.data));
      res.status(200).send({ message: 'Mail enviado' });
    })
    .catch(function (error) {
      console.log(error);
      res.status(400).send({ message: 'No se pudo enviar el correo' });
    });
}

export default {
  sendEmail,
};
