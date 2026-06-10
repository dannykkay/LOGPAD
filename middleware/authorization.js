const { UnauthenticatedError } = require('../errors');

const authorizePermissions = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new UnauthenticatedError(
        'Not authorized to access this route'
      );
                                              }

    next();
  };
};

module.exports = authorizePermissions;