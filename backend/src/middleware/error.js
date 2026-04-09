const { fail } = require('../utils/http');

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }
  const status = err.status || 500;
  const message = err.message || '服务器异常';
  return fail(res, message, status);
}

module.exports = errorHandler;
