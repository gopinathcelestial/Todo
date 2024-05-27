const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    try {
        const tokenWithBearer = req.cookies.authorization;
        if (!tokenWithBearer) {
            return res.status(403).json({ message: 'Authentication Error, Please login Again' });
        }

        const token = tokenWithBearer.split(' ')[1];
        if (!token) {
            return res.status(403).json({ message: 'Bearer token malformed' });
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(401).json({ message: 'Authentication Error, Please login Again' });
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
