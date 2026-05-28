# EDUSMART-CM — Module Administration (MVP)

Plateforme scolaire modulaire. Ce depot couvre le **Module Administration** :
inscriptions, classes, salles, notes, transferts, radiations, bulletins PDF, dashboard chef d'etablissement, RBAC, offline-first.

## Stack
- **Frontend**: TypeScript + Vite
- **Backend**: Node.js + Express
- **Base de donnees**: MySQL


## Installation

### 1. MySQL
Creer/utiliser MySQL local (XAMPP, WAMP, MySQL Server). Copier la config :

```bash
cd backend
copy .env.example .env
```

Editer `.env` avec votre mot de passe MySQL :

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=edusmart_cm
```

### 2. Initialiser la base

```bash
cd backend
npm install
npm run init-db
```

### 3. Lancer le backend

```bash
npm run dev
```

API : `http://localhost:4000`

### 4. Lancer le frontend

```bash
cd frontend
npm install
npm run dev
```

## Tests (CI/CD)

Les tests fonctionnels du backend utilisent une base MySQL simulée en mémoire (aucune base requise pour la CI).

```bash
# Tous les tests (racine du projet)
npm test

# Backend seul (21 tests API : auth, RBAC, inscriptions, notes, bulletins…)
cd backend
npm test

# Frontend seul (utilitaires et configuration)
cd frontend
npm test
```

Le workflow GitHub Actions (`.github/workflows/ci.yml`) exécute `npm run test:ci` à chaque push/PR.

## Comptes demo

| Role | Identifiant | Mot de passe |
|------|-------------|--------------|
| Administration | admin | admin123 |
| Enseignant | enseignant | teacher123 |
| Chef d'etablissement | chef | principal123 |

## Ecrans par role

### Administration (`admin`)
- Gestion enseignants & personnel (creation compte + mot de passe)
- Assignation matiere / classe par enseignant
- Emplois du temps (brouillon → validation admin)
- Inscriptions, classes, salles, transferts, radiations
- Bulletin synthese **toutes matieres** + PDF complet

### Enseignant (`enseignant` / `teacher123`)
- Saisie notes **uniquement sur sa matiere assignee**
- Absences avec motifs
- Appreciations comportementales
- Progression de cours
- Messagerie interne (collegues, direction)

### Chef (`chef` / `principal123`)
- Dashboard KPIs, bulletins PDF

## API principales

- `POST /api/auth/login`
- `GET /api/dashboard` (admin, principal)
- `GET|POST /api/classes`, `GET|POST /api/rooms`
- `GET|POST /api/students`
- `POST /api/students/:id/transfer`, `POST /api/students/:id/radiate`
- `GET /api/transfers`
- `GET|POST /api/grades`
- `GET /api/bulletins/:studentId/pdf`
- `GET /api/bulletins/:studentId/summary` (toutes matieres)
- `GET|POST /api/staff`, `POST /api/staff/:id/assign`
- `GET|POST /api/subjects`, `GET|POST /api/timetables`, `PATCH /api/timetables/:id/validate`
- `GET|POST /api/absences`, `GET|POST /api/behavior-notes`
- `GET|POST /api/course-progress`
- `GET /api/messages/inbox`, `POST /api/messages`

## Roadmap (non code)

- Module Enseignant : absences, appreciations, messagerie
- Module Parent/Eleve : consultation, notifications SMS/email