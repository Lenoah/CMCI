// Middlewares d'authentification et d'autorisation par rôle
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'cmci_secret_dev';

// Vérifie le token JWT et attache req.user = { id, role }
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token manquant' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.id, role: payload.role };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token invalide ou expiré' });
  }
}

// Restreint l'accès aux rôles passés en argument.
// Exemple : router.post('/', auth, requireRole('Dirigeant'), ctrl.create)
function requireRole(...rolesAutorises) {
  return (req, res, next) => {
    if (!req.user || !rolesAutorises.includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès non autorisé pour ce rôle' });
    }
    next();
  };
}

// Export principal = le middleware d'auth pour conserver la compatibilité
// On attache requireRole en propriété pour pouvoir le déstructurer ailleurs
module.exports = authMiddleware;
module.exports.requireRole = requireRole;
