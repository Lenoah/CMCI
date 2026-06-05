const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// ─────────────────────────────────────────────────────────────
// 1. Disciple
// ─────────────────────────────────────────────────────────────
const Disciple = sequelize.define(
  'Disciple',
  {
    idDisciple: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nom: { type: DataTypes.STRING(100), allowNull: false },
    prenom: { type: DataTypes.STRING(100), allowNull: false },
    telephone: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    motDePasse: { type: DataTypes.STRING(255), allowNull: false },
    // Photo de profil stockée en data URL base64 (image redimensionnée côté client).
    // MEDIUMTEXT car une data URL dépasse la taille d'un VARCHAR/TEXT classique.
    photoUrl: { type: DataTypes.TEXT('medium'), allowNull: true },
    pays: { type: DataTypes.STRING(100) },
    // Sous-région d'appartenance (ex : « Afrique Centrale »).
    // Permet à un Leader Régional de ne voir que les disciples de sa région.
    region: { type: DataTypes.STRING(100), allowNull: true },
    role: {
      type: DataTypes.ENUM(
        'Disciple',
        'Dirigeant',
        'LeaderNat',
        'LeaderReg',
        'LeaderMon',
        'RespContenus'
      ),
      defaultValue: 'Disciple',
    },
    zoneCouverture: { type: DataTypes.STRING(100), allowNull: true },
    niveauFormation: { type: DataTypes.INTEGER, defaultValue: 1 },
    statut: {
      type: DataTypes.ENUM('Actif', 'Inactif', 'Suspendu'),
      defaultValue: 'Actif',
    },
    dateCreation: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: 'Disciple',
    freezeTableName: true,
    underscored: true,
    timestamps: true,
  }
);

// ─────────────────────────────────────────────────────────────
// 2. EgliseDeMaison
// ─────────────────────────────────────────────────────────────
const EgliseDeMaison = sequelize.define(
  'EgliseDeMaison',
  {
    idEglise: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nomEglise: { type: DataTypes.STRING(150), allowNull: false },
    ville: { type: DataTypes.STRING(100) },
    pays: { type: DataTypes.STRING(100) },
    // Sous-région de l'église (ex : « Afrique Centrale ») — utilisée par le
    // cloisonnement des Leaders Régionaux qui ne voient que les églises de leur région.
    region: { type: DataTypes.STRING(100), allowNull: true },
    capaciteMax: { type: DataTypes.INTEGER },
    statutEglise: {
      type: DataTypes.ENUM('Active', 'Inactive', 'Fermee'),
      defaultValue: 'Active',
    },
    dateCreation: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: 'EgliseDeMaison',
    freezeTableName: true,
    underscored: true,
    timestamps: true,
  }
);

// ─────────────────────────────────────────────────────────────
// 3. RoutineSpirituelle
// ─────────────────────────────────────────────────────────────
const RoutineSpirituelle = sequelize.define(
  'RoutineSpirituelle',
  {
    idRoutine: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    typeRoutine: {
      type: DataTypes.ENUM(
        'Lecture',
        'Meditation',
        'PriereSeule',
        'PriereCollective',
        'Jeune'
      ),
      allowNull: false,
    },
    dateRoutine: { type: DataTypes.DATEONLY, allowNull: false },
    dureeMinutes: { type: DataTypes.INTEGER },
    notes: { type: DataTypes.TEXT, allowNull: true },
    dateSaisie: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: 'RoutineSpirituelle',
    freezeTableName: true,
    underscored: true,
    timestamps: true,
  }
);

// ─────────────────────────────────────────────────────────────
// 4. Reunion
// ─────────────────────────────────────────────────────────────
const Reunion = sequelize.define(
  'Reunion',
  {
    idReunion: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    typeReunion: {
      type: DataTypes.ENUM(
        'Priere',
        'EtudeBiblique',
        'Culte',
        'Evangelisation',
        'Formation'
      ),
      allowNull: false,
    },
    dateHeureDebut: { type: DataTypes.DATE, allowNull: false },
    dateHeureFin: { type: DataTypes.DATE },
    statutReunion: {
      type: DataTypes.ENUM('Planifiee', 'EnCours', 'Terminee', 'Annulee'),
      defaultValue: 'Planifiee',
    },
  },
  {
    tableName: 'Reunion',
    freezeTableName: true,
    underscored: true,
    timestamps: true,
  }
);

