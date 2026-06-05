# Cours complet — Comprendre le projet CMCI de bout en bout

> **Public visé** : toi, Francis, débutant en programmation, qui dois comprendre,
> expliquer et modifier ce projet devant un professeur exigeant.
> **Méthode** : on part des grands concepts du génie logiciel, puis on descend
> progressivement jusqu'à chaque ligne de ton code réel.
> **Promesse** : à la fin, tu dois pouvoir répondre à « pourquoi avez-vous fait ça ? »
> pour n'importe quelle partie du projet.

---

## Table des matières

1. [Ce qu'est le génie logiciel (vue d'ensemble)](#1)
2. [L'architecture générale : client / serveur / base de données](#2)
3. [La stack technique et ce qu'elle implique](#3)
4. [Le domaine métier : les 7 entités et leurs relations](#4)
5. [La base de données et l'ORM Sequelize](#5)
6. [Le backend : routes → contrôleurs → modèles](#6)
7. [L'authentification et la sécurité (JWT, bcrypt, RBAC)](#7)
8. [La logique métier (visibilité par rôle, double validation, présences)](#8)
9. [Le frontend : application monopage Vue 3](#9)
10. [Le cycle de vie complet d'une requête (de bout en bout)](#10)
11. [Recettes : comment modifier le projet sans rien casser](#11)
12. [Questions probables du professeur + réponses](#12)
13. [Glossaire](#13)

---

<a name="1"></a>
## 1. Ce qu'est le génie logiciel (vue d'ensemble)

### 1.1 Programmer ≠ faire du génie logiciel

**Programmer**, c'est écrire des instructions qu'un ordinateur exécute.
**Le génie logiciel** (*software engineering*), c'est l'ensemble des méthodes pour
qu'un logiciel soit **correct**, **lisible**, **maintenable**, **sécurisé** et
**évolutif** — même quand plusieurs personnes y travaillent pendant des années.

Une métaphore : tout le monde peut empiler des briques (programmer). Le génie
logiciel, c'est savoir construire un bâtiment qui ne s'effondre pas, où l'on peut
ajouter un étage sans tout refaire, et où un nouvel ouvrier comprend les plans.

### 1.2 Les grands principes que ton projet applique

| Principe | Définition simple | Où on le voit dans ton projet |
|---|---|---|
| **Séparation des responsabilités** (*separation of concerns*) | Chaque morceau de code fait **une seule** chose | Routes (URL) ≠ contrôleurs (logique) ≠ modèles (données) |
| **Architecture en couches** (*layered architecture*) | Le code est rangé en niveaux empilés qui ne se parlent que de voisin à voisin | Frontend → API → Contrôleur → ORM → Base |
| **DRY** (*Don't Repeat Yourself*) | Ne pas répéter le même code | Un seul fichier `api.js`, un seul middleware `auth` réutilisé partout |
| **Principe de moindre privilège** | Chacun n'a accès qu'à ce dont il a besoin | Un disciple ne voit que son profil ; un dirigeant que son église |
| **Source unique de vérité** (*single source of truth*) | Une information n'existe qu'à un seul endroit | Le rôle de l'utilisateur vient du token, pas de l'écran |
| **Convention plutôt que configuration** | Suivre des règles de nommage stables plutôt que tout configurer | Tous les contrôleurs suivent le même squelette `getAll/getById/create/update/remove` |

> 🎓 **À retenir pour l'oral** : « Mon projet est organisé en *couches* avec une
> *séparation des responsabilités* stricte. Chaque fichier a une seule raison
> d'exister. C'est ce qui rend le code lisible et modifiable. »

### 1.3 Le vocabulaire « full-stack »

Ton application est **full-stack** : elle a deux moitiés.

- **Frontend** (« le devant ») = ce que l'utilisateur voit dans son navigateur.
  C'est l'application Vue.js. Elle tourne sur le port **5173**.
- **Backend** (« l'arrière ») = le serveur qui contient la logique et parle à la
  base de données. C'est l'application Express. Elle tourne sur le port **3000**.

Les deux sont des **programmes séparés** qui communiquent par le réseau via une
**API REST** (on définit ça plus bas). C'est un choix d'architecture majeur :
on aurait pu tout mélanger, mais les séparer permet, par exemple, de remplacer
le frontend par une application mobile sans toucher au backend.

---

<a name="2"></a>
## 2. L'architecture générale : client / serveur / base de données

### 2.1 Le schéma global à mémoriser

```
┌──────────────────────────┐         requêtes HTTP (JSON)         ┌──────────────────────────┐
│        FRONTEND          │  ───────────────────────────────▶   │         BACKEND          │
│   (Vue.js, navigateur)   │                                      │   (Node.js + Express)    │
│   http://localhost:5173  │  ◀───────────────────────────────   │   http://localhost:3000  │
└──────────────────────────┘         réponses HTTP (JSON)         └────────────┬─────────────┘
                                                                               │ SQL (via Sequelize)
                                                                               ▼
                                                                  ┌──────────────────────────┐
                                                                  │      BASE DE DONNÉES     │
                                                                  │        (MariaDB)         │
                                                                  │      base : cmci_db      │
                                                                  └──────────────────────────┘
```

Trois acteurs, trois rôles :

1. **Le client** (frontend) : il **demande** et il **affiche**. Il ne contient
   aucune vérité définitive — il peut être manipulé par l'utilisateur, donc on ne
   lui fait jamais confiance pour la sécurité.
2. **Le serveur** (backend) : il **décide**. C'est lui qui applique les règles
   (qui a le droit de quoi), qui calcule, et qui est la seule porte vers la base.
3. **La base de données** : elle **se souvient**. Elle stocke durablement les
   données sur le disque, même quand on éteint les programmes.

### 2.2 Pourquoi cette séparation ? (la question piège du prof)

> **Q : « Pourquoi ne pas laisser le frontend parler directement à la base ? »**

Réponse : pour trois raisons fondamentales.
- **Sécurité** : le navigateur est sur la machine de l'utilisateur, qui peut tout
  inspecter. Si le frontend avait le mot de passe de la base, n'importe qui le
  volerait. Le backend garde les secrets (mot de passe BD, clé JWT) hors de portée.
- **Centralisation des règles métier** : la règle « un dirigeant ne dirige qu'une
  église » doit être appliquée **une seule fois**, au serveur. Si chaque client
  réimplémentait les règles, ils finiraient par diverger.
- **Indépendance** : on peut changer la base (MariaDB → PostgreSQL) ou ajouter un
  client mobile sans rien changer ailleurs, parce que tout le monde passe par l'API.

### 2.3 HTTP et REST en deux minutes

**HTTP** est le langage du web. Une communication = une **requête** (le client
demande) suivie d'une **réponse** (le serveur répond). Chaque requête a :

- une **méthode** (le verbe) : `GET` (lire), `POST` (créer), `PUT` (modifier),
  `DELETE` (supprimer) ;
- une **URL** (l'adresse) : `/api/disciples/42` ;
- éventuellement un **corps** (*body*) : les données envoyées, au format **JSON** ;
- des **en-têtes** (*headers*) : métadonnées, dont le fameux `Authorization`.

La réponse a un **code de statut** qui dit ce qui s'est passé :

| Code | Sens | Exemple dans ton projet |
|---|---|---|
| `200` | OK | Lecture ou modification réussie |
| `201` | Créé | Un disciple vient d'être inscrit |
| `400` | Requête invalide | Champ obligatoire manquant |
| `401` | Non authentifié | Pas de token, ou token expiré |
| `403` | Interdit (authentifié mais pas le droit) | Un disciple essaie de supprimer un autre |
| `404` | Introuvable | `/api/disciples/9999` n'existe pas |
| `409` | Conflit | Téléphone déjà utilisé |
| `500` | Erreur serveur | Bug, base injoignable… |

**REST** est simplement un **style** d'API qui dit : « organise tes URL autour de
*ressources* (des noms : disciples, églises, réunions) et utilise les verbes HTTP
pour les manipuler ». C'est pour ça que ton API ressemble à :

```
GET    /api/disciples        → lister les disciples
POST   /api/disciples        → créer un disciple
GET    /api/disciples/:id    → lire un disciple précis
PUT    /api/disciples/:id    → modifier ce disciple
DELETE /api/disciples/:id    → supprimer ce disciple
```

**JSON** (*JavaScript Object Notation*) est le format texte utilisé pour échanger
les données. Il ressemble à un objet JavaScript :

```json
{ "nom": "Dupont", "prenom": "Jean", "role": "Dirigeant" }
```

> 🎓 **À retenir** : « Mon frontend et mon backend communiquent via une **API REST**
> en **JSON** par-dessus **HTTP**. Les ressources sont les 7 entités du domaine. »

---

<a name="3"></a>
## 3. La stack technique et ce qu'elle implique

Une « stack » (pile) est l'ensemble des technologies choisies. Voici la tienne,
avec **ce que chacune fait** et **ce qu'elle implique** (les conséquences concrètes).

### 3.1 Le langage : JavaScript

- **C'est quoi** : le seul langage qui tourne nativement dans les navigateurs. Grâce
  à Node.js, il tourne aussi côté serveur. Donc **un seul langage pour tout le projet**.
- **Implication** : tu n'as qu'une syntaxe à apprendre. Mais attention, JavaScript est
  *asynchrone* (voir 3.3) — c'est le concept le plus déroutant pour un débutant.
- **Règle du projet** : `const`/`let` uniquement (jamais `var`), pas de TypeScript.

### 3.2 Le backend : Node.js + Express

- **Node.js** : un *moteur* qui permet d'exécuter du JavaScript en dehors du
  navigateur (sur le serveur). Il sait lire des fichiers, écouter le réseau, etc.
- **Express** : un *framework* (une boîte à outils) minimaliste pour Node.js qui
  simplifie la création d'un serveur web. Il gère les routes et les *middlewares*.
- **Implication** : Express ne t'impose presque rien. C'est toi qui ranges le code.
  D'où l'importance des conventions (le squelette de contrôleur identique partout).

Le concept central d'Express est le **middleware** : une fonction qui reçoit la
requête (`req`), la réponse (`res`) et une fonction `next`. Elle peut soit traiter
la requête, soit la passer au suivant avec `next()`. Une requête traverse une
**chaîne** de middlewares. Ton `auth` est un middleware ; `express.json()` aussi.

```
requête → [cors] → [express.json] → [auth] → [requireRole] → [contrôleur] → réponse
```

### 3.3 Asynchronicité : `async` / `await` (le point clé pour débutant)

Quand le serveur interroge la base, ça prend du temps (quelques millisecondes,
mais c'est « long » pour un ordinateur). Plutôt que de **bloquer** tout le programme
en attendant, JavaScript **continue** et reviendra quand la réponse arrive. C'est
l'**asynchronicité**.

- Une fonction marquée `async` peut contenir des `await`.
- `await` veut dire « attends que cette opération longue se termine, puis donne-moi
  le résultat, **sans bloquer le reste du serveur** ».

```javascript
async function getById(req, res) {
  const item = await MonModele.findByPk(req.params.id); // on attend la base
  res.json(item);                                       // puis on répond
}
```

> 🎓 **Phrase d'oral** : « Toutes mes fonctions qui touchent la base sont `async`,
> et j'utilise `await` pour attendre le résultat sans bloquer le serveur. C'est ce
> qui permet de servir plusieurs utilisateurs en même temps. »

### 3.4 La base de données : MariaDB + l'ORM Sequelize

- **MariaDB** : une base de données **relationnelle** (cousine de MySQL). Les données
  sont rangées dans des **tables** (comme des feuilles Excel) avec des **lignes** et
  des **colonnes**. Les tables sont reliées entre elles par des **clés étrangères**.
- **SQL** : le langage pour parler aux bases relationnelles
  (`SELECT * FROM Disciple WHERE pays = 'Cameroun'`).
- **Sequelize** : un **ORM** (*Object-Relational Mapping*). C'est un traducteur :
  tu écris du JavaScript (`Disciple.findAll(...)`) et il génère le SQL à ta place.

**Pourquoi un ORM ?**
- Tu écris du JavaScript familier au lieu de jongler entre deux langages.
- Il protège contre les **injections SQL** (une attaque classique) en échappant
  automatiquement les valeurs.
- Il rend le code portable (changer de base = changer une ligne de config).

**Implication / limite** : un ORM cache le SQL. Pour des requêtes très pointues il
faut comprendre ce qu'il génère (d'où les `include`, `where`, `required` qu'on verra).

### 3.5 Le frontend : Vue.js 3 + Vite + Vue Router + Pinia + Axios

- **Vue.js 3** : un framework pour construire des interfaces **réactives** (l'écran
  se met à jour automatiquement quand les données changent). Tu écris des
  **composants** : des briques réutilisables `.vue` contenant HTML + JS + CSS.
- On utilise la **Composition API** avec `<script setup>` : la façon moderne et
  concise d'écrire un composant Vue.
- **Vite** : l'outil de développement. Il lance un serveur local ultra-rapide
  (port 5173) et fabrique la version finale optimisée (`vite build`).
- **Vue Router** : gère la navigation entre « pages » sans recharger le navigateur
  (application **monopage**, *SPA*). Il fait correspondre une URL à un composant.
- **Pinia** : le *magasin* (*store*) qui garde l'état partagé de l'application en
  mémoire (l'utilisateur connecté, la liste des disciples…).
- **Axios** : la bibliothèque qui envoie les requêtes HTTP au backend.

### 3.6 La sécurité : JWT + bcrypt

- **bcrypt** : algorithme qui transforme un mot de passe en **empreinte** (*hash*)
  impossible à inverser. On ne stocke **jamais** le mot de passe en clair.
- **JWT** (*JSON Web Token*) : un « ticket » signé numériquement que le serveur
  donne au client à la connexion. Le client le renvoie à chaque requête pour prouver
  son identité, sans avoir à se reconnecter. (Détails au chapitre 7.)

### 3.7 Récapitulatif visuel de la stack

```
  COUCHE              TECHNOLOGIE          RÔLE
  ─────────────────────────────────────────────────────────────────
  Présentation        Vue 3 + Vite         Afficher / interagir
  État client         Pinia                Mémoriser côté navigateur
  Navigation          Vue Router           Gérer les URL/pages
  Transport           Axios / HTTP / JSON  Échanger les données
  ─────────────────────────────────────────────────────────────────
  Serveur web         Express (Node.js)    Recevoir les requêtes
  Sécurité            JWT + bcrypt         Authentifier / autoriser
  Accès données       Sequelize (ORM)      Traduire JS ↔ SQL
  Stockage            MariaDB              Conserver les données
```

---

<a name="4"></a>
## 4. Le domaine métier : les 7 entités et leurs relations

Avant le code, il faut comprendre **le monde réel** que le logiciel modélise. C'est
la **modélisation du domaine**. Un bon logiciel est d'abord une bonne modélisation.

### 4.1 Le contexte CMCI

La CMCI veut former 100 millions de disciples, organisés en 1 million d'églises de
maison, dirigées par des faiseurs de disciples, à travers 200 nations. Tout se
faisait sur papier. Ton logiciel **centralise et pilote** cette œuvre.

### 4.2 Les 7 entités (= les 7 tables = les 7 « modèles »)

Une **entité** est un type d'objet du monde réel qu'on stocke. Chacune devient une
**table** en base et un **modèle** Sequelize.

| # | Entité | Ce qu'elle représente | Champs clés (réels) |
|---|---|---|---|
| 1 | **Disciple** | Toute personne du système (du membre de base au leader mondial) | `nom, prenom, telephone, motDePasse, role, pays, zoneCouverture, niveauFormation, statut` |
| 2 | **EgliseDeMaison** | Une église locale | `nomEglise, ville, pays, capaciteMax, statutEglise` |
| 3 | **Reunion** | Une rencontre organisée dans une église | `typeReunion, dateHeureDebut, dateHeureFin, statutReunion` |
| 4 | **RoutineSpirituelle** | Une pratique enregistrée par un disciple (lecture, prière…) | `typeRoutine, dateRoutine, dureeMinutes, notes` |
| 5 | **ValidationAvancement** | Une demande de passage de niveau | `niveauDemande, statutDirigeant, statutLeader, statutFinal` |
| 6 | **ContenuSpirituel** | Un message publié (sources : les 3B) | `titreContenu, langueOriginale, datePublication, fichierUrl` |
| 7 | **Traduction** | La traduction d'un contenu | `langueCible, titreTraduit, fichierUrl` |

Et **2 tables de jonction** (elles relient deux entités, voir 4.4) :

- **Presence** : un disciple est présent (ou non) à une réunion. Attribut : `present`.
- **Consultation** : un disciple a consulté un contenu. Attribut : `dateLecture`.

### 4.3 La hiérarchie des rôles (le champ `role` de Disciple)

Toutes les personnes sont des `Disciple` ; c'est leur **rôle** qui change ce qu'elles
peuvent faire :

```
LeaderMon  (Leader Mondial — 1 seul, voit tout)
  └── LeaderReg  (Leader Régional — une zone, ex. « Afrique Centrale »)
       └── LeaderNat  (Leader National — un pays)
            └── Dirigeant  (dirige UNE église de maison)
                 └── Disciple  (membre de base)

RespContenus  (à part : publie les contenus et traductions)
```

> ⚠️ **Règle métier piège** : les « 3B » (Bertoua, Brazzaville, Beijing) sont des
> **sources de contenu**, **pas** des leaders. Ne les confonds pas avec la hiérarchie.

### 4.4 Les relations entre entités (le cœur de la modélisation)

Trois types de relations existent en base relationnelle :

- **1–à–1** (*one-to-one*) : un dirigeant dirige **une seule** église.
- **1–à–plusieurs** (*one-to-many*) : une église a **plusieurs** membres ; chaque
  membre n'appartient qu'à une église.
- **plusieurs–à–plusieurs** (*many-to-many*) : un disciple participe à plusieurs
  réunions, et une réunion a plusieurs participants. → nécessite une **table de
  jonction** (`Presence`).

**La clé étrangère** (*foreign key*, FK) est le mécanisme technique : c'est une
colonne qui stocke l'`id` d'une ligne d'une autre table. Exemple : la table
`Disciple` a une colonne `id_eglise` qui pointe vers la ligne de son église.

**Règle d'or de ton projet** : chaque relation vers `Disciple` a une **FK au nom
explicite** (jamais un `disciple_id` générique), car un disciple peut jouer plusieurs
rôles dans différentes relations :

| Relation | FK | Sens |
|---|---|---|
| Église → son dirigeant | `idDirigeant` | qui dirige l'église |
| Disciple → son église | `idEglise` | à quelle église il appartient |
| Réunion → son organisateur | `idOrganisateur` | qui organise |
| Contenu → son publieur | `idPublieur` | qui publie |
| Traduction → son traducteur | `idTraducteur` | qui traduit |
| Routine → son disciple | `idDisciple` | qui enregistre |
| Validation → `idDisciple`, `idEvaluateur`, `idLeader` | le concerné, le dirigeant, le leader |

> 🎓 **Phrase d'oral** : « J'ai modélisé 7 entités. Les relations vers Disciple ont
> des clés étrangères nommées explicitement, car une même personne peut être à la
> fois membre, organisateur et évaluateur. Un `disciple_id` générique serait ambigu. »

### 4.5 Diagramme des relations (simplifié)

```
        dirige (1-1)
Disciple ─────────────▶ EgliseDeMaison ◀──── appartient (N-1) ──── Disciple (membres)
   │ (idDirigeant)            │                                    (idEglise)
   │                          │ se tient (1-N)
   │ organise (1-N)           ▼
   ├───────────────────▶  Reunion ◀═══ Presence ═══▶ Disciple   (N-N : participants)
   │ (idOrganisateur)
   │
   ├── enregistre (1-N) ─▶ RoutineSpirituelle
   │
   ├── concerné / évalue / valide ─▶ ValidationAvancement
   │
   ├── publie (1-N) ─▶ ContenuSpirituel ◀═══ Consultation ═══▶ Disciple (lecteurs)
   │                          │ possède (1-N)
   │                          ▼
   └── traduit (1-N) ─▶  Traduction
```

(`═══` = relation plusieurs-à-plusieurs via une table de jonction.)

---

<a name="5"></a>
## 5. La base de données et l'ORM Sequelize

### 5.1 Comment un modèle se définit (`backend/src/models/index.js`)

> ⚠️ Ce fichier est **généré** et **intouchable** (règle du projet). Mais tu dois
> savoir le **lire**, car c'est lui qui définit la forme de tes données et les alias.

Exemple réel, le modèle Disciple :

```javascript
const Disciple = sequelize.define(
  'Disciple',
  {
    idDisciple: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nom:       { type: DataTypes.STRING(100), allowNull: false },
    telephone: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    motDePasse:{ type: DataTypes.STRING(255), allowNull: false },
    role: {
      type: DataTypes.ENUM('Disciple','Dirigeant','LeaderNat','LeaderReg','LeaderMon','RespContenus'),
      defaultValue: 'Disciple',
    },
    niveauFormation: { type: DataTypes.INTEGER, defaultValue: 1 },
    statut: { type: DataTypes.ENUM('Actif','Inactif','Suspendu'), defaultValue: 'Actif' },
  },
  { tableName: 'Disciple', freezeTableName: true, underscored: true, timestamps: true }
);
```

Décodons chaque concept :

- **`primaryKey: true, autoIncrement: true`** : `idDisciple` est la **clé primaire**,
  l'identifiant **unique** de chaque ligne, généré automatiquement (1, 2, 3, …).
- **`allowNull: false`** : champ **obligatoire** (contrainte vérifiée par la base).
- **`unique: true`** sur `telephone` : deux disciples ne peuvent pas avoir le même
  numéro → c'est pour ça qu'on s'en sert comme identifiant de connexion.
- **`DataTypes.ENUM(...)`** : le champ ne peut prendre **qu'une** des valeurs listées.
  Impossible de mettre un rôle « Président » : la base refuse.
- **`defaultValue`** : valeur par défaut si on ne précise rien.
- **`timestamps: true`** : Sequelize ajoute automatiquement `created_at` et
  `updated_at` (dates de création/modification).
- **`underscored: true`** : en JavaScript on écrit `niveauFormation` (camelCase),
  mais en base la colonne s'appelle `niveau_formation` (snake_case). Sequelize
  traduit dans les deux sens.
- **`freezeTableName: true`** : empêche Sequelize de mettre la table au pluriel.

### 5.2 Les associations et les « alias »

Sous les modèles, le fichier déclare les **associations**. Exemple :

```javascript
// Une église a plusieurs membres ; un disciple appartient à une église
EgliseDeMaison.hasMany(Disciple, { as: 'membres', foreignKey: 'idEglise' });
Disciple.belongsTo(EgliseDeMaison, { as: 'eglise', foreignKey: 'idEglise', onDelete: 'SET NULL' });
```

- **`hasMany` / `belongsTo`** : décrivent une relation 1-à-plusieurs.
- **`as: 'membres'`** : l'**alias**. C'est le nom qu'on utilisera dans les requêtes
  pour récupérer la relation (`include: { association: 'membres' }`).
- **`onDelete: 'SET NULL'`** : si on supprime une église, ses membres ne sont pas
  supprimés ; leur `idEglise` passe simplement à `NULL`. (Comparé à `'CASCADE'` qui
  supprimerait aussi les enfants — utilisé par ex. pour les routines d'un disciple.)

Pour le plusieurs-à-plusieurs, on utilise `belongsToMany` avec `through` (la table
de jonction) :

```javascript
Reunion.belongsToMany(Disciple, {
  through: Presence, as: 'participants',
  foreignKey: 'idReunion', otherKey: 'idDisciple',
});
```

> 🎓 **À l'oral** : « Avant d'écrire un contrôleur, je lis les *alias* définis dans
> `index.js`, car ce sont eux que j'utilise dans les `include` pour charger les
> relations. » (C'est exactement ce que demande le `CLAUDE.md`.)

### 5.3 `seed.js` : remplir la base de données de démonstration

Le **seed** (« semence ») est un script qui **remplit la base de données initiale**
avec des données réalistes. Sans lui, ta base serait vide à la présentation.

Points importants de **ton** `seed.js` :
- `sequelize.sync({ force: true })` : **supprime et recrée** toutes les tables
  proprement avant d'insérer (utile pour repartir d'un état propre).
- `bcrypt.hashSync('password123', 10)` : les mots de passe sont **hachés** même
  dans le seed (jamais en clair).
- Des **dates relatives à aujourd'hui** (`jourISO(0)`, `dateHeure(3, 10)`) : on les a
  rendues dynamiques pour que les tableaux de bord (routines de la semaine, réunions
  à venir) soient toujours remplis le jour de la démo.
- `findOrCreate` : crée la ligne **seulement si** elle n'existe pas déjà (idempotent :
  relancer le seed ne crée pas de doublons).

Comptes de test créés : `0600000000` (Leader) … `0600000004`, tous avec le mot de
passe `password123`.

> Lancement : `npm run seed` dans le dossier `backend`.

---

<a name="6"></a>
## 6. Le backend : routes → contrôleurs → modèles

C'est l'architecture en couches du serveur. Une requête traverse **trois étages**.

```
   Requête HTTP
       │
       ▼
  ┌─────────────┐   « Quelle URL ? Quel verbe ? Qui a le droit ? »
  │   ROUTES    │   src/routes/*.js   → branche l'URL au bon contrôleur,
  └─────┬───────┘                       applique auth + requireRole
        ▼
  ┌─────────────┐   « Que faire concrètement ? » (la logique métier)
  │ CONTRÔLEURS │   src/controllers/*.js → valide, décide, appelle les modèles,
  └─────┬───────┘                          construit la réponse
        ▼
  ┌─────────────┐   « Parler à la base » (lire/écrire les données)
  │   MODÈLES   │   src/models/index.js (Sequelize) → génère le SQL
  └─────┬───────┘
        ▼
     MariaDB
```

### 6.1 Le point d'entrée : `src/app.js`

C'est le fichier qui **démarre le serveur**. Lis-le ligne par ligne :

```javascript
require('dotenv').config();          // charge les variables secrètes du fichier .env
const express = require('express');
const cors = require('cors');
const app = express();               // crée l'application serveur

app.use(cors({ origin: 'http://localhost:5173', credentials: true })); // autorise le frontend
app.use(express.json());             // sait lire le JSON reçu dans les requêtes
app.use('/api', require('./routes')); // toutes les routes sont préfixées par /api

app.get('/api/health', ...);         // route de test « le serveur est vivant ? »
app.use((_req, res) => res.status(404)...); // si aucune route ne correspond → 404
app.use((err, _req, res, _next) => ...);     // gestionnaire d'erreurs global → 500

app.listen(PORT, ...);               // met le serveur à l'écoute sur le port 3000
```

Concepts importants ici :

- **`require('dotenv').config()`** : lit le fichier `.env` (non versionné) qui
  contient les **secrets** : mot de passe de la base, `JWT_SECRET`. On ne les écrit
  **jamais en dur** dans le code (sécurité + portabilité).
- **CORS** (*Cross-Origin Resource Sharing*) : par défaut, un navigateur **interdit**
  à une page de `localhost:5173` d'appeler `localhost:3000` (origines différentes).
  `cors()` autorise explicitement ton frontend. Sans ça, le navigateur bloquerait
  tous les appels. **Question classique du prof !**
- **`express.json()`** : transforme le corps JSON d'une requête en objet JavaScript
  accessible via `req.body`. Sans lui, `req.body` serait `undefined`.
- **L'ordre compte** : le 404 et le gestionnaire d'erreurs sont **à la fin**, car
  Express exécute les middlewares **dans l'ordre**. Le 404 n'attrape que ce qu'aucune
  route précédente n'a traité.

### 6.2 Les routes (exemple réel : `src/routes/disciples.js`)

```javascript
const router = require('express').Router();
const auth = require('../middlewares/auth');
const { requireRole } = require('../middlewares/auth');
const { create, getAll, getById, update, remove } = require('../controllers/disciples');

const LEADERS = ['LeaderNat', 'LeaderReg', 'LeaderMon'];

router.post('/',    auth, requireRole('Dirigeant'),       create);  // créer = Dirigeant
router.get('/',     auth,                                 getAll);  // lire = tout connecté
router.get('/:id',  auth,                                 getById);
router.put('/:id',  auth, requireRole('Dirigeant', ...LEADERS), update);
router.delete('/:id', auth, requireRole(...LEADERS),      remove);  // supprimer = Leaders
```

À lire ainsi : « Pour une requête `POST` sur `/api/disciples`, exécute d'abord le
middleware `auth`, puis `requireRole('Dirigeant')`, puis le contrôleur `create`. »

- **`:id`** est un **paramètre d'URL** : dans `/api/disciples/42`, `req.params.id`
  vaut `"42"`.
- Les middlewares forment une **chaîne de sécurité** : si `auth` échoue, la requête
  s'arrête là (401) et n'atteint jamais le contrôleur.

Le fichier `src/routes/index.js` rassemble tout :

```javascript
router.use('/auth', require('./auth'));
router.use('/disciples', require('./disciples'));
// … une ligne par ressource
```

### 6.3 Les contrôleurs : le squelette imposé

Chaque contrôleur suit **le même patron** (c'est une convention forte du projet).
Voici la version générique du `CLAUDE.md`, que tu dois pouvoir réciter :

```javascript
async function getById(req, res) {
  try {
    const item = await MonModele.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'Non trouvé' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
}
```

Les invariants à connaître :
- **Toujours `try/catch`** : si quoi que ce soit échoue (base injoignable, bug),
  on renvoie un `500` propre au lieu de planter le serveur.
- **Vérifier l'existence** : `if (!item) return 404` avant d'utiliser l'objet.
- **Les méthodes Sequelize de base** : `findAll` (liste), `findByPk` (par clé
  primaire), `findOne` (premier qui correspond), `create`, `update`, `destroy`.
- **`attributes: { exclude: ['motDePasse'] }`** : on n'envoie **JAMAIS** le mot de
  passe (même haché) dans une réponse.

### 6.4 Les filtres et les `include`

**Filtrer** (clause `where`) à partir des paramètres d'URL :

```javascript
const where = {};
if (req.query.pays) where.pays = req.query.pays;   // GET /api/disciples?pays=Cameroun
if (req.query.role) where.role = req.query.role;
const disciples = await Disciple.findAll({ where });
```

**Joindre** des données reliées (`include`) en utilisant les alias :

```javascript
const disciples = await Disciple.findAll({
  attributes: { exclude: ['motDePasse'] },
  include: [{ model: EgliseDeMaison, as: 'eglise', attributes: ['idEglise','nomEglise','ville','pays'] }],
  order: [['nom', 'ASC']],
});
```

Ici, pour chaque disciple, Sequelize va **aussi** chercher son église (via la FK
`idEglise`) et l'imbriquer dans le résultat JSON. C'est l'équivalent d'un **JOIN** SQL.

---

<a name="7"></a>
## 7. L'authentification et la sécurité (JWT, bcrypt, RBAC)

C'est **le** sujet où les profs attaquent. Maîtrise-le à fond.

### 7.1 Authentification ≠ Autorisation

- **Authentification** (*authentication*) = « **Qui es-tu ?** » → prouver son identité
  (login). Résultat : un **token**.
- **Autorisation** (*authorization*) = « **As-tu le droit de faire ça ?** » → vérifier
  les permissions selon le rôle. C'est le **RBAC** (*Role-Based Access Control*).

### 7.2 Pourquoi bcrypt ? (le hachage des mots de passe)

On ne stocke **jamais** un mot de passe en clair. Si la base fuite, tous les comptes
seraient compromis. À la place :

- À la création : `bcrypt.hash('password123', 10)` produit une **empreinte**
  irréversible (le « 10 » = le *coût*, le nombre de tours de calcul : plus c'est
  haut, plus c'est lent à casser).
- À la connexion : `bcrypt.compare(motDePasseSaisi, empreinteStockée)` renvoie
  `true`/`false`. On ne « déchiffre » jamais — on **recompare**.

> 🎓 « bcrypt est une fonction de hachage **à sens unique** : on ne peut pas
> retrouver le mot de passe à partir de l'empreinte. À la connexion, je recompare. »

### 7.3 Le flux de connexion (`controllers/auth.js`)

```javascript
async function login(req, res) {
  const { telephone, motDePasse } = req.body;
  if (!telephone || !motDePasse) return res.status(400)...;       // 1. champs présents ?

  const disciple = await Disciple.findOne({ where: { telephone } }); // 2. existe ?
  if (!disciple) return res.status(401).json({ message: 'Identifiants invalides' });

  if (disciple.statut !== 'Actif') return res.status(403)...;     // 3. compte actif ?

  const valide = await bcrypt.compare(motDePasse, disciple.motDePasse); // 4. mot de passe ?
  if (!valide) return res.status(401)...;

  const token = jwt.sign(                                          // 5. fabriquer le ticket
    { id: disciple.idDisciple, role: disciple.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }                                  // expire après 7 jours
  );
  return res.json({ token, utilisateur: { ... } });               // 6. renvoyer token + infos
}
```

Détails à remarquer :
- On répond **`401` « Identifiants invalides »** que le téléphone soit inconnu **ou**
  le mot de passe faux. **Sécurité** : ne pas révéler à un attaquant *lequel* des deux
  est faux (sinon il devine quels numéros existent).
- Le **payload** du token ne contient que `{ id, role }` — le strict nécessaire.
  Jamais le mot de passe.

### 7.4 Qu'est-ce qu'un JWT, concrètement ?

Un JWT est une chaîne en trois parties séparées par des points : `xxxxx.yyyyy.zzzzz`.

```
  HEADER . PAYLOAD . SIGNATURE
  (algo)   (données) (preuve que c'est bien le serveur qui l'a émis)
```

- Le **payload** contient `{ id: 3, role: 'Dirigeant', exp: ... }` (lisible par tous,
  **non chiffré** — donc on n'y met jamais de secret).
- La **signature** est calculée par le serveur avec sa clé secrète `JWT_SECRET`.
  Si quelqu'un modifie le payload (par ex. passe `role` à `LeaderMon`), la signature
  ne correspond plus et le serveur **rejette** le token. C'est ça qui le rend sûr.

**Avantage** : le serveur n'a **rien à stocker**. Il vérifie le token à chaque
requête grâce à sa clé. On dit que c'est **sans état** (*stateless*).

### 7.5 Le middleware d'authentification (`middlewares/auth.js`)

À **chaque** requête protégée, ce middleware s'exécute en premier :

```javascript
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;            // « Bearer xxxxx.yyyyy.zzzzz »
  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ message: 'Token manquant' });

  const token = authHeader.split(' ')[1];                  // on isole le token
  try {
    const payload = jwt.verify(token, JWT_SECRET);         // vérifie la signature + l'expiration
    req.user = { id: payload.id, role: payload.role };     // on attache l'identité à la requête
    next();                                                // tout va bien → on continue
  } catch (err) {
    return res.status(401).json({ message: 'Token invalide ou expiré' });
  }
}
```

Le point génial : après ce middleware, **tous** les contrôleurs disposent de
`req.user.id` et `req.user.role` **de confiance** (vérifiés cryptographiquement). Le
contrôleur n'a pas besoin de refaire le travail d'identification.

### 7.6 Le middleware d'autorisation par rôle (RBAC)

```javascript
function requireRole(...rolesAutorises) {        // ex. requireRole('Dirigeant', 'LeaderNat')
  return (req, res, next) => {
    if (!req.user || !rolesAutorises.includes(req.user.role))
      return res.status(403).json({ message: 'Accès non autorisé pour ce rôle' });
    next();
  };
}
```

C'est une **fonction qui fabrique un middleware** (*higher-order function*). On
l'utilise dans les routes : `router.delete('/:id', auth, requireRole(...LEADERS), remove)`.

### 7.7 La défense en profondeur (concept clé)

La sécurité de ton projet a **trois niveaux** qui se renforcent :

1. **Au niveau route** : `requireRole(...)` bloque les rôles non autorisés (403).
2. **Au niveau contrôleur** : des vérifications fines (« ce disciple appartient-il
   bien à TON église ? »). Voir le chapitre 8.
3. **Au niveau requête base** : le `where` filtré par rôle ne **récupère même pas**
   les données interdites.

> 🎓 « Je pratique la **défense en profondeur** : même si une couche est contournée,
> les autres protègent. Et le frontend ne fait que **masquer** des boutons — la
> vraie sécurité est **toujours** côté serveur, car le client n'est pas de confiance. »

---

<a name="8"></a>
## 8. La logique métier (le plus important pour la note)

Le CRUD (créer/lire/modifier/supprimer) est banal. Ce qui fait la **valeur** de ton
projet, ce sont les **règles métier**. En voici trois, expliquées à fond.

### 8.1 La visibilité filtrée par rôle (`controllers/disciples.js`)

**Règle** : chacun ne voit que ce qui le concerne. C'est le **principe de moindre
privilège** mis en code. La fonction `whereSelonRole` construit un filtre différent
selon le rôle :

```javascript
async function whereSelonRole(req) {
  const role = req.user.role;
  const where = {};

  if (role === 'Disciple') {                 // un disciple ne voit QUE lui-même
    where.idDisciple = req.user.id;
    return where;
  }
  if (role === 'Dirigeant') {                // un dirigeant ne voit que SON église
    const monEglise = await EgliseDeMaison.findOne({ where: { idDirigeant: req.user.id } });
    where.idEglise = monEglise ? monEglise.idEglise : -1;  // -1 = aucune correspondance
    return where;
  }
  if (role === 'LeaderNat') {                // un leader national : son pays
    const moi = await Disciple.findByPk(req.user.id, { attributes: ['pays'] });
    if (moi?.pays) where.pays = moi.pays;
    return where;
  }
  // LeaderReg → sa zoneCouverture ; LeaderMon → tout (aucun filtre)
  return where;
}
```

L'astuce du `-1` : si le dirigeant n'a pas d'église, on met `idEglise = -1` qui ne
correspond à aucune ligne → il ne voit **rien**, plutôt que de tout voir par accident.
C'est du **fail-safe** (en cas de doute, on **refuse**).

### 8.2 L'inscription contrôlée (pas d'auto-inscription)

**Règle métier** : « une personne qui demande l'inscription n'est pas encore un
disciple » et « les disciples ne se nomment pas eux-mêmes ». Conséquences dans le code :

- **Il n'y a pas de route `/register` publique.** (La page `RegisterView.vue` a été
  supprimée.) Un disciple est créé **par son dirigeant**.
- Dans `create`, le serveur **impose** le rôle et l'église — le dirigeant ne choisit pas :

```javascript
const disciple = await Disciple.create({
  nom, prenom, telephone,
  motDePasse: hash,
  idEglise: monEglise.idEglise, // rattachement AUTOMATIQUE à l'église du dirigeant
  role: 'Disciple',             // rôle IMPOSÉ : pas de choix possible
  statut: 'Actif',
});
```

> 🎓 « Je ne fais jamais confiance aux données du client pour les champs sensibles.
> Même si le frontend envoyait `role: 'LeaderMon'`, le serveur l'ignore et force
> `role: 'Disciple'`. »

### 8.3 La double validation d'avancement (`controllers/validations.js`)

**Règle métier** : passer un disciple à un niveau supérieur exige **deux accords
successifs** : d'abord le **dirigeant** évalue, puis le **leader** valide. C'est une
**machine à états** (*state machine*).

```
   [Création par le Dirigeant]
            │  statutDirigeant = EnAttente
            ▼
   PUT /:id/evaluer   (Dirigeant, l'évaluateur désigné)
            │  statutDirigeant = Approuve | Rejete
            ▼
   PUT /:id/valider   (Leader) — refusé si statutDirigeant ≠ Approuve
            │  statutLeader = statutFinal = Approuve | Rejete
            ▼
   Si Approuve → on monte le niveauFormation du disciple
```

Les garde-fous dans le code :

```javascript
// Étape 1 — seul l'évaluateur désigné peut évaluer :
if (validation.idEvaluateur !== req.user.id)
  return res.status(403).json({ message: 'Vous n\'êtes pas l\'évaluateur de cette demande' });

// Étape 2 — le leader ne peut valider QUE si le dirigeant a déjà approuvé :
if (validation.statutDirigeant !== 'Approuve')
  return res.status(400).json({ message: 'La validation du dirigeant est requise d\'abord' });

// Conséquence de l'approbation finale — on applique le changement de niveau :
if (decision === 'Approuve') {
  await Disciple.update(
    { niveauFormation: validation.niveauDemande },
    { where: { idDisciple: validation.idDisciple } }
  );
}
```

Et le **cloisonnement géographique** du leader (dans `getAll`) utilise une jointure
filtrante : `inclureDisciple.required = true` transforme le `include` en **INNER JOIN**,
ce qui **exclut** les demandes hors de la zone du leader.

```javascript
if (role === 'LeaderNat' && moi?.pays) {
  inclureDisciple.required = true;          // INNER JOIN
  inclureDisciple.where = { pays: moi.pays }; // seulement son pays
}
```

### 8.4 Les présences (`controllers/reunions.js`)

Enregistrer l'appel d'une réunion = remplir la table de jonction `Presence`. La
stratégie « **on efface puis on recrée** » :

```javascript
if (reunion.idOrganisateur !== req.user.id)            // seul l'organisateur fait l'appel
  return res.status(403)...;

await Presence.destroy({ where: { idReunion: req.params.id } });  // on efface l'ancien appel
const records = presences.map((p) => ({                           // on reconstruit
  idReunion: req.params.id, idDisciple: p.idDisciple, present: p.present === true,
}));
await Presence.bulkCreate(records);                               // insertion en masse
```

C'est plus simple que de calculer les différences ligne par ligne, et garantit un
état cohérent. `bulkCreate` insère tout en une seule opération (performant).

---

<a name="9"></a>
## 9. Le frontend : application monopage Vue 3

### 9.1 SPA : qu'est-ce qu'une « application monopage » ?

Dans un site classique, chaque clic recharge une page entière depuis le serveur.
Dans une **SPA** (*Single Page Application*), le navigateur charge l'application **une
fois**, puis **Vue Router** échange les composants à l'écran **sans recharger**. Les
données sont récupérées en arrière-plan via l'API. Résultat : une expérience fluide,
comme une application de bureau.

> ⚠️ **Conséquence importante de ton projet** : l'état (token, utilisateur) est gardé
> en mémoire dans **Pinia**, et **pas** dans `localStorage` (interdit par le projet).
> Donc **si tu rafraîchis la page (F5), tu es déconnecté** : Pinia repart de zéro.
> C'est un choix assumé. Sache l'expliquer si le prof recharge la page pendant la démo.

### 9.2 Anatomie d'un composant Vue (`<script setup>`)

Un fichier `.vue` a trois sections :

```vue
<template> … le HTML (ce qui s'affiche) … </template>
<script setup> … le JavaScript (la logique) … </script>
<style scoped> … le CSS (le style, limité à ce composant) … </style>
```

Concepts de réactivité (le cœur de Vue) :

- **`ref(valeur)`** : crée une variable **réactive**. Quand sa `.value` change,
  l'écran se met à jour tout seul. `const loading = ref(false)`.
- **`reactive({...})`** : pareil mais pour un objet entier. `const form = reactive({ telephone:'', motDePasse:'' })`.
- **`computed(() => ...)`** : une valeur **calculée** qui se recalcule quand ses
  dépendances changent. Ex. `isAuthenticated = computed(() => !!token.value)`.
- **`onMounted(() => ...)`** : code exécuté **quand le composant apparaît** à l'écran
  (typiquement : aller chercher les données via l'API).
- **`v-model`** : lie un champ de formulaire à une variable (synchronisation
  bidirectionnelle). `<input v-model="form.telephone">`.
- **`v-if` / `v-for`** : afficher conditionnellement / répéter sur une liste.
- **`@submit.prevent`, `@click`** : écouter des événements (le `.prevent` empêche le
  rechargement par défaut du formulaire).

### 9.3 Le service API (`services/api.js`) : une instance Axios partagée

```javascript
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) window.location.href = '/login'; // token mort → login
    return Promise.reject(error);
  }
);
```

- **`baseURL`** : toutes les requêtes partent de `http://localhost:3000/api`, donc
  dans le code on écrit juste `api.get('/disciples')`. **DRY** : un seul endroit à
  changer pour passer en production.
- **L'intercepteur** : un « filtre » exécuté sur **chaque** réponse. Si le serveur
  renvoie `401` (token expiré), il **redirige automatiquement** vers la connexion.

### 9.4 Les stores Pinia : l'état partagé

Un **store** centralise un morceau d'état + les fonctions pour le manipuler. Le plus
important est `stores/auth.js` :

```javascript
export const useAuthStore = defineStore('auth', () => {
  const token = ref(null);
  const utilisateur = ref(null);
  const isAuthenticated = computed(() => !!token.value);
  const estDirigeant = computed(() => role.value === 'Dirigeant');

  function setSession(newToken, newUtilisateur) {
    token.value = newToken;
    utilisateur.value = newUtilisateur;
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`; // ★ clé !
  }

  async function login(telephone, motDePasse) {
    const { data } = await api.post('/auth/login', { telephone, motDePasse });
    setSession(data.token, data.utilisateur);
    return data;
  }
  // …
});
```

Le point **★ essentiel** : après connexion, on enregistre le token comme **en-tête par
défaut** d'Axios. Du coup, **toutes** les requêtes suivantes envoient
automatiquement `Authorization: Bearer <token>` — c'est ainsi que le backend sait
qui tu es à chaque appel.

Les autres stores (`disciples.js`, etc.) suivent tous le même modèle : un état
(`liste`, `loading`, `erreur`) et des actions (`fetchAll`, `fetchById`, `create`,
`update`, `remove`) qui appellent l'API. Exemple :

```javascript
async function fetchAll(filtres = {}) {
  loading.value = true; erreur.value = '';
  try {
    const { data } = await api.get('/disciples', { params: filtres });
    disciples.value = data;                                   // l'écran se met à jour seul
  } catch (err) {
    erreur.value = err.response?.data?.message || 'Erreur lors du chargement';
  } finally {
    loading.value = false;                                    // dans tous les cas, on arrête le spinner
  }
}
```

### 9.5 Le routeur et ses « gardes » (`router/index.js`)

Le routeur associe chaque URL à un composant, et protège les pages :

```javascript
router.beforeEach((to) => {
  const auth = useAuthStore();
  if (to.meta.requiresAuth && !auth.isAuthenticated) return { name: 'Login' };     // page protégée
  if (to.meta.guest && auth.isAuthenticated) return { name: 'Dashboard' };          // déjà connecté
  if (to.meta.roles && !to.meta.roles.includes(auth.role)) return { name: 'Dashboard' }; // mauvais rôle
});
```

- **`beforeEach`** est un **garde de navigation** : il s'exécute **avant** chaque
  changement de page. Il peut **rediriger**.
- Les pages portent des **métadonnées** (`meta`) : `requiresAuth`, `guest`, `roles`.
  Ex. la page « nouveau disciple » a `meta: { roles: ['Dirigeant'] }`.
- **`component: () => import('...')`** : c'est du **chargement paresseux** (*lazy
  loading*) — le code d'une page n'est téléchargé que lorsqu'on y va. Ça accélère le
  démarrage.

> ⚠️ Rappel sécurité : cette protection frontend est du **confort**, pas de la
> sécurité. Elle empêche d'afficher une page, mais un utilisateur malveillant
> pourrait toujours appeler l'API directement. **C'est pourquoi le backend revérifie
> tout.** Les deux gardes (frontend et backend) sont complémentaires.

### 9.6 Les composants réutilisables (`components/common/`)

Pour respecter **DRY**, l'UI répétée est extraite en composants :
`DataTable` (tableau générique), `AlertMessage` (message d'erreur/succès),
`LoadingSpinner` (indicateur de chargement), `ConfirmModal` (boîte de confirmation),
`StatCard` (carte de statistique). On les **réutilise** dans toutes les vues, ce qui
évite de réécrire le même HTML/CSS partout.

---

<a name="10"></a>
## 10. Le cycle de vie complet d'une requête (de bout en bout)

Mettons tout bout à bout avec un scénario concret : **un dirigeant inscrit un
nouveau disciple**. Suis le voyage de la donnée à travers **toutes** les couches.

```
1. NAVIGATEUR — Le dirigeant remplit le formulaire (DiscipleForm.vue) et clique « Enregistrer ».
   └─ v-model a déjà rempli l'objet `form = { nom, prenom, telephone, motDePasse }`.

2. STORE — La vue appelle store.create(form) → qui appelle api.post('/disciples', form).
   └─ Axios ajoute automatiquement l'en-tête Authorization: Bearer <token>.

3. RÉSEAU — Une requête HTTP POST part vers http://localhost:3000/api/disciples
   avec le corps JSON { nom, prenom, telephone, motDePasse }.

4. BACKEND / app.js — cors() autorise l'origine, express.json() transforme le JSON en req.body.

5. ROUTES — /api/disciples (POST) déclenche la chaîne : auth → requireRole('Dirigeant') → create.
   ├─ auth : vérifie le token, pose req.user = { id, role }. Token absent/faux → 401, STOP.
   └─ requireRole('Dirigeant') : si role ≠ Dirigeant → 403, STOP.

6. CONTRÔLEUR — disciples.create(req, res) :
   ├─ valide la présence de nom/prenom/telephone/motDePasse → sinon 400.
   ├─ trouve l'église dirigée par req.user.id → sinon 400 « vous ne dirigez aucune église ».
   ├─ vérifie l'unicité du téléphone → sinon 409.
   ├─ hache le mot de passe avec bcrypt.
   └─ Disciple.create({ ... role:'Disciple', idEglise imposé }).

7. MODÈLE / SEQUELIZE — traduit create(...) en INSERT INTO Disciple (...) VALUES (...).

8. MARIADB — écrit la ligne sur le disque, génère idDisciple, renvoie la ligne.

9. REMONTÉE — le contrôleur répond 201 { idDisciple, message: 'Disciple inscrit avec succès' }.

10. STORE/VUE — la promesse d'Axios se résout, la vue affiche un message de succès
    et redirige (router.push) vers la liste des disciples. L'écran se met à jour.
```

Si **n'importe quelle** étape échoue, la couche concernée renvoie un code d'erreur
clair (400/401/403/409/500) que le frontend affiche via `AlertMessage`. **Aucune
exception ne fait planter le serveur** grâce aux `try/catch`.

> 🎓 Savoir raconter ce voyage **de mémoire** impressionne n'importe quel jury : ça
> prouve que tu comprends l'architecture entière, pas juste des bouts isolés.

---

<a name="11"></a>
## 11. Recettes : comment modifier le projet sans rien casser

Voici des « recettes » pas-à-pas pour les modifications les plus courantes. Le secret :
**toujours suivre le même chemin** (modèle → backend → frontend).

### Recette A — Ajouter un champ à une entité (ex. `email` au Disciple)

> ⚠️ Le fichier `models/index.js` est marqué intouchable (généré). Dans le cadre de
> l'examen, si tu **dois** ajouter un champ, fais-le proprement et explique-le.

1. **Modèle** : ajouter `email: { type: DataTypes.STRING(150) }` dans `Disciple`.
2. **Base** : relancer `npm run seed` (recrée les tables avec la nouvelle colonne)
   *ou* faire une migration si on ne veut pas perdre les données.
3. **Backend** : dans `disciples.js`, autoriser le champ dans `create`/`update`
   (l'ajouter à la liste des champs extraits de `req.body`).
4. **Frontend** : ajouter un `<input v-model="form.email">` dans `DiscipleForm.vue`
   et une colonne dans `DisciplesList.vue` si on veut l'afficher.

### Recette B — Ajouter un nouveau point d'API (endpoint)

1. **Contrôleur** : écrire la fonction (`async function maFonction(req, res){ try{…}catch{…} }`)
   en respectant le squelette (try/catch, codes HTTP, exclude motDePasse).
2. **Route** : la brancher dans le bon fichier de `routes/` avec les middlewares
   adéquats : `router.get('/stats', auth, requireRole(...), maFonction)`.
3. **Store** : ajouter une action qui appelle `api.get('/.../stats')`.
4. **Vue** : appeler l'action (souvent dans `onMounted`) et afficher le résultat.

### Recette C — Ajouter une nouvelle page protégée

1. **Vue** : créer `src/views/.../MaPage.vue`.
2. **Routeur** : ajouter une route enfant sous `/app` avec, si besoin,
   `meta: { roles: ['…'] }`.
3. **Menu** : ajouter le lien dans `AppSidebar.vue` (en le conditionnant au rôle
   avec `v-if="auth.estDirigeant"` par exemple).

### Recette D — Restreindre une action à un rôle

- **Côté backend (obligatoire)** : ajouter `requireRole('…')` sur la route, et/ou
  un test dans le contrôleur.
- **Côté frontend (confort)** : masquer le bouton avec `v-if="auth.estLeader"` et
  ajouter `meta.roles` sur la route.
- **Ne jamais** se contenter du frontend : la sécurité **doit** être au backend.

### Les pièges à éviter (règles du projet)

- ❌ Ne **jamais** renvoyer `motDePasse` → toujours `attributes: { exclude: ['motDePasse'] }`.
- ❌ Ne jamais mettre de logique dans une route → tout dans le contrôleur.
- ❌ Ne jamais oublier le `try/catch`.
- ❌ Ne jamais utiliser `var`, ni `localStorage`/`sessionStorage`.
- ❌ Ne jamais écrire un secret en dur → toujours via `.env`.
- ❌ Ne jamais dépasser ~100-150 lignes par fichier → découper.

---

<a name="12"></a>
## 12. Questions probables du professeur + réponses

> Entraîne-toi à répondre **à voix haute**, avec tes mots.

**Q1. « Pourquoi séparer frontend et backend ? »**
R. Sécurité (les secrets restent au serveur), centralisation des règles métier, et
indépendance (on peut changer la base ou ajouter un client mobile sans tout refaire).
Ils communiquent par une API REST en JSON.

**Q2. « Comment fonctionne l'authentification ? »**
R. À la connexion, je vérifie le téléphone et compare le mot de passe avec bcrypt.
Si c'est bon, je génère un JWT signé contenant `{ id, role }`. Le client le renvoie
dans l'en-tête `Authorization` à chaque requête ; un middleware le vérifie avec la
clé secrète et attache `req.user`. C'est *stateless* : le serveur ne stocke rien.

**Q3. « Où sont stockés les mots de passe ? »**
R. Jamais en clair. On stocke une empreinte bcrypt (hachage à sens unique, coût 10).
À la connexion je recompare ; je ne déchiffre jamais.

**Q4. « Qu'est-ce que CORS et pourquoi en avez-vous besoin ? »**
R. Le navigateur interdit par défaut qu'une page d'une origine (`:5173`) appelle une
autre origine (`:3000`). Le middleware `cors` autorise explicitement mon frontend.

**Q5. « Comment gérez-vous les permissions ? »**
R. RBAC en défense en profondeur : `requireRole` au niveau route (403), vérifications
fines dans les contrôleurs (« ce disciple est-il dans MON église ? »), et filtres
`where` par rôle qui ne récupèrent même pas les données interdites.

**Q6. « Un disciple peut-il s'inscrire seul ? »**
R. Non. Pas de route `/register` publique. C'est le dirigeant qui inscrit ses membres,
et le serveur **impose** `role: 'Disciple'` et l'église — conforme à la règle métier.

**Q7. « Expliquez la double validation d'avancement. »**
R. C'est une machine à états : le dirigeant crée la demande et l'évalue
(`statutDirigeant`), puis un leader valide (`statutLeader`/`statutFinal`). Le leader
ne peut valider que si le dirigeant a approuvé. Si approuvé, le `niveauFormation` du
disciple est mis à jour.

**Q8. « Qu'est-ce qu'un ORM ? Avantages/limites ? »**
R. Sequelize traduit mes objets JavaScript en SQL. Avantages : un seul langage,
protection contre les injections SQL, portabilité. Limite : il masque le SQL réel,
donc il faut comprendre ce qu'il génère pour les requêtes complexes (`include`, `required`).

**Q9. « Pourquoi `async`/`await` partout ? »**
R. Les accès base sont longs. `await` attend le résultat **sans bloquer** le serveur,
qui peut donc servir d'autres utilisateurs pendant ce temps.

**Q10. « Que se passe-t-il si je rafraîchis la page après connexion ? »**
R. Je suis déconnecté, car l'état est en mémoire (Pinia) et non en `localStorage`
(interdit par les contraintes du projet). C'est un compromis assumé.

**Q11. « Comment l'écran se met-il à jour tout seul ? »**
R. Grâce à la **réactivité** de Vue : mes données sont des `ref`/`reactive` ;
quand je modifie leur valeur (ex. après un `fetch`), Vue recalcule et redessine
automatiquement les parties du DOM concernées.

**Q12. « Où est la validation des données ? »**
R. À deux endroits : contraintes du modèle (`allowNull`, `unique`, `ENUM`) appliquées
par la base, et vérifications explicites dans les contrôleurs (champs requis, droits)
qui renvoient des `400`/`403`/`409`.

---

<a name="13"></a>
## 13. Glossaire (à relire la veille)

| Terme | Définition courte |
|---|---|
| **API REST** | Style d'interface où des ressources (noms) sont manipulées par des verbes HTTP. |
| **Backend / Frontend** | Serveur (logique + base) / interface dans le navigateur. |
| **bcrypt** | Algorithme de hachage à sens unique des mots de passe. |
| **CORS** | Règle navigateur qui autorise/interdit les appels entre origines différentes. |
| **CRUD** | Create, Read, Update, Delete : les 4 opérations de base. |
| **Clé étrangère (FK)** | Colonne qui référence l'id d'une autre table (lien entre tables). |
| **Clé primaire** | Identifiant unique d'une ligne (`idDisciple`). |
| **Composant** | Brique d'interface réutilisable Vue (`.vue`). |
| **Computed** | Valeur Vue recalculée automatiquement à partir d'autres données. |
| **Contrôleur** | Fonction backend qui contient la logique d'une route. |
| **Défense en profondeur** | Empiler plusieurs couches de sécurité indépendantes. |
| **DRY** | « Don't Repeat Yourself » : ne pas dupliquer le code. |
| **Endpoint** | Un point d'entrée de l'API (méthode + URL). |
| **ENUM** | Type dont la valeur est limitée à une liste fixe. |
| **Express** | Framework serveur minimaliste pour Node.js. |
| **Garde de navigation** | Fonction Vue Router exécutée avant un changement de page. |
| **Hash (empreinte)** | Résultat irréversible d'une fonction de hachage. |
| **HTTP** | Protocole de communication requête/réponse du web. |
| **Injection SQL** | Attaque insérant du SQL malveillant ; évitée par l'ORM. |
| **JSON** | Format texte d'échange de données. |
| **JWT** | Jeton signé prouvant l'identité, sans état côté serveur. |
| **Lazy loading** | Charger le code d'une page seulement au besoin. |
| **Middleware** | Fonction Express insérée dans la chaîne de traitement d'une requête. |
| **Modèle** | Représentation JavaScript d'une table (Sequelize). |
| **Moindre privilège** | N'accorder que les droits strictement nécessaires. |
| **ORM** | Traducteur objets ↔ base relationnelle (Sequelize). |
| **Pinia** | Magasin d'état partagé du frontend. |
| **Payload** | Contenu (données) d'un JWT ou d'une requête. |
| **RBAC** | Contrôle d'accès basé sur les rôles. |
| **Réactivité** | Mise à jour automatique de l'UI quand les données changent. |
| **ref / reactive** | Variables réactives de Vue. |
| **Route** | Association URL + verbe → contrôleur. |
| **Seed** | Script qui remplit la base de données de démonstration. |
| **Sequelize** | L'ORM utilisé côté backend. |
| **SPA** | Single Page Application : appli web sans rechargement de page. |
| **Stateless** | Sans état : le serveur ne mémorise pas la session. |
| **Store** | Conteneur d'état Pinia. |
| **Table de jonction** | Table reliant deux entités en relation N-N (Presence, Consultation). |
| **try/catch** | Structure qui capture les erreurs pour éviter un plantage. |
| **Vite** | Outil de développement/build du frontend. |
| **Vue Router** | Système de navigation entre pages côté frontend. |

---

## Conclusion : le fil rouge à garder en tête

Tout ton projet répond à **une même logique** répétée à chaque fonctionnalité :

> **Le client demande → le serveur vérifie l'identité (JWT) → vérifie les droits
> (RBAC) → applique la règle métier → l'ORM lit/écrit la base → le serveur répond
> proprement → le frontend réagit et affiche.**

Si tu sais raconter ce fil rouge pour **n'importe quelle** fonctionnalité (connexion,
inscription d'un disciple, double validation, présences…), tu maîtrises ton projet
de bout en bout. Le reste n'est que du vocabulaire, et tu l'as maintenant dans le
glossaire.

Bon courage pour la présentation. 🎓
