function ok(res, data = null, message = 'success') {
  return res.json({ code: 0, message, data });
}

function fail(res, message = '请求失败', code = 400, data = null) {
  return res.status(code).json({ code, message, data });
}

module.exports = { ok, fail };
