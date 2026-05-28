# EDUSMART-CM — Module Administration - Plan 3 jours / 3 personnes

## Vision
- Plateforme EDUSMART-CM (3 modules: Administration, Enseignant, Parent/Eleve)
- Ce MVP: Module Administration + ecrans par role + MySQL + classes/salles/transferts
- Objectif 3 jours: livrer un MVP fonctionnel et presentable.

## Backlog produit (priorise)
- Authentification + RBAC (`admin`, `teacher`, `principal`)
- Gestion des inscriptions eleves
- Saisie et consultation des notes
- Generation automatique des bulletins PDF
- Dashboard chef d'etablissement (indicateurs globaux)
- Offline-first (mise en file locale + synchronisation)
- QA, tests manuels et preparation demo

## Sprints (3 jours)

### Jour 1 - Sprint 1 (Fondations techniques)
- Setup projet frontend/backend
- API auth + middleware RBAC
- Base inscriptions eleves
- Ecran login + structure dashboard
- Definition contrats API + conventions commits

### Jour 2 - Sprint 2 (Fonctionnalites coeur)
- Module notes (creation + listing)
- Bulletin PDF automatique
- Dashboard avec KPIs (eleves, notes, moyenne)
- Flux role-based (droits selon profil)
- Debut offline-first (queue locale)

### Jour 3 - Sprint 3 (Stabilisation + livraison)
- Synchronisation offline vers backend
- Corrections bugs et durcissement UX
- Test bout-en-bout du parcours complet
- Packaging demo + script de lancement
- Revue finale et repartition commits

## Repartition egale (2-3 fonctionnalites chacun)

### Membre A (Toi)
- Feature 1: Auth + RBAC (login, JWT, middleware role)
- Feature 2: Dashboard chef d'etablissement
- Feature 3: Integration finale + QA globale

### Membre B
- Feature 1: Inscriptions eleves (formulaire + API + listing)
- Feature 2: Notes (saisie + consultation)
- Feature 3: Validation donnees et messages d'erreur

### Membre C
- Feature 1: Bulletins PDF automatiques
- Feature 2: Offline-first (queue locale, sync)
- Feature 3: UX finition (etat online/offline, feedback actions)

## Repartition des commits (equilibree)
- Chaque membre: 4 a 6 commits de taille moyenne.
- Regle: 1 commit = 1 objectif clair (ex: "ajout endpoint notes").
- Exemple cadence:
  - Jour 1: 2 commits/personne
  - Jour 2: 2 commits/personne
  - Jour 3: 1-2 commits/personne (fixes + polish)

## Branches a creer
- Chacun cree sa branche avec son propre nommage (libre), ex:
  - `feature-auth-rbac`
  - `feature-notes-inscriptions`
  - `feature-pdf-offline`
- Puis PR vers branche principale du depot.
- Recommandation: ne pas melanger plus d'un gros sujet dans un meme commit.

## Definition of Done (DoD)
- Fonctionnel localement (frontend + backend)
- Respect des roles (droits verifies)
- PDF bulletin genere sans erreur
- Mode offline: action stockee puis synchronisee
- Demo complete faisable en moins de 5 minutes
