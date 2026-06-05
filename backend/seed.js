// Script de données de test (seed) pour la base de données CMCI.
//
// Objectif : un jeu de données GÉOGRAPHIQUEMENT COHÉRENT.
//   Monde ─► Région (sous-région) ─► Pays ─► Église (ville) ─► Disciples
//
//   • Un disciple appartient à une église : il hérite du pays ET de la région de cette église.
//     (Impossible d'avoir un disciple « Belgique » dans une église de Paris.)
//   • Un Leader National ne couvre que SON pays.
//   • Un Leader Régional ne couvre que SA région (plusieurs pays).
//   • Le Leader Mondial voit tout.
require('dotenv').config();
const bcrypt = require('bcryptjs');
const {
  sequelize, Disciple, EgliseDeMaison, Reunion, RoutineSpirituelle,
  ContenuSpirituel, Traduction, ValidationAvancement, Presence, Consultation,
} = require('./src/models');

// Raccourci pour hasher un mot de passe
const hash = (pwd) => bcrypt.hashSync(pwd, 10);
const MDP = hash('password123'); // tous les comptes de test partagent ce mot de passe

// Dates relatives à aujourd'hui : le seed reste « frais » à chaque exécution
const jour = (decalage) => {
  const d = new Date();
  d.setDate(d.getDate() + decalage);
  return d;
};
const jourISO = (decalage) => jour(decalage).toISOString().slice(0, 10);
const dateHeure = (decalage, heure) => {
  const d = jour(decalage);
  d.setHours(heure, 0, 0, 0);
  return d;
};

// Crée une église complète : son dirigeant, l'église, puis ses membres.
// Le dirigeant et les membres héritent automatiquement du pays et de la région
// de l'église → cohérence géographique garantie.
async function creerEglise(def) {
  const dirigeant = await Disciple.create({
    ...def.dirigeant, role: 'Dirigeant', statut: 'Actif',
    pays: def.pays, region: def.region,
  });

  const eglise = await EgliseDeMaison.create({
    nomEglise: def.nomEglise, ville: def.ville, pays: def.pays, region: def.region,
    capaciteMax: 30, statutEglise: 'Active', idDirigeant: dirigeant.idDisciple,
  });

  await dirigeant.update({ idEglise: eglise.idEglise });

  const membres = [];
  for (const m of def.membres) {
    membres.push(await Disciple.create({
      ...m, role: 'Disciple', statut: 'Actif',
      pays: def.pays, region: def.region, idEglise: eglise.idEglise,
    }));
  }
  console.log(`  Église « ${def.nomEglise} » (${def.ville}, ${def.pays}) : 1 dirigeant + ${membres.length} disciples`);
  return { dirigeant, eglise, membres };
}

