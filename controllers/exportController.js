const { Parser } = require('json2csv');
const fs = require('fs');
const path = require('path');
const Sale = require('../models/Sale');
const Customer = require('../models/customer');
const {transporter} = require('../helpers/mailer');

const exportAndEmailSalesCSV = async (req, res) => {
  try {
    const sales = await Sale.find()
      .populate('items.product')
      .populate('soldBy', 'username');

    const formattedSales = [];

    for (const sale of sales) {
      let customerName = 'N/A';
      let customerPhone = 'N/A';
      let customerEmail = 'N/A';
      let customerAddress = 'N/A';

      if (sale.customerRef) {
        const mysqlCustomer = await Customer.findOne({
          where: { phoneNumber: sale.customerRef }
        });

        if (mysqlCustomer) {
          customerName = mysqlCustomer.name || 'N/A';
          customerPhone = mysqlCustomer.phoneNumber || 'N/A';
          customerEmail = mysqlCustomer.email || 'N/A';
          customerAddress = mysqlCustomer.address || 'N/A';
        }
      }

      formattedSales.push({
        SaleID: sale._id.toString(),
        TotalAmount: sale.totalAmount,
        SoldBy: sale.soldBy.username || 'Unknown',
        Date: sale.soldAt.toISOString(),
        CustomerName: customerName,
        CustomerPhone: customerPhone,
        CustomerEmail: customerEmail,
        CustomerAddress: customerAddress,
        Items: sale.items.map(i => `${i.name || 'Unknown'} x${i.quantity}`).join('; ')
      });
    }

    const parser = new Parser();
    const csv = parser.parse(formattedSales);

    const exportDir = path.join(__dirname, '../exports');
    if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir);

    const filePath = path.join(exportDir, 'sales-report.csv');
    fs.writeFileSync(filePath, csv);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: req.body.email || 'yeshwanth.gobburi@gmail.com',
      subject: 'Sales Report CSV',
      text: 'Attached is your sales report.',
      attachments: [
        {
          filename: 'sales-report.csv',
          path: filePath
        }
      ]
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: 'CSV generated and sent via email!' });

  } catch (err) {
    console.error('CSV Email Error:', err);
    res.status(500).json({ error: err.message || 'Failed to export and email CSV' });
  }
};

module.exports = { exportAndEmailSalesCSV };




