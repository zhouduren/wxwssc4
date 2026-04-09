const { fail } = require('../utils/http');
const { verifyToken } = require('../utils/jwt');

function auth(requiredRole) {
  return (req, res, next) => {
    const authorization = req.headers.authorization || '';
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
    if (!token) {
      return fail(res, '未登录或登录已失效', 401);
    }
    try {
      const user = verifyToken(token);
      req.user = user;
      if (requiredRole && user.role !== requiredRole) {
        // 商家也可以访问 user 接口
        if (requiredRole === 'user' && user.role === 'merchant') {
          return next();
        }
        return fail(res, '权限不足', 403);
      }
      return next();
    } catch (error) {
      return fail(res, 'token无效', 401);
    }
  };
}

module.exports = auth;
