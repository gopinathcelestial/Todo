const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(403).json({ message: 'Token is not provided' });
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
