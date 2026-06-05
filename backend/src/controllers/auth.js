// Contrôleur d'authentification : connexion et profil.
// Il n'y a PAS d'inscription publique : un disciple est créé par son dirigeant
// (voir controllers/disciples.js) ou par le seed initial.
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Disciple, EgliseDeMaison } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'cmci_secret_dev';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

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
        region: disciple.region,
        photoUrl: disciple.photoUrl,
        niveauFormation: disciple.niveauFormation,
      },
    });
  } catch (err) {
    console.error('Erreur login:', err);
    return res.status(500).json({ message: 'Erreur interne' });
  }
}

// GET /api/auth/me — retourner le profil du disciple connecté (avec son église)
async function me(req, res) {
  try {
    const disciple = await Disciple.findByPk(req.user.id, {
      attributes: { exclude: ['motDePasse'] },
      include: [{ model: EgliseDeMaison, as: 'eglise', attributes: ['idEglise', 'nomEglise', 'ville', 'pays', 'region'] }],
    });
    if (!disciple) return res.status(404).json({ message: 'Utilisateur introuvable' });
    return res.json(disciple);
  } catch (err) {
    console.error('Erreur me:', err);
    return res.status(500).json({ message: 'Erreur interne' });
  }
}

// PUT /api/auth/me — chaque utilisateur modifie SON propre profil.
// On limite volontairement les champs modifiables : un disciple ne peut pas
// changer son rôle, son église ou son pays lui-même (réservé aux dirigeants/leaders).
async function updateProfile(req, res) {
  try {
    const disciple = await Disciple.findByPk(req.user.id);
    if (!disciple) return res.status(404).json({ message: 'Utilisateur introuvable' });

    const { nom, prenom, telephone, photoUrl } = req.body;
    await disciple.update({ nom, prenom, telephone, photoUrl });

    const profil = await Disciple.findByPk(req.user.id, { attributes: { exclude: ['motDePasse'] } });
    return res.json(profil);
  } catch (err) {
    console.error('Erreur updateProfile:', err);
    return res.status(400).json({ message: 'Données invalides', error: err.message });
  }
}

// PUT /api/auth/password — l'utilisateur change son propre mot de passe.
// On vérifie d'abord l'ancien mot de passe pour éviter qu'un token volé suffise.
async function changePassword(req, res) {
  try {
    const { ancienMotDePasse, nouveauMotDePasse } = req.body;
    if (!ancienMotDePasse || !nouveauMotDePasse) {
      return res.status(400).json({ message: 'Ancien et nouveau mot de passe requis' });
    }
    if (nouveauMotDePasse.length < 6) {
      return res.status(400).json({ message: 'Le nouveau mot de passe doit faire au moins 6 caractères' });
    }

    const disciple = await Disciple.findByPk(req.user.id);
    if (!disciple) return res.status(404).json({ message: 'Utilisateur introuvable' });

    const valide = await bcrypt.compare(ancienMotDePasse, disciple.motDePasse);
    if (!valide) return res.status(401).json({ message: 'Ancien mot de passe incorrect' });

    await disciple.update({ motDePasse: await bcrypt.hash(nouveauMotDePasse, 10) });
    return res.json({ message: 'Mot de passe modifié avec succès' });
  } catch (err) {
    console.error('Erreur changePassword:', err);
    return res.status(500).json({ message: 'Erreur interne' });
  }
}

module.exports = { login, me, updateProfile, changePassword };
