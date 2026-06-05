# Guide de tests — Système de gestion CMCI

Ce document liste **tous les tests manuels** à réaliser pour vérifier le bon
fonctionnement de l'application après les corrections (cohérence géographique,
hiérarchie des leaders, profil/photo, icônes).

---

## 0. Préparation

```bash
# 1. (Re)remplir la base avec des données cohérentes
cd backend
npm run seed

# 2. Lancer le backend (port 3000)
npm run dev

# 3. Dans un autre terminal, lancer le frontend (port 5173)
cd frontend
npm run dev
```

Ouvrir le navigateur sur **http://localhost:5173**.

### Comptes de test (mot de passe partout : `password123`)

| Rôle | Téléphone | Église / Périmètre |
|------|-----------|--------------------|
| Leader Mondial | `0600000000` | Monde |
| Leader Régional – Afrique Centrale | `0600000010` | Cameroun + Gabon |
| Leader Régional – Europe de l'Ouest | `0600000011` | France |
| Leader National – Cameroun | `0600000020` | Cameroun |
| Leader National – Gabon | `0600000021` | Gabon |
| Leader National – France | `0600000022` | France |
| Responsable Contenus | `0600000030` | — |
| Dirigeant Yaoundé | `0611000000` | Église « Source de Vie » |
| Membre Yaoundé (Grace) | `0611000001` | Église « Source de Vie » |
| Membre Yaoundé (Joseph) | `0611000002` | Église « Source de Vie » |
| Membre Yaoundé (Ruth) | `0611000003` | Église « Source de Vie » |
| Dirigeant Libreville | `0612000000` | Église « Bethel » |
| Membres Libreville | `0612000001`, `0612000002` | Église « Bethel » |
| Dirigeant Paris | `0613000000` | Église « La Grâce » |
| Membres Paris | `0613000001`, `0613000002` | Église « La Grâce » |

---

## 1. Authentification

| # | Étapes | Résultat attendu |
|---|--------|------------------|
| 1.1 | Se connecter avec `0611000001` / `password123` | Connexion OK, redirection vers le tableau de bord |
| 1.2 | Se connecter avec un mauvais mot de passe | Message « Identifiants invalides », pas de connexion |
| 1.3 | Se connecter avec un téléphone inexistant | Message « Identifiants invalides » |
| 1.4 | Cliquer sur « Déconnexion » (bas de la sidebar) | Retour à la page de connexion |

---

## 2. Mon Profil, photo et mot de passe

Se connecter avec **un disciple** : `0611000001` (Grace).

| # | Étapes | Résultat attendu |
|---|--------|------------------|
| 2.1 | Cliquer sur **Mon Profil** (sidebar) ou sur l'avatar (header) | La page affiche prénom, nom, téléphone, rôle, **pays**, **église** |
| 2.2 | Vérifier que Rôle / Pays / Église sont **non modifiables** (grisés) | Champs en lecture seule |
| 2.3 | Modifier le prénom puis **Enregistrer** | Message vert « Profil mis à jour » ; le nom change dans la sidebar et le header |
| 2.4 | Cliquer **Changer la photo**, choisir une image | Aperçu immédiat de la photo (cercle) |
| 2.5 | **Enregistrer** | La photo apparaît dans la sidebar, le header et la fiche du disciple |
| 2.6 | Section mot de passe : ancien `password123`, nouveau `secret123`, confirmation `secret123` → **Modifier** | Message vert « Mot de passe modifié » |
| 2.7 | Se déconnecter, se reconnecter avec `secret123` | Connexion OK |
| 2.8 | Changer le mot de passe avec un **mauvais** ancien mot de passe | Message rouge « Ancien mot de passe incorrect » |
| 2.9 | Mettre une confirmation différente du nouveau mot de passe | Message « La confirmation ne correspond pas » |

> ⚠️ Après ce test, relancer `npm run seed` pour remettre tous les mots de passe à `password123`.

---

## 3. Cloisonnement de la liste des disciples (par rôle)

Pour chaque ligne : se connecter, ouvrir **Disciples**, compter / vérifier.

