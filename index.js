import moongose from 'mongoose';
import app from './app.js';
import config from './config.js';

moongose.connect(
  config.db,
  { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true },
  (err, res) => {
    if (err) {
      return console.log(`-----ERROR AL CONECTAR CON LA BASE DE DATOS-----\n ${err}`);
    }
    console.log('---------....CONEXION ESTABLECIDA....---------');

    app.listen(config.port, () => {
      console.log(`CLICK SALE API: http://localhost: ${config.port}`);
    });
  }
);
