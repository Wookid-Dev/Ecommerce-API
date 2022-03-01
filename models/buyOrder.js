import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const buyOrderSchema = Schema({
  store: {
    type: String,
    enum: ['CVA', 'DCM', 'TEAM', 'EXEL', 'INTCOMEX', 'CT', 'INGRAM'],
  },
  name: String,
  sku: String,
  price: String,
  delivery: String,
  stock: String,
  stock1: String,
  stock2: String,
  storage: Array,
  description: String,
  time: String,
  _id: String,
  openBox: String,
});

export default mongoose.model('Order', buyOrderSchema);
