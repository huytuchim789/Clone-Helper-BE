const jwt = require('jsonwebtoken');
const config = require('../config');

const requireAuth = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ message: 'Authentication invalid.' });
  }

  try {
    const decodedToken = jwt.verify(token.slice(7), config.jwt.secret, {
      algorithm: 'HS256',
      expiresIn: config.jwt.expiry
    });

    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(401).json({
      message: error.message
    });
  }
};

const requireAdmin = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ message: 'Authentication invalid.' });
  }

  try {
    const decodedToken = jwt.verify(token.slice(7), config.jwt.secret, {
      algorithm: 'HS256',
      expiresIn: config.jwt.expiry
    });

    if (decodedToken.role !== 'admin')
      return res.status(403).json({
        message: 'Only Admin can do this operation'
      });
    next();
  } catch (error) {
    return res.status(401).json({
      message: error.message
    });
  }
};
module.exports = { requireAuth, requireAdmin };
