// Script de données de test (seed) pour la base de données CMCI
require('dotenv').config();
const bcrypt = require('bcryptjs');
const {
  sequelize, Disciple, EgliseDeMaison, Reunion, RoutineSpirituelle,
  ContenuSpirituel, Traduction, ValidationAvancement, Presence,
} = require('./src/models');

// Raccourci pour hasher un mot de passe
const hash = (pwd) => bcrypt.hashSync(pwd, 10);

async function seed() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: true }); // force: supprime et recrée les tables proprement
    console.log('Base synchronisée. Insertion des données...\n');

    // ── 1. Créer le leader national ──────────────────────────────
    const [leaderNat] = await Disciple.findOrCreate({
      where: { telephone: '0600000000' },
      defaults: {
        nom: 'Mbarga', prenom: 'Samuel',
        telephone: '0600000000',
        motDePasse: hash('password123'),
        pays: 'Cameroun',
        role: 'LeaderNat',
        zoneCouverture: 'Afrique Centrale',
        niveauFormation: 5,
        statut: 'Actif',
      },
    });
    console.log(`Leader National : ${leaderNat.prenom} ${leaderNat.nom}`);

    // ── 2. Créer le dirigeant ────────────────────────────────────
    const [dirigeant] = await Disciple.findOrCreate({
      where: { telephone: '0600000001' },
      defaults: {
        nom: 'Dupont', prenom: 'Jean',
        telephone: '0600000001',
        motDePasse: hash('password123'),
        pays: 'France',
        role: 'Dirigeant',
        niveauFormation: 3,
        statut: 'Actif',
      },
    });
    console.log(`Dirigeant : ${dirigeant.prenom} ${dirigeant.nom}`);

    // ── 3. Créer l'église de maison ──────────────────────────────
    const [eglise] = await EgliseDeMaison.findOrCreate({
      where: { nomEglise: 'Église de la Grâce' },
      defaults: {
        nomEglise: 'Église de la Grâce',
        ville: 'Paris',
        pays: 'France',
        capaciteMax: 30,
        statutEglise: 'Active',
        idDirigeant: dirigeant.idDisciple,
      },
    });
    console.log(`Église : ${eglise.nomEglise}`);

    // Associer le dirigeant à son église
    await dirigeant.update({ idEglise: eglise.idEglise });

    // ── 4. Trois disciples ───────────────────────────────────────
    const [disciple1] = await Disciple.findOrCreate({
      where: { telephone: '0600000002' },
      defaults: {
        nom: 'Martin', prenom: 'Marie',
        telephone: '0600000002',
        motDePasse: hash('password123'),
        pays: 'France', role: 'Disciple',
        niveauFormation: 1, statut: 'Actif',
        idEglise: eglise.idEglise,
      },
    });

    const [disciple2] = await Disciple.findOrCreate({
      where: { telephone: '0600000003' },
      defaults: {
        nom: 'Leblanc', prenom: 'Paul',
        telephone: '0600000003',
        motDePasse: hash('password123'),
        pays: 'Belgique', role: 'Disciple',
        niveauFormation: 2, statut: 'Actif',
        idEglise: eglise.idEglise,
      },
    });

    const [disciple3] = await Disciple.findOrCreate({
      where: { telephone: '0600000004' },
      defaults: {
        nom: 'Nguema', prenom: 'Esther',
        telephone: '0600000004',
        motDePasse: hash('password123'),
        pays: 'Gabon', role: 'Disciple',
        niveauFormation: 1, statut: 'Actif',
        idEglise: eglise.idEglise,
      },
    });
    console.log(`3 disciples créés.`);

    // ── 5. Routines spirituelles ─────────────────────────────────
    const routines = [
      { typeRoutine: 'Lecture', dateRoutine: '2026-04-20', dureeMinutes: 30, notes: 'Jean 3', idDisciple: disciple1.idDisciple },
      { typeRoutine: 'PriereSeule', dateRoutine: '2026-04-20', dureeMinutes: 20, notes: 'Intercession', idDisciple: disciple1.idDisciple },
      { typeRoutine: 'Meditation', dateRoutine: '2026-04-19', dureeMinutes: 15, notes: 'Psaume 23', idDisciple: disciple2.idDisciple },
      { typeRoutine: 'Lecture', dateRoutine: '2026-04-18', dureeMinutes: 45, notes: 'Romains 8', idDisciple: disciple2.idDisciple },
      { typeRoutine: 'Jeune', dateRoutine: '2026-04-17', dureeMinutes: null, notes: 'Jeûne du matin', idDisciple: disciple1.idDisciple },
    ];
    for (const r of routines) {
      await RoutineSpirituelle.findOrCreate({ where: r, defaults: r });
    }
    console.log(`5 routines spirituelles créées.`);

    // ── 6. Réunions ──────────────────────────────────────────────
    const [reunion1] = await Reunion.findOrCreate({
      where: { typeReunion: 'Culte', idEglise: eglise.idEglise, idOrganisateur: dirigeant.idDisciple },
      defaults: {
        typeReunion: 'Culte',
        dateHeureDebut: new Date('2026-04-27T10:00:00'),
        dateHeureFin: new Date('2026-04-27T12:00:00'),
        statutReunion: 'Planifiee',
        idEglise: eglise.idEglise,
        idOrganisateur: dirigeant.idDisciple,
      },
    });

    const [reunion2] = await Reunion.findOrCreate({
      where: { typeReunion: 'EtudeBiblique', idEglise: eglise.idEglise, idOrganisateur: dirigeant.idDisciple },
      defaults: {
        typeReunion: 'EtudeBiblique',
        dateHeureDebut: new Date('2026-04-15T18:00:00'),
        dateHeureFin: new Date('2026-04-15T19:30:00'),
        statutReunion: 'Terminee',
        idEglise: eglise.idEglise,
        idOrganisateur: dirigeant.idDisciple,
      },
    });
    console.log(`2 réunions créées.`);

    // Présences pour la réunion 2
    await Presence.findOrCreate({ where: { idReunion: reunion2.idReunion, idDisciple: disciple1.idDisciple }, defaults: { present: true } });
    await Presence.findOrCreate({ where: { idReunion: reunion2.idReunion, idDisciple: disciple2.idDisciple }, defaults: { present: false } });

    // ── 7. Contenus spirituels ───────────────────────────────────
    const [contenu1] = await ContenuSpirituel.findOrCreate({
      where: { titreContenu: 'Introduction à la foi chrétienne' },
      defaults: {
        titreContenu: 'Introduction à la foi chrétienne',
        langueOriginale: 'Français',
        datePublication: new Date('2026-04-01'),
        idPublieur: leaderNat.idDisciple,
      },
    });

    const [contenu2] = await ContenuSpirituel.findOrCreate({
      where: { titreContenu: 'Le disciple et la prière' },
      defaults: {
        titreContenu: 'Le disciple et la prière',
        langueOriginale: 'Français',
        datePublication: new Date('2026-04-10'),
        idPublieur: leaderNat.idDisciple,
      },
    });
    console.log(`2 contenus spirituels créés.`);

    // ── 8. Traduction ────────────────────────────────────────────
    await Traduction.findOrCreate({
      where: { idContenu: contenu1.idContenu, langueCible: 'Anglais' },
      defaults: {
        idContenu: contenu1.idContenu,
        langueCible: 'Anglais',
        titreTraduit: 'Introduction to Christian Faith',
        idTraducteur: dirigeant.idDisciple,
      },
    });
    console.log(`1 traduction créée.`);

    // ── 9. Validation d'avancement ───────────────────────────────
    await ValidationAvancement.findOrCreate({
      where: { idDisciple: disciple2.idDisciple, niveauDemande: 3 },
      defaults: {
        idDisciple: disciple2.idDisciple,
        niveauDemande: 3,
        idEvaluateur: dirigeant.idDisciple,
        statutDirigeant: 'EnAttente',
        statutLeader: 'EnAttente',
        statutFinal: 'EnAttente',
      },
    });
    console.log(`1 demande d'avancement créée.`);

    // ── Résumé des comptes de test ───────────────────────────────
    console.log('\n══════════════════════════════════════════════');
    console.log('Seed terminé ! Comptes de test :');
    console.log('  Leader     : 0600000000 / password123');
    console.log('  Dirigeant  : 0600000001 / password123');
    console.log('  Disciple 1 : 0600000002 / password123');
    console.log('  Disciple 2 : 0600000003 / password123');
    console.log('  Disciple 3 : 0600000004 / password123');
    console.log('══════════════════════════════════════════════');

    process.exit(0);
  } catch (err) {
    console.error('Erreur seed :', err);
    process.exit(1);
  }
}

seed();
