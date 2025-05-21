const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  // Check if Authorization header is present
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access Denied, no token provided' });
  }

  const token = authHeader.split(' ')[1]; 

  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    req.user = decoded; 
    next();
  });
  const refreshToken = (req, res) => {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ error: 'Refresh token missing' });
  
    jwt.verify(token, process.env.JWT_REFRESH_KEY, (err, decoded) => {
      if (err) return res.status(403).json({ error: 'Invalid refresh token' });
  
      const accessToken = jwt.sign(
        { userId: decoded.userId },
        process.env.JWT_SECRET_KEY,
        { expiresIn: '15m' }
      );
  
      res.json({ accessToken });
    });
    res.json({ refreshToken });
  };
};



module.exports = authenticateToken;



