const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  price:      { type: Number, required: true }, // Can be inclusive or exclusive based on tax-mode
  quantity:   { type: Number, default: 0 },
  lowStockThreshold: { type: Number, default: 10 },
  categoryName: { type: String, required: true },
  category:   { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },

  // Optional Tax Fields
  gstRate:    { type: Number, default: 18 }, // Can be 0 for non-taxable items
  taxMode:    { type: String, enum: ['inclusive', 'exclusive'], default: 'exclusive' },
  hasCess:    { type: Boolean, default: false },

  createdAt:  { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