| # | Compte | Résultat attendu |
|---|--------|------------------|
| 3.1 | Dirigeant Yaoundé `0611000000` | Voit **uniquement** les membres de son église (tous **Cameroun**), aucun disciple d'un autre pays |
| 3.2 | Leader National Cameroun `0600000020` | Voit **tous les disciples du Cameroun**, aucun de France ni du Gabon |
| 3.3 | Leader Régional Afrique Centrale `0600000010` | Voit les disciples **Cameroun + Gabon**, aucun de France |
| 3.4 | Leader Régional Europe `0600000011` | Voit **uniquement** les disciples de **France** |
| 3.5 | Leader Mondial `0600000000` | Voit **tous** les disciples (Cameroun, Gabon, France) |
| 3.6 | Disciple `0611000001` | N'a **pas** le menu « Disciples » ; via Mon Profil il ne voit **que lui-même** |

**Vérification clé** : un dirigeant de Yaoundé ne doit JAMAIS voir un disciple de Paris (et inversement).

---

## 4. Cloisonnement de la liste des églises (par rôle)

Se connecter, ouvrir **Églises**.

| # | Compte | Résultat attendu |
|---|--------|------------------|
| 4.1 | Dirigeant Yaoundé `0611000000` | Voit **uniquement** son église « Source de Vie » |
| 4.2 | Leader National Cameroun `0600000020` | Voit **uniquement les églises du Cameroun** |
| 4.3 | Leader Régional Afrique Centrale `0600000010` | Voit les églises **Cameroun + Gabon** (Source de Vie + Bethel) |
| 4.4 | Leader Régional Europe `0600000011` | Voit **uniquement** « La Grâce » (Paris) |
| 4.5 | Leader Mondial `0600000000` | Voit **les 3 églises** |

---

## 5. Création d'une église (réservée au Leader Mondial)

Se connecter en **Leader Mondial** `0600000000`.

| # | Étapes | Résultat attendu |
|---|--------|------------------|
| 5.1 | Ouvrir **Toutes les Églises** → bouton **+ Nouvelle église** est visible | Le bouton n'apparaît QUE pour le Leader Mondial |
| 5.2 | Choisir un **Pays** dans la liste (ex. Cameroun) | La liste des **villes** se remplit et la **sous-région** s'affiche automatiquement (« Afrique Centrale ») |
| 5.3 | Mode dirigeant = **Créer un nouveau dirigeant** : remplir nom/prénom/téléphone/mot de passe → **Enregistrer** | Église créée ; le nouveau dirigeant peut se connecter et voit cette église |
| 5.4 | Créer une autre église, mode = **Choisir un disciple existant** : sélectionner un disciple du pays choisi | Église créée ; le disciple devient **Dirigeant** et est rattaché à cette église |
| 5.5 | Changer le pays après avoir choisi une ville | La ville se réinitialise, la sous-région se met à jour |

### 5b. Vérifier les restrictions

| # | Compte | Étapes | Résultat attendu |
|---|--------|--------|------------------|
| 5.6 | Leader National `0600000020` | Aller dans Églises | **Pas** de bouton « + Nouvelle église », pas de boutons Éditer/Supprimer |
| 5.7 | Leader Régional `0600000010` | Idem | Mêmes restrictions (lecture seule) |
| 5.8 | LeaderNat `0600000020` | Tenter l'URL directe `/app/eglises/nouvelle` | Redirigé vers le tableau de bord (accès refusé) |

---

## 6. Règle « un dirigeant = une seule église »

Se connecter en **Leader Mondial**.

| # | Étapes | Résultat attendu |
|---|--------|------------------|
| 6.1 | Créer une église en choisissant comme dirigeant **un disciple qui dirige déjà une église** (ex. le dirigeant de Yaoundé) | Message d'erreur « Ce disciple dirige déjà une église » ; création refusée |

---

## 7. Attribution des titres de leader (unicité + remplacement)

Se connecter en **Leader Mondial** `0600000000`.

