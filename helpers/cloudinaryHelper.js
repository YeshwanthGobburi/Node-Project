const cloudinary = require('../config/cloudinary');

const uploadCloudinary = async (filePath) => {
  try {
    console.log("Uploading to Cloudinary:", filePath);
    const result = await cloudinary.uploader.upload(filePath, { timeout: 300000 });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error('Error while uploading to Cloudinary:', error);
    throw new Error(`Cloudinary upload failed: ${error.message || 'Unknown error'}`);
  }
};

module.exports = { uploadCloudinary };
