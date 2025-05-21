const Product = require('../models/products');
const Category = require('../models/category');
const { toIST } = require('../helpers/timeZone');

const missingFields = [];

// Create Product(s)
const createProduct = async (req, res) => {
  try {
    const { name, price, quantity, categoryName, gstRate, taxMode, hasCess } = Prod;
    const products = Array.isArray(req.body) ? req.body : [req.body];
    const savedProducts = [];

    for (const prod of products) {
      const { name, price, quantity, categoryName } = prod;

      if (!name) missingFields.push('name')
      if (!price) missingFields.push('price')
      if (!categoryName) missingFields.push('category name')
        
        if(missingFields > 0)
          return res.json({
            error: `Missing required fields: ${missingFields.join(", ")}`,
        })

      // Check or create category
      let category = await Category.findOne({ name: categoryName.trim() });
      if (!category) {
        category = await Category.create({ name: categoryName.trim() });
      }


      const newProduct = await Product.create({
        name,
        price,
        quantity,
        categoryName: category.name,
        category: category._id,
        gstRate: gstRate || 18,
        taxMode: taxMode || 'exclusive',
        hasCess: hasCess || false
      });

      savedProducts.push(newProduct);
    }

    res.status(201).json({ 
      message : `product saved `,
      createdAt : toIST(new Date()),
      savedProducts});
  } catch (error) {
    console.error('Error creating product:', error.message);
    res.status(500).json({ error: 'Failed to create product(s)' });
  }
};


// Get All Products
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().populate('category', 'name');
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

// Get Product by ID
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching product' });
  }
};


// Get All Categories
const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    if (categories.length === 0) {
      return res.status(404).json({ error: 'No categories found' });
    }
    res.status(200).json({ categories });
  } catch (err) {
    console.log('Error fetching categories:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};


//Get products by category
const getProductsByCategory = async (req, res) => {
  try {
    const categoryName = req.params.categoryName.trim();

    console.log('Category name received:', categoryName);

    // Find the category by name (case-insensitive)
    const category = await Category.findOne({
      name: { $regex: new RegExp(`^${categoryName}$`, 'i') }
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Find products that belong to the category
    const products = await Product.find({ category: category._id })
      .populate('category', 'name');

    if (!products.length) {
      return res.status(404).json({ error: 'No products found for this category' });
    }

    res.status(200).json({ products });

  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products for this category' });
  }
};





// Update Product

const updateProduct = async (req, res) => {
  const { name, price, quantity, gstRate, taxMode, hasCess } = req.body;

  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { name, price, quantity, gstRate, taxMode, hasCess },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.status(200).json({
      message : `updated successfully`,
      createdAt : toIST(new Date()),
      product});
  } catch (err) {
    res.status(500).json({ error: 'Failed to update product' });
  }
};

// Delete Product(s)
const deleteProduct = async (req, res) => {
  try {
    if (req.body.id) {
      // Delete a single product
      const product = await Product.findByIdAndDelete(req.body.id);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      res.status(200).json({ message: 'Product deleted successfully' });
    } else if (req.body.ids && Array.isArray(req.body.ids)) {
      // Delete multiple products
      await Product.deleteMany({ _id: { $in: req.body.ids } });
      res.status(204).json({
         message: 'Products deleted successfully',
        deletedAt : toIST(new Date())
       });
    } else {
      return res.status(400).json({ message: 'Please provide an body id or an array of ids' });
    }
  } catch (err) {
    console.error('Error deleting products', err);
    res.status(500).json({ message: 'Failed to delete products' });
  }
};

module.exports = {  createProduct,
                    getAllProducts,
                    getProductById,
                    getAllCategories,
                    getProductsByCategory,
                    updateProduct, 
                    deleteProduct };