| # | Étapes | Résultat attendu |
|---|--------|------------------|
| 7.1 | Ouvrir un disciple **du Cameroun** → **Modifier** : le champ **Rôle** est une liste déroulante | La liste n'est éditable QUE pour le Leader Mondial |
| 7.2 | Choisir le rôle **LeaderNat** → Enregistrer | Une **demande de confirmation** apparaît : « Leader National déjà occupé par Esther Ondoa… » (car le Cameroun a déjà un LeaderNat) |
| 7.3 | **Annuler** la confirmation | Rien ne change |
| 7.4 | Refaire et **Confirmer** | Le disciple devient LeaderNat ; l'**ancien** LeaderNat Cameroun **redevient Disciple** (vérifier sa fiche) |
| 7.5 | Promouvoir un disciple **sans église** (théorique) | Message « Ce disciple doit appartenir à une église avant de devenir leader » |

### 7b. Vérifier les restrictions

| # | Compte | Étapes | Résultat attendu |
|---|--------|--------|------------------|
| 7.6 | Dirigeant `0611000000` | Modifier un de ses membres | Le champ **Rôle** est **grisé** (« Seul le Leader Mondial peut changer le rôle ») ; il peut éditer les autres champs |
| 7.7 | Leader National `0600000020` | Modifier un disciple, tenter de changer le rôle | Refusé côté serveur (le rôle ne change pas) |

---

## 8. Cohérence géographique (héritage église → disciple)

Se connecter en **Dirigeant Yaoundé** `0611000000`.

| # | Étapes | Résultat attendu |
|---|--------|------------------|
| 8.1 | **Mes Disciples → + Nouveau disciple** : créer un membre | Le membre est créé **sans choisir de pays** : il hérite automatiquement du pays (Cameroun) et de la sous-région de l'église |
| 8.2 | Ouvrir la fiche du nouveau disciple | Pays = **Cameroun**, Région = **Afrique Centrale** (identiques à l'église) |

---

## 9. Interface (icônes & avatars)

| # | Étapes | Résultat attendu |
|---|--------|------------------|
| 9.1 | Regarder la **sidebar** | Chaque lien a une **icône** (tableau de bord, routines, église, disciples, réunions, contenus, avancements, profil) |
| 9.2 | Bas de la sidebar | Avatar (photo ou initiales) + nom + rôle, cliquable vers Mon Profil |
| 9.3 | Header en haut | Badge de rôle + nom + avatar |
| 9.4 | Fiche d'un disciple | Avatar affiché à côté du nom |
| 9.5 | Bouton « Déconnexion » | Icône de sortie visible |

---

## 10. Tableau de bord (selon le rôle)

| # | Compte | Résultat attendu |
|---|--------|------------------|
| 10.1 | Disciple `0611000001` | Tableau de bord disciple : routines de la semaine, contenus consultés, prochaines réunions |
| 10.2 | Dirigeant `0611000000` | Tableau de bord église : nombre de membres, réunions, avancements en attente |
| 10.3 | Leader National `0600000020` | Statistiques **limitées au Cameroun** |
| 10.4 | Leader Régional `0600000010` | Statistiques **Cameroun + Gabon** |
| 10.5 | Leader Mondial `0600000000` | Statistiques **mondiales** |

---

## Récapitulatif rapide (cases à cocher)

- [ ] 1. Connexion / déconnexion
- [ ] 2. Profil + photo + changement de mot de passe
- [ ] 3. Cloisonnement disciples (dirigeant / nat / reg / mon)
- [ ] 4. Cloisonnement églises
- [ ] 5. Création d'église par le Leader Mondial (2 modes de dirigeant)
- [ ] 6. Un dirigeant ne dirige qu'une église
- [ ] 7. Unicité + remplacement des leaders
- [ ] 8. Héritage pays/région depuis l'église
- [ ] 9. Icônes et avatars
- [ ] 10. Tableaux de bord par rôle

> 💡 Après les tests qui modifient des données (création d'églises, changements
> de rôle, mots de passe), relancer `npm run seed` pour repartir d'une base propre.
