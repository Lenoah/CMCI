require('dotenv').config();
const { sequelize } = require('./src/models');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connexion à la base de données établie.');

    await sequelize.sync({ alter: true });
    console.log('Synchronisation des modèles terminée (alter: true).');

    process.exit(0);
  } catch (err) {
    console.error('Erreur lors de la synchronisation :', err);
    process.exit(1);
  }
})();
