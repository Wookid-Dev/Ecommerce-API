import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const ProductSchema = Schema({
  store: {
    type: String,
    enum: [
      'PCEL',
      'CYBERPUERTA',
      'PCH',
      'INTERCOMPRAS',
      'SAMS',
      'OFFICEDEPOT',
      'WALMART',
      'COSTCO',
      'CVA',
      'DCM',
      'TEAM',
      'EXEL',
      'INTCOMEX',
      'CT',
      'INGRAM',
      'PC-CONSUMIBLES',
      'AZERTY',
      'COMPU-SOLUCIONES',
      'NEWKO',
    ],
  },
  name: String,
  sku: String,
  price: String,
  delivery: String,
  stock: String,
  storage: Array,
  description: String,
  time: String,
  _id: String,
  storeId: String,
  openBox: String,
});

export default mongoose.model('Product', ProductSchema);
