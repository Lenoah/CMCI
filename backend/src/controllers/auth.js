// Contrôleur d'authentification : inscription, connexion, profil
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Disciple } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'cmci_secret_dev';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// POST /api/auth/register — inscrire un nouveau disciple
async function register(req, res) {
  try {
    const { nom, prenom, telephone, motDePasse, pays } = req.body;
    if (!nom || !prenom || !telephone || !motDePasse) {
      return res.status(400).json({ message: 'Nom, prénom, téléphone et mot de passe sont requis' });
    }

    // Vérifier si le numéro est déjà utilisé
    const existe = await Disciple.findOne({ where: { telephone } });
    if (existe) {
      return res.status(409).json({ message: 'Ce numéro de téléphone est déjà utilisé' });
    }

    const hash = await bcrypt.hash(motDePasse, 10);
    const disciple = await Disciple.create({
      nom, prenom, telephone,
      motDePasse: hash,
      pays,
      role: 'Disciple',
      statut: 'Actif',
    });

    return res.status(201).json({
      message: 'Inscription réussie',
      idDisciple: disciple.idDisciple,
    });
  } catch (err) {
    console.error('Erreur register:', err);
    return res.status(500).json({ message: 'Erreur interne' });
  }
}

// POST /api/auth/login — connexion avec téléphone + mot de passe
async function login(req, res) {
  try {
    const { telephone, motDePasse } = req.body;

    if (!telephone || !motDePasse) {
      return res.status(400).json({ message: 'Téléphone et mot de passe requis' });
    }

    const disciple = await Disciple.findOne({ where: { telephone } });
    if (!disciple) {
      return res.status(401).json({ message: 'Identifiants invalides' });
    }

    if (disciple.statut !== 'Actif') {
      return res.status(403).json({ message: 'Compte inactif ou suspendu' });
    }

    const valide = await bcrypt.compare(motDePasse, disciple.motDePasse);
    if (!valide) {
      return res.status(401).json({ message: 'Identifiants invalides' });
    }

    // Création du token JWT avec l'id et le rôle
    const token = jwt.sign(
      { id: disciple.idDisciple, role: disciple.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({
      token,
      utilisateur: {
        idDisciple: disciple.idDisciple,
        nom: disciple.nom,
        prenom: disciple.prenom,
        telephone: disciple.telephone,
        role: disciple.role,
        pays: disciple.pays,
        niveauFormation: disciple.niveauFormation,
      },
    });
  } catch (err) {
    console.error('Erreur login:', err);
    return res.status(500).json({ message: 'Erreur interne' });
  }
}

// GET /api/auth/me — retourner le profil du disciple connecté
async function me(req, res) {
  try {
    const disciple = await Disciple.findByPk(req.user.id, {
      attributes: { exclude: ['motDePasse'] },
    });
    if (!disciple) return res.status(404).json({ message: 'Utilisateur introuvable' });
    return res.json(disciple);
  } catch (err) {
    console.error('Erreur me:', err);
    return res.status(500).json({ message: 'Erreur interne' });
  }
}

module.exports = { register, login, me };
