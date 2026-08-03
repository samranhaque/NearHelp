const adminGuard = (req, res, next) => {
    if (req.user && req.user.email === 'municipal@community.gov.in') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as an admin' });
    }
};

module.exports = adminGuard;
