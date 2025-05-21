const mongoose = require ('mongoose');
const Product = require('./products');

const saleSchema = new mongoose.Schema({
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    priceAtSale: { type: Number, required: true },
  }],

  taxMode: { type: String, enum: ['inclusive', 'exclusive'], required: true },
  taxRate: { type: Number, required: true }, // eg 18 for 18%
  cgst: { type: Number, required: true },
  sgst: { type: Number, required: true },
  cess: { type: Number, default: 0 }, // Optional additional tax
  subtotal: { type: Number, required: true }, // Before tax (for exclusive) or derived
  totalGST: { type: Number, required: true },
  totalAmount: { type: Number, required: true }, // Final after tax and cess

  soldBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  soldAt: { type: Date, default: Date.now },

  returns: [{
    itemName: String,
    quantity: Number,
    reason: String,
    date: { type: Date, default: Date.now },
    refundIssued: { type: Boolean, default: false }
  }]
});

module.exports = mongoose.model('Sale', saleSchema);