// ─────────────────────────────────────────────────────────────
// 5. ValidationAvancement
// ─────────────────────────────────────────────────────────────
const ValidationAvancement = sequelize.define(
  'ValidationAvancement',
  {
    idValidation: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    niveauDemande: { type: DataTypes.INTEGER, allowNull: false },
    statutDirigeant: {
      type: DataTypes.ENUM('EnAttente', 'Approuve', 'Rejete'),
      defaultValue: 'EnAttente',
    },
    statutLeader: {
      type: DataTypes.ENUM('EnAttente', 'Approuve', 'Rejete'),
      defaultValue: 'EnAttente',
    },
    statutFinal: {
      type: DataTypes.ENUM('EnAttente', 'Approuve', 'Rejete'),
      defaultValue: 'EnAttente',
    },
  },
  {
    tableName: 'ValidationAvancement',
    freezeTableName: true,
    underscored: true,
    timestamps: true,
  }
);

// ─────────────────────────────────────────────────────────────
// 6. ContenuSpirituel
// ─────────────────────────────────────────────────────────────
const ContenuSpirituel = sequelize.define(
  'ContenuSpirituel',
  {
    idContenu: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    titreContenu: { type: DataTypes.STRING(255), allowNull: false },
    langueOriginale: { type: DataTypes.STRING(50), allowNull: false },
    datePublication: { type: DataTypes.DATE },
    fichierUrl: { type: DataTypes.STRING(500) },
  },
  {
    tableName: 'ContenuSpirituel',
    freezeTableName: true,
    underscored: true,
    timestamps: true,
  }
);

// ─────────────────────────────────────────────────────────────
// 7. Traduction
// ─────────────────────────────────────────────────────────────
const Traduction = sequelize.define(
  'Traduction',
  {
    idTraduction: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    langueCible: { type: DataTypes.STRING(50), allowNull: false },
    titreTraduit: { type: DataTypes.STRING(255) },
    fichierUrl: { type: DataTypes.STRING(500) },
  },
  {
    tableName: 'Traduction',
    freezeTableName: true,
    underscored: true,
    timestamps: true,
  }
);

// ─────────────────────────────────────────────────────────────
// Tables de jonction
// ─────────────────────────────────────────────────────────────
const Presence = sequelize.define(
  'Presence',
  {
    present: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    tableName: 'Presence',
    freezeTableName: true,
    underscored: true,
    timestamps: false,
  }
);

const Consultation = sequelize.define(
  'Consultation',
  {
    dateLecture: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: 'Consultation',
    freezeTableName: true,
    underscored: true,
    timestamps: false,
  }
);

// ─────────────────────────────────────────────────────────────
// Associations
// ─────────────────────────────────────────────────────────────

// Appartenir : Disciple appartient à une Église
EgliseDeMaison.hasMany(Disciple, { as: 'membres', foreignKey: 'idEglise' });
Disciple.belongsTo(EgliseDeMaison, {
  as: 'eglise',
  foreignKey: 'idEglise',
  onDelete: 'SET NULL',
});

// Diriger : Un Disciple (dirigeant) dirige une Église
EgliseDeMaison.belongsTo(Disciple, {
  as: 'dirigeant',
  foreignKey: 'idDirigeant',
});
// Règle métier : un dirigeant dirige UNE SEULE église de maison (hasOne)
Disciple.hasOne(EgliseDeMaison, {
  as: 'egliseDirigee',
  foreignKey: 'idDirigeant',
});

// Se Tenir : Réunion se tient dans une Église
EgliseDeMaison.hasMany(Reunion, { as: 'reunions', foreignKey: 'idEglise' });
Reunion.belongsTo(EgliseDeMaison, {
  as: 'eglise',
  foreignKey: 'idEglise',
  onDelete: 'CASCADE',
});

