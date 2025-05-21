const cloudinary = require('../config/cloudinary');
const Image = require('../models/image');

const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    // Upload image to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path);

    // Save image details to MongoDB
    const newImage = new Image({
      url: result.secure_url,
      publicId: result.public_id,
      uploadedBy: req.user._id, 
    });

    await newImage.save();

    res.status(201).json({
      message: 'Image uploaded successfully',
      image: newImage,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading image', error });
  }
};

module.exports = { uploadImage };
