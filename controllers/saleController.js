const Sale = require('../models/Sale');
const Product = require('../models/products');
const Customer = require('../models/customer'); 
const nodemailer = require('nodemailer');


const GST_PERCENT = 18; // 18% GST
const CESS_PERCENT = 1; // Optional cess (can be 0 or dynamic)


const sendLowStockAlert = async (product) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: 'yeshwanth.gobburi@nukkadshops.com',
    subject: `Low Stock Alert: ${product.name}`,
    text: `The stock for ${product.name} is low. Current stock: ${product.quantity}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Low stock alert sent for ${product.name}`);
  } catch (error) {
    console.error(`Failed to send low stock alert for ${product.name}:`, error);
  }
};


const checkoutCart = async (req, res) => {
  const { items, Customer, taxMode = 'exclusive', applyCess = false } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Cart is empty or invalid format' });
  }

  if (product.quantity <= product.lowStockThreshold) {
    await sendLowStockAlert(product);
  }

  try {
    let subtotal = 0;
    let saleItems = [];
    let customerRecord = null;

    // Handle customer
    if (customer?.phoneNumber) {
      customerRecord = await Customer.findOne({ where: { phoneNumber: Customer.phoneNumber } });

      if (!customerRecord) {
        customerRecord = await Customer.create({
          name: customer.name,
          phoneNumber: customer.phoneNumber,
          email: customer.email || null,
          address: customer.address || null,
        });
      }
    }

    // Process items
    for (const item of items) {
      const { name, quantity } = item;
      const product = await Product.findOne({ name });

      if (!product) return res.status(404).json({ error: `Product not found: ${name}` });
      if (product.quantity < quantity) {
        return res.status(400).json({ error: `Insufficient stock for: ${name}` });
      }

      product.quantity -= quantity;
      await product.save();

      const lineAmount = product.price * quantity;
      subtotal += lineAmount;

      saleItems.push({
        product: product._id,
        name: product.name,
        quantity,
        priceAtSale: product.price,
      });
    }

    // Tax Calculation
    let cgst = 0, sgst = 0, igst = 0, cess = 0, totalGST = 0, totalAmount = subtotal;

    if (taxMode === 'exclusive') {
      const gstAmount = (subtotal * GST_PERCENT) / 100;
      cgst = gstAmount / 2;
      sgst = gstAmount / 2;
      cess = applyCess ? (subtotal * CESS_PERCENT) / 100 : 0;
      totalGST = gstAmount + cess;
      totalAmount = subtotal + totalGST;
    } else if (taxMode === 'inclusive') {
      const baseAmount = subtotal / (1 + GST_PERCENT / 100);
      const gstAmount = subtotal - baseAmount;
      cgst = gstAmount / 2;
      sgst = gstAmount / 2;
      cess = applyCess ? (baseAmount * CESS_PERCENT) / 100 : 0;
      totalGST = gstAmount + cess;
      subtotal = baseAmount;
      totalAmount = subtotal + totalGST;
    }

    // Save Sale
    const newSale = new Sale({
      items: saleItems,
      taxMode,
      subtotal: parseFloat(subtotal.toFixed(2)),
      cgst: parseFloat(cgst.toFixed(2)),
      sgst: parseFloat(sgst.toFixed(2)),
      igst: parseFloat(igst.toFixed(2)),
      cess: parseFloat(cess.toFixed(2)),
      totalGST: parseFloat(totalGST.toFixed(2)),
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      soldBy: req.user.userId,
      customerRef: customerRecord?.phoneNumber || null,
    });

    await newSale.save();

    res.status(201).json({
      message: 'Sale completed',
      receipt: {
        id: newSale._id,
        items: saleItems,
        taxMode,
        subtotal: newSale.subtotal,
        cgst: newSale.cgst,
        sgst: newSale.sgst,
        cess: newSale.cess,
        totalGST: newSale.totalGST,
        totalAmount: newSale.totalAmount,
      },
    });
  } catch (err) {
    console.error('Checkout Error:', err.message);
    res.status(500).json({ error: 'Failed to process sale' });
  }
};


// To Fetch All Sales (Read)        
const getSales = async (req, res) => {
    try {
      const sales = await Sale.find()
        .populate('items.product', 'name price') // show product info
        .populate('soldBy', 'username role')     // show seller info
        .sort({ soldAt: -1 });                    // latest first
  
      res.json({ count: sales.length, sales });
    } catch (err) {
      console.error('Failed to fetch sales:', err);
      console.error('Failed to fetch sales:', err.message);
      res.status(500).json({ error: 'Failed to get sales' });
    }
  };


//Return Sale Items
const processReturn = async (req, res) => {
  const { saleId } = req.params;
  const { items } = req.body; // [{ itemName, quantity, reason }]

  try {
    const sale = await Sale.findById(saleId);
    if (!sale) return res.status(404).json({ error: 'Sale not found' });

    const returnEntries = [];

    for (const returnedItem of items) {
      const saleItem = sale.items.find(i => i.name === returnedItem.itemName);
      if (!saleItem) {
        return res.status(400).json({ error: `Item ${returnedItem.itemName} not found in sale` });
      }

      if (returnedItem.quantity > saleItem.quantity) {
        return res.status(400).json({ error: `Return quantity exceeds purchased quantity for ${returnedItem.itemName}` });
      }

      // Update product stock
      const product = await Product.findOne({ name: returnedItem.itemName });
      if (product) {
        product.quantity += returnedItem.quantity;
        await product.save();
      }

      // Prepare return entry
      returnEntries.push({
        itemName: returnedItem.itemName,
        quantity: returnedItem.quantity,
        reason: returnedItem.reason || 'No reason provided',
        refundIssued: false
      });
    }

    // Add to sale returns
    sale.returns = sale.returns.concat(returnEntries);
    await sale.save();

    res.status(200).json({ message: 'Return processed successfully', returns: returnEntries });

  } catch (err) {
    console.error('Return error:', err);
    res.status(500).json({ error: 'Failed to process return' });
  }
};

  

module.exports = { checkoutCart, getSales, processReturn };




