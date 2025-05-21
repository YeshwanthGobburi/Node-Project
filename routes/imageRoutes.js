const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { uploadImage } = require('../controllers/image-controller');

router.post('/uploads', upload.single('image'), uploadImage);

module.exports = router;