async function seed() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: true }); // supprime et recrée les tables proprement
    console.log('Base synchronisée. Insertion des données...\n');

    // ── 1. Églises avec dirigeants et disciples (cohérents) ──────
    const yaounde = await creerEglise({
      nomEglise: 'Source de Vie', ville: 'Yaoundé', pays: 'Cameroun', region: 'Afrique Centrale',
      dirigeant: { nom: 'Awono', prenom: 'Pierre', telephone: '0611000000', motDePasse: MDP, niveauFormation: 3 },
      membres: [
        { nom: 'Mballa', prenom: 'Grace', telephone: '0611000001', motDePasse: MDP, niveauFormation: 1 },
        { nom: 'Fouda', prenom: 'Joseph', telephone: '0611000002', motDePasse: MDP, niveauFormation: 2 },
        { nom: 'Atangana', prenom: 'Ruth', telephone: '0611000003', motDePasse: MDP, niveauFormation: 1 },
      ],
    });

    const libreville = await creerEglise({
      nomEglise: 'Bethel', ville: 'Libreville', pays: 'Gabon', region: 'Afrique Centrale',
      dirigeant: { nom: 'Nguema', prenom: 'Jean', telephone: '0612000000', motDePasse: MDP, niveauFormation: 3 },
      membres: [
        { nom: 'Obame', prenom: 'Esther', telephone: '0612000001', motDePasse: MDP, niveauFormation: 1 },
        { nom: 'Ndong', prenom: 'Marc', telephone: '0612000002', motDePasse: MDP, niveauFormation: 2 },
      ],
    });

    const paris = await creerEglise({
      nomEglise: 'La Grâce', ville: 'Paris', pays: 'France', region: 'Europe de l\'Ouest',
      dirigeant: { nom: 'Dupont', prenom: 'Jean', telephone: '0613000000', motDePasse: MDP, niveauFormation: 3 },
      membres: [
        { nom: 'Martin', prenom: 'Marie', telephone: '0613000001', motDePasse: MDP, niveauFormation: 1 },
        { nom: 'Bernard', prenom: 'Luc', telephone: '0613000002', motDePasse: MDP, niveauFormation: 2 },
      ],
    });
    console.log('');

    // ── 2. Leaders de la hiérarchie ──────────────────────────────
    // Règle métier : un leader est un disciple rattaché à une église locale.
    // Il hérite donc du pays et de la région de son église. La zoneCouverture
    // indique l'étendue qu'il supervise (monde / sa région / son pays).
    const leader = (def) => Disciple.create({
      ...def.compte, motDePasse: MDP, statut: 'Actif', niveauFormation: 5,
      idEglise: def.eglise.eglise.idEglise,
      pays: def.eglise.eglise.pays, region: def.eglise.eglise.region,
    });

    // Leader Mondial (membre de l'église de Yaoundé) — supervise le monde
    await leader({ eglise: yaounde, compte: {
      nom: 'Mbarga', prenom: 'David', telephone: '0600000000', role: 'LeaderMon', zoneCouverture: 'Monde' } });

    // Leaders Régionaux — zoneCouverture = leur région (déduite de leur église)
    await leader({ eglise: yaounde, compte: {
      nom: 'Eboué', prenom: 'Samuel', telephone: '0600000010', role: 'LeaderReg', zoneCouverture: 'Afrique Centrale' } });
    await leader({ eglise: paris, compte: {
      nom: 'Robert', prenom: 'Pauline', telephone: '0600000011', role: 'LeaderReg', zoneCouverture: 'Europe de l\'Ouest' } });

    // Leaders Nationaux — couvrent le pays de leur église
    const leaderNatCmr = await leader({ eglise: yaounde, compte: {
      nom: 'Ondoa', prenom: 'Esther', telephone: '0600000020', role: 'LeaderNat', zoneCouverture: 'Cameroun' } });
    await leader({ eglise: libreville, compte: {
      nom: 'Bivigou', prenom: 'Paul', telephone: '0600000021', role: 'LeaderNat', zoneCouverture: 'Gabon' } });
    await leader({ eglise: paris, compte: {
      nom: 'Moreau', prenom: 'Claire', telephone: '0600000022', role: 'LeaderNat', zoneCouverture: 'France' } });

    // Responsable des contenus (membre de Yaoundé)
    const respContenus = await leader({ eglise: yaounde, compte: {
      nom: 'Kana', prenom: 'Bertha', telephone: '0600000030', role: 'RespContenus', zoneCouverture: null } });
    console.log('Leaders créés : 1 mondial, 2 régionaux, 3 nationaux, 1 resp. contenus\n');

    // ── 3. Activité de démonstration (église de Yaoundé) ─────────
    const dirigeant = yaounde.dirigeant;
    const [m1, m2, m3] = yaounde.membres;

    // Routines spirituelles réparties sur la semaine
    const routines = [
      { typeRoutine: 'Lecture', dateRoutine: jourISO(0), dureeMinutes: 30, notes: 'Jean 3', idDisciple: m1.idDisciple },
      { typeRoutine: 'PriereSeule', dateRoutine: jourISO(0), dureeMinutes: 20, notes: 'Intercession', idDisciple: m1.idDisciple },
      { typeRoutine: 'Meditation', dateRoutine: jourISO(-1), dureeMinutes: 15, notes: 'Psaume 23', idDisciple: m1.idDisciple },
      { typeRoutine: 'Jeune', dateRoutine: jourISO(-2), dureeMinutes: null, notes: 'Jeûne du matin', idDisciple: m1.idDisciple },
      { typeRoutine: 'Lecture', dateRoutine: jourISO(0), dureeMinutes: 45, notes: 'Romains 8', idDisciple: m2.idDisciple },
      { typeRoutine: 'Meditation', dateRoutine: jourISO(-1), dureeMinutes: 25, notes: 'Béatitudes', idDisciple: m2.idDisciple },
      { typeRoutine: 'PriereSeule', dateRoutine: jourISO(-1), dureeMinutes: 15, notes: 'Action de grâce', idDisciple: m3.idDisciple },
    ];
    for (const r of routines) await RoutineSpirituelle.create(r);
    console.log(`${routines.length} routines spirituelles créées.`);

    // Réunions (le dirigeant organise dans son église)
    const reunion1 = await Reunion.create({
      typeReunion: 'Culte', dateHeureDebut: dateHeure(3, 10), dateHeureFin: dateHeure(3, 12),
      statutReunion: 'Planifiee', idEglise: yaounde.eglise.idEglise, idOrganisateur: dirigeant.idDisciple,
    });
    const reunion2 = await Reunion.create({
      typeReunion: 'EtudeBiblique', dateHeureDebut: dateHeure(-2, 18), dateHeureFin: dateHeure(-2, 20),
      statutReunion: 'Terminee', idEglise: yaounde.eglise.idEglise, idOrganisateur: dirigeant.idDisciple,
    });
    await Reunion.create({
      typeReunion: 'Priere', dateHeureDebut: dateHeure(6, 19), dateHeureFin: dateHeure(6, 20),
      statutReunion: 'Planifiee', idEglise: yaounde.eglise.idEglise, idOrganisateur: dirigeant.idDisciple,
    });
    console.log('3 réunions créées.');

    // Présences pour la réunion terminée
    await Presence.create({ idReunion: reunion2.idReunion, idDisciple: m1.idDisciple, present: true });
    await Presence.create({ idReunion: reunion2.idReunion, idDisciple: m2.idDisciple, present: true });
    await Presence.create({ idReunion: reunion2.idReunion, idDisciple: m3.idDisciple, present: false });

    // Contenus spirituels (publiés par le responsable des contenus)
    const contenu1 = await ContenuSpirituel.create({
      titreContenu: 'Introduction à la foi chrétienne', langueOriginale: 'Français',
      datePublication: jour(-30), idPublieur: respContenus.idDisciple,
    });
    const contenu2 = await ContenuSpirituel.create({
      titreContenu: 'Le disciple et la prière', langueOriginale: 'Français',
      datePublication: jour(-10), idPublieur: respContenus.idDisciple,
    });
    console.log('2 contenus spirituels créés.');

    // Consultations
    await Consultation.create({ idDisciple: m1.idDisciple, idContenu: contenu1.idContenu, dateLecture: jour(-5) });
    await Consultation.create({ idDisciple: m1.idDisciple, idContenu: contenu2.idContenu, dateLecture: jour(-1) });
    await Consultation.create({ idDisciple: m2.idDisciple, idContenu: contenu1.idContenu, dateLecture: jour(-3) });

    // Traduction
    await Traduction.create({
      idContenu: contenu1.idContenu, langueCible: 'Anglais',
      titreTraduit: 'Introduction to Christian Faith', idTraducteur: respContenus.idDisciple,
    });
    console.log('1 traduction créée.');

    // Validations d'avancement (double validation : dirigeant puis leader)
    await ValidationAvancement.create({
      idDisciple: m2.idDisciple, niveauDemande: 3, idEvaluateur: dirigeant.idDisciple,
      idLeader: leaderNatCmr.idDisciple,
      statutDirigeant: 'EnAttente', statutLeader: 'EnAttente', statutFinal: 'EnAttente',
    });
    await ValidationAvancement.create({
      idDisciple: m1.idDisciple, niveauDemande: 2, idEvaluateur: dirigeant.idDisciple,
      idLeader: leaderNatCmr.idDisciple,
      statutDirigeant: 'Approuve', statutLeader: 'EnAttente', statutFinal: 'EnAttente',
    });
    console.log('2 demandes d\'avancement créées.');

    // ── Résumé des comptes de test ───────────────────────────────
    console.log('\n══════════════════════════════════════════════');
    console.log('Seed terminé ! Comptes de test (mot de passe : password123) :');
    console.log('  Leader Mondial          : 0600000000');
    console.log('  Leader Régional AfrCent : 0600000010');
    console.log('  Leader Régional Europe  : 0600000011');
    console.log('  Leader National Cameroun: 0600000020');
    console.log('  Leader National Gabon   : 0600000021');
    console.log('  Leader National France  : 0600000022');
    console.log('  Resp. Contenus          : 0600000030');
    console.log('  Dirigeant Yaoundé       : 0611000000  (membres 0611000001..3)');
    console.log('  Dirigeant Libreville    : 0612000000  (membres 0612000001..2)');
    console.log('  Dirigeant Paris         : 0613000000  (membres 0613000001..2)');
    console.log('══════════════════════════════════════════════');

    process.exit(0);
  } catch (err) {
    console.error('Erreur seed :', err);
    process.exit(1);
  }
}

seed();
