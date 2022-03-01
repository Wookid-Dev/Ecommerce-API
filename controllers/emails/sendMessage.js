import 'dotenv/config'

import client from ('twilio')(accountSid, authToken);

const accountSid = `${process.env.ACCOUNTSID}`;
const authToken = `${process.env.AUTHTOKEN}`;

function sendMessage(req, res) {
  client.messages
    .create({
      from: 'whatsapp:+14155238886',
      to: 'whatsapp:+5215548080323',
      body: 'This is a test',
    })
    .then(function (response) {
      console.log(JSON.stringify(response.data));
      res.status(200).send({ message: 'Mensaje enviado' });
    })
    .catch(function (error) {
      console.log(error);
      res.status(400).send({ message: 'No se pudo enviar el correo' });
    });
}

export default {
  sendMessage,
};
