function requireVerified(req, res, next) {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'unauthenticated' });
  if (!user.isVerified) return res.status(403).json({ error: 'verification_required' });
  return next();
}

module.exports = { requireVerified };
