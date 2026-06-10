
const errorHandler = (err, req, res, next) => {
  const customError = {
    statusCode: err.statusCode || 500,
    msg: err.message || 'Something went wrong',
  };
 // Invalid MongoDB ObjectId
  if (err.name === 'CastError') {
    customError.msg = `No item found with id: ${err.value}`;
    customError.statusCode = 404;
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    customError.msg = Object.values(err.errors)
      .map((item) => item.message)
      .join(', ');

    customError.statusCode = 400;
  }

  // Duplicate values
  
 if (err.code && err.code === 11000) {
    customError.msg = `Duplicate value entered for ${
      Object.keys(err.keyValue)
    } field`;

    customError.statusCode = 400;
  }
  return res.status(customError.statusCode).json({
    success: false,
    msg: customError.msg,
  });
};

module.exports = errorHandler;