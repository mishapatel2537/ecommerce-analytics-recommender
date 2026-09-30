// TEMP stub until A's real JWT middleware is merged
exports.protect = (req, res, next) => {
  req.user = { id: req.header('x-test-user-id') };
  next();
};