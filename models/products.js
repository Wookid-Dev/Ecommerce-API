import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const ProductsSchema = Schema({
  _id: String,
  products: Array,
  matches: Array,
});

export default mongoose.model('Products', ProductsSchema);
