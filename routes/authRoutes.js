const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {register,
       login, 
       refreshToken, 
       updateProfile, 
       sendOtp, 
       resetPassword, 
       deactivateAccount, 
       sendReactivationOtp,
       reactivateWithOtp  } = require('../controllers/authController');


// Register
router.post('/register', register);

// Login
router.post('/login', login);

// Refresh token 
router.post('/refresh-token', refreshToken);

// Update Profile (protected)
router.put('/profile', auth, updateProfile);

// Forgot-password
router.post('/forgot-password', sendOtp);

// Reset-password
router.post('/reset-password', resetPassword);

// Deactivate account
router.post('/deactivate', auth, deactivateAccount);

// OTP for Re-Activation
router.post('/send-reactivation-otp', sendReactivationOtp);

// Re-Activate account
router.post('/reactivate-with-otp', reactivateWithOtp)

module.exports = router;



