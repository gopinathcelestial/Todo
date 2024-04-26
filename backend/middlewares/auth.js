const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    try {
        // Changed from 'token' to 'authorization' to match how it's set in the signin route
        const tokenWithBearer = req.cookies.authorization;
        if (!tokenWithBearer) {
            return res.status(403).json({ message: 'Token is not provided' });
        }

        // Split the 'Bearer' from the actual token
        const token = tokenWithBearer.split(' ')[1];
        if (!token) {
            return res.status(403).json({ message: 'Bearer token malformed' });
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            req.user = {
                email: decoded.email,
                token
            };
            next();
        });
    } catch (error) {
        res.status(403).json({ message: 'Error: ' + error });
    }
};

module.exports = { verifyToken };
