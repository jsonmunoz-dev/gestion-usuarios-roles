const { unauthorized, forbidden } = require('../errors');

// Valida el header "Authorization: Bearer <token>" y deja el usuario en req.user.
function authenticate(tokenService) {
  return (req, _res, next) => {
    const header = req.get('authorization') || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return next(unauthorized());
    }
    try {
      const payload = tokenService.verifyAccessToken(token);
      req.user = { id: Number(payload.sub), role: payload.role };
      return next();
    } catch {
      return next(unauthorized('Token inválido o expirado'));
    }
  };
}

// Permite el acceso solo a los roles indicados. Debe ir después de authenticate().
function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(unauthorized());
    if (!roles.includes(req.user.role)) return next(forbidden());
    return next();
  };
}

module.exports = { authenticate, requireRole };
