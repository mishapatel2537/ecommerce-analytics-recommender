// Development auth stubs. Swap this file for the real JWT middleware
// (keep the export names `protect` and `requireAdmin`).
//   x-test-user-id: <a User _id>        -> logged-in user
//   x-test-role:    admin | customer    -> role (defaults to customer)

exports.protect = (req, res, next) => {
  const id = req.header('x-test-user-id');
  if (!id) {
    return res.status(401).json({ message: 'Not authenticated (stub: send x-test-user-id header)' });
  }
  req.user = { id, role: req.header('x-test-role') || 'customer' };
  next();
};

exports.requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  res.status(403).json({ message: 'Admin only' });
};