// Organiser : Un Disciple (dirigeant) organise une Réunion
Disciple.hasMany(Reunion, {
  as: 'reunionsOrganisees',
  foreignKey: 'idOrganisateur',
});
Reunion.belongsTo(Disciple, {
  as: 'organisateur',
  foreignKey: 'idOrganisateur',
  onDelete: 'CASCADE',
});

// Participer : Disciple participe à Réunion (via Presence)
Disciple.belongsToMany(Reunion, {
  through: Presence,
  as: 'reunions',
  foreignKey: 'idDisciple',
  otherKey: 'idReunion',
});
Reunion.belongsToMany(Disciple, {
  through: Presence,
  as: 'participants',
  foreignKey: 'idReunion',
  otherKey: 'idDisciple',
});

// Enregistrer : Un Disciple enregistre une Routine
Disciple.hasMany(RoutineSpirituelle, {
  as: 'routines',
  foreignKey: 'idDisciple',
});
RoutineSpirituelle.belongsTo(Disciple, {
  as: 'disciple',
  foreignKey: 'idDisciple',
  onDelete: 'CASCADE',
});

// Proposer : Un Disciple est concerné par une Validation
Disciple.hasMany(ValidationAvancement, {
  as: 'demandesAvancement',
  foreignKey: 'idDisciple',
});
ValidationAvancement.belongsTo(Disciple, {
  as: 'disciple',
  foreignKey: 'idDisciple',
  onDelete: 'CASCADE',
});

// Evaluer : Un Dirigeant évalue une Validation
Disciple.hasMany(ValidationAvancement, {
  as: 'evaluations',
  foreignKey: 'idEvaluateur',
});
ValidationAvancement.belongsTo(Disciple, {
  as: 'evaluateur',
  foreignKey: 'idEvaluateur',
  onDelete: 'CASCADE',
});

// Concerner (2e évaluateur — Leader)
Disciple.hasMany(ValidationAvancement, {
  as: 'validationsLeader',
  foreignKey: 'idLeader',
});
ValidationAvancement.belongsTo(Disciple, {
  as: 'leader',
  foreignKey: 'idLeader',
  onDelete: 'CASCADE',
});

// Publier : Un Disciple publie un Contenu
Disciple.hasMany(ContenuSpirituel, {
  as: 'contenusPublies',
  foreignKey: 'idPublieur',
});
ContenuSpirituel.belongsTo(Disciple, {
  as: 'publieur',
  foreignKey: 'idPublieur',
  onDelete: 'CASCADE',
});

// Consulter : Disciple consulte Contenu (via Consultation)
Disciple.belongsToMany(ContenuSpirituel, {
  through: Consultation,
  as: 'contenusConsultes',
  foreignKey: 'idDisciple',
  otherKey: 'idContenu',
});
ContenuSpirituel.belongsToMany(Disciple, {
  through: Consultation,
  as: 'lecteurs',
  foreignKey: 'idContenu',
  otherKey: 'idDisciple',
});

// Posséder : Contenu possède des Traductions
ContenuSpirituel.hasMany(Traduction, {
  as: 'traductions',
  foreignKey: 'idContenu',
});
Traduction.belongsTo(ContenuSpirituel, {
  as: 'contenuOriginal',
  foreignKey: 'idContenu',
  onDelete: 'CASCADE',
});

// Produire : Un Disciple produit une Traduction
Disciple.hasMany(Traduction, {
  as: 'traductionsRealisees',
  foreignKey: 'idTraducteur',
});
Traduction.belongsTo(Disciple, {
  as: 'traducteur',
  foreignKey: 'idTraducteur',
  onDelete: 'CASCADE',
});

module.exports = {
  sequelize,
  Disciple,
  EgliseDeMaison,
  RoutineSpirituelle,
  Reunion,
  ValidationAvancement,
  ContenuSpirituel,
  Traduction,
  Presence,
  Consultation,
};
