# 🎓 Fiche de révision — Projet CMCI (à avoir sous les yeux le jour J)

## Le pitch en 30 secondes
Application **full-stack** de gestion de la CMCI (former des disciples en églises de maison).
**Frontend** Vue.js (port 5173) ⇄ **API REST/JSON** ⇄ **Backend** Express/Node (port 3000) ⇄ **MariaDB** (via l'ORM Sequelize).

## Le fil rouge (vrai pour CHAQUE fonctionnalité)
> Le client **demande** → le serveur vérifie l'**identité (JWT)** → vérifie les **droits (RBAC)** → applique la **règle métier** → l'**ORM** lit/écrit la base → réponse propre → le frontend **réagit** et affiche.

## La stack (techno → rôle)
- **JavaScript** : un seul langage, front + back. Pas de TypeScript. `const`/`let` jamais `var`.
- **Node.js + Express** : serveur web ; concept clé = **middleware** (chaîne de traitement).
- **Sequelize (ORM)** : traduit JS ↔ SQL ; protège des injections SQL ; portable.
- **MariaDB** : base **relationnelle** (tables, lignes, colonnes, clés étrangères).
- **Vue 3 (`<script setup>`) + Vite** : interface **réactive**, SPA.
- **Vue Router** : navigation/URL + gardes. **Pinia** : état partagé en mémoire. **Axios** : appels HTTP.
- **bcrypt** : hachage mot de passe (sens unique). **JWT** : jeton d'identité signé, *stateless*.

## Les 7 entités + 2 jonctions
1. **Disciple** (toute personne) · 2. **EgliseDeMaison** · 3. **Reunion** · 4. **RoutineSpirituelle** · 5. **ValidationAvancement** · 6. **ContenuSpirituel** · 7. **Traduction**
Jonctions (N-N) : **Presence** (disciple↔réunion) · **Consultation** (disciple↔contenu).
> FK explicites : `idDirigeant`, `idEglise`, `idOrganisateur`, `idPublieur`, `idTraducteur`, `idDisciple`, `idEvaluateur`, `idLeader`.

## Hiérarchie des rôles
`LeaderMon` ⊃ `LeaderReg` (zone) ⊃ `LeaderNat` (pays) ⊃ `Dirigeant` (1 église) ⊃ `Disciple`. À part : `RespContenus`.
> Les **3B** (Bertoua, Brazzaville, Beijing) = **sources de contenu**, PAS des leaders.

## Architecture backend : 3 couches
**Routes** (`routes/`, URL + middlewares) → **Contrôleurs** (`controllers/`, logique) → **Modèles** (`models/`, Sequelize → SQL).
Squelette contrôleur : `async (req,res) { try { … codes HTTP … } catch { res.status(500) } }`.

## Sécurité (3 niveaux = défense en profondeur)
1. **Route** : `requireRole('Dirigeant', …)` → **403** si rôle interdit.
2. **Contrôleur** : vérifs fines (« ce disciple est-il dans MON église ? »).
3. **Base** : `where` filtré par rôle (ne récupère même pas l'interdit).
> Le frontend (masquer un bouton, `meta.roles`) = **confort**, PAS sécurité. La vraie sécurité est **toujours** au backend.

## Authentification (à réciter)
Login : trouver par **téléphone** → `bcrypt.compare` → si OK `jwt.sign({id, role})`.
Chaque requête : header `Authorization: Bearer <token>` → middleware `jwt.verify` → `req.user = {id, role}`.
Le payload JWT n'a que `{id, role}` ; modifier le payload casse la **signature** → rejeté.

## 3 règles métier à connaître
- **Pas d'auto-inscription** : le **dirigeant** crée ses membres ; le serveur **impose** `role:'Disciple'` + l'église.
- **Double validation** : Dirigeant **évalue** (`statutDirigeant`) → Leader **valide** (`statutLeader`/`statutFinal`, seulement si dirigeant a approuvé) → si Approuvé, le `niveauFormation` monte.
- **Présences** : seul l'organisateur fait l'appel ; on **efface puis recrée** (`Presence.destroy` + `bulkCreate`).

## Codes HTTP
`200` OK · `201` créé · `400` données invalides · `401` pas/мauvais token · `403` interdit (rôle) · `404` introuvable · `409` conflit (tél. déjà pris) · `500` erreur serveur.

## Frontend en bref
`ref`/`reactive` = données réactives · `computed` = valeur calculée · `onMounted` = au chargement · `v-model`/`v-if`/`v-for`/`@click`.
`api.js` : `baseURL` + intercepteur (401 → redirige `/login`). `auth` store : après login, token mis en **header Axios par défaut** → envoyé partout.

## Pièges / « gotchas » à assumer
- **F5 = déconnexion** : état en **Pinia** (mémoire), pas en `localStorage` (interdit par le projet). Choix assumé.
- **CORS** : `cors()` autorise `:5173` → `:3000`, sinon le navigateur bloque tout.
- **Token expire en 7 jours** (`JWT_EXPIRES_IN='7d'`, dans `.env`).
- On ne renvoie **JAMAIS** `motDePasse` → `attributes:{ exclude:['motDePasse'] }`.

## Démo : comptes de test (`npm run seed`)
Leader `0600000000` · Dirigeant `0600000001` · Disciples `0600000002/03/04` — **mot de passe : `password123`**.
Lancer : back `npm run dev` (3000) · front `npm run dev` (5173).

## Si on me demande « expliquez X de bout en bout »
Vue (formulaire `v-model`) → store (`api.post`, token auto) → **HTTP** → `app.js` (cors, json) → route (`auth`→`requireRole`) → contrôleur (valide, applique la règle) → Sequelize (`INSERT/SELECT`) → MariaDB → réponse `2xx`/erreur → store/vue (affiche, redirige).
