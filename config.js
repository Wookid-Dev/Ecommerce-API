export default {
  port: process.env.PORT || 3000,
  db: process.env.MONGODB || 'mongodb://0.0.0.0:27017/shop',
  SECRET_TOKEN: 'clavetokens',
};
