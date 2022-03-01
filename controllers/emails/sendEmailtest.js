import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

function sendEmailTest(req, res) {
  const msg = {
    to: 'isaacsanchez016@gmail.com', // Change to your recipient
    from: 'ventas@clicksale.mx', // Change to your verified sender
    subject: 'Sending with SendGrid is Fun',
    text: 'and easy to do anywhere, even with Node.js',
    html: ' ',
  };
  sgMail
    .send(msg)
    .then(() => {
      console.log('Email sent');
    })
    .catch((error) => {
      console.error(error);
    });
}

export default {
  sendEmailTest,
};
