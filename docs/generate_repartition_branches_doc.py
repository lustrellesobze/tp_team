"""Genere EDUSMART-CM_Repartition_Branches_Equipe.docx"""
import os
from docx import Document
from docx.shared import Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT

OUT = os.path.join(os.path.dirname(__file__), "EDUSMART-CM_Repartition_Branches_Equipe.docx")

MEMBRES = [
    {
        "nom": "Membre 1",
        "role": "Backend & donnees (Auth, MySQL, Admin API, CI)",
        "branches": [
            ("feature/setup-monorepo-mysql", "Setup projet, package.json, README, .env.example"),
            ("feature/schema-mysql-seed", "schema.sql, migrations, init-db.js, db.js"),
            ("feature/auth-jwt-rbac", "Login JWT, middleware auth/allow, comptes demo"),
            ("feature/api-dashboard-principal", "GET /api/dashboard + portail chef KPIs"),
            ("feature/staff-assignation-matieres", "POST /api/staff, assign, personnel admin"),
            ("feature/subjects-matieres-crud", "GET/POST /api/subjects + formulaire admin"),
            ("feature/timetables-edt", "GET/POST timetables, PATCH validate, UI EDT"),
            ("feature/tests-ci-backend", "Tests fonctionnels Supertest, mockDb, workflow CI"),
        ],
        "fonctionnalites": [
            "Initialisation monorepo frontend (Vite/TS) + backend (Express)",
            "Configuration MySQL : schema, migration 002_extended, seed demo",
            "Authentification : POST /api/auth/login, token 8h, roles admin/teacher/principal",
            "Middleware RBAC : protection routes par role (403 si acces refuse)",
            "Dashboard chef d'etablissement : KPIs eleves, notes, moyenne, classes, salles",
            "Gestion personnel : creation comptes enseignant/staff, mot de passe hash",
            "Assignation matiere/classe par enseignant (teacher_assignments)",
            "CRUD matieres (subjects) cote API et ecran admin",
            "Emplois du temps : creation brouillon, validation admin",
            "Tests API (21 tests) + pipeline GitHub Actions (sans MySQL en CI)",
            "Endpoint GET /api/me (profil + matieres assignees enseignant)",
        ],
        "fichiers": "backend/index.js, createApp.js, db.js, schema.sql, migrations/, routes-extended.js (staff, subjects, timetables, me), test/, .github/workflows/ci.yml, README (partie backend)",
        "commits": "6 a 8 commits (ex: 'feat(auth): login JWT et RBAC', 'feat(db): schema MySQL et seed')",
    },
    {
        "nom": "Membre 2",
        "role": "Backend metier & inscriptions (Classes, Eleves, Notes, Transferts)",
        "branches": [
            ("feature/classes-rooms-api", "GET/POST /api/classes et /api/rooms"),
            ("feature/students-inscriptions", "GET/POST /api/students, formulaire inscription"),
            ("feature/transfers-radiations", "POST transfer, radiate, GET /api/transfers"),
            ("feature/grades-saisie-consultation", "GET/POST /api/grades, listing notes"),
            ("feature/grades-restriction-matiere", "403 enseignant si matiere non assignee"),
            ("feature/admin-inscriptions-ui", "Pages inscriptions, classes, salles admin"),
            ("feature/admin-transferts-ui", "Page transferts/radiations + historique"),
            ("feature/validation-erreurs-api", "Messages 400/409, ER_DUP_ENTRY, classe invalide"),
        ],
        "fonctionnalites": [
            "Gestion des classes : creation, listing, capacite, niveau",
            "Gestion des salles : nom, batiment, capacite",
            "Inscriptions eleves : matricule, nom, genre, classe (CRUD actifs)",
            "Transfert eleve vers une autre classe + historique transfers",
            "Radiation eleve (status radiated) avec motif",
            "Saisie des notes : valeur, coefficient, trimestre, matiere",
            "Consultation notes par eleve (GET /api/grades?studentId=)",
            "Restriction enseignant : saisie uniquement sur matieres assignees",
            "Interface admin : formulaires inscriptions, classes, salles",
            "Interface admin : transferts, radiations, tableau historique",
            "Validation et messages d'erreur utilisateur (toasts)",
        ],
        "fichiers": "createApp.js (classes, rooms, students, grades, transfers), views/admin.ts (inscriptions, classes, salles, transferts), main.ts (handlers formulaires)",
        "commits": "6 a 8 commits (ex: 'feat(students): inscription eleve', 'feat(grades): restriction matiere enseignant')",
    },
    {
        "nom": "Membre 3",
        "role": "Frontend & experience (UI maquette, Enseignant, PDF, Offline)",
        "branches": [
            ("feature/login-branding-edusmart", "Ecran login bleu/blanc, comptes demo"),
            ("feature/shell-sidebar-maquette", "Layout sidebar, topbar, Tabler Icons, style.css"),
            ("feature/admin-portal-complet", "Toutes pages portail administration"),
            ("feature/teacher-portal-modules", "Portail enseignant : notes, absences, etc."),
            ("feature/bulletins-pdf-summary", "PDF + GET summary toutes matieres"),
            ("feature/absences-behavior-progress", "Absences, appreciations, progression cours"),
            ("feature/messagerie-interne", "Inbox, contacts, envoi messages"),
            ("feature/offline-sync-form-fix", "Queue offline, sync, delegation events formulaires"),
            ("feature/tests-frontend-vitest", "Tests settled + config API, vitest.setup"),
        ],
        "fonctionnalites": [
            "Ecran de connexion aligne maquette EDUSMART-CM",
            "Coquille UI : sidebar bleue, navigation par role, cartes stats",
            "Portail admin complet : dashboard, bulletins, personnel, EDT, etc.",
            "Portail enseignant : saisie notes, absences, appreciations, progression",
            "Portail chef : consultation KPIs et bulletins",
            "Generation bulletins PDF (pdfkit) + apercu synthese multi-matieres",
            "Absences avec motifs et justification",
            "Appreciations comportementales (behavior-notes)",
            "Progression de cours (% avancement par classe/matiere)",
            "Messagerie interne : inbox, contacts collegues/direction",
            "Mode offline-first : file locale + synchronisation au retour reseau",
            "Corrections UX : events delegues, formulaire staff, toasts",
            "Tests frontend Vitest (3 tests)",
        ],
        "fichiers": "frontend/src/views/*.ts, ui/shell.ts, style.css, api.ts, main.ts, utils/settled.ts, vitest.config.ts",
        "commits": "6 a 9 commits (ex: 'feat(ui): shell maquette EDUSMART', 'feat(offline): sync queue localStorage')",
    },
]

doc = Document()

title = doc.add_heading("EDUSMART-CM", 0)
title.alignment = WD_ALIGN_PARAGRAPH.CENTER
sub = doc.add_paragraph("Repartition des fonctionnalites et branches Git — Equipe de 3")
sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
sub.runs[0].font.size = Pt(14)
sub.runs[0].font.color.rgb = RGBColor(0x04, 0x2C, 0x53)

doc.add_paragraph("")
p = doc.add_paragraph()
p.add_run("Depot : ").bold = True
p.add_run("https://github.com/lustrellesobze/tp_team")
doc.add_paragraph(
    "Ce document repartit a parts egales toutes les fonctionnalites livrees du MVP "
    "(Module Administration + Module Enseignant + Chef d'etablissement). "
    "Chaque membre cree ses branches, y enregistre des commits coherents, puis ouvre une Pull Request vers main."
)

doc.add_heading("Vue d'ensemble — equilibre", level=1)
table = doc.add_table(rows=4, cols=4)
table.style = "Table Grid"
table.alignment = WD_TABLE_ALIGNMENT.CENTER
headers = ["Membre", "Branches a creer", "Fonctionnalites", "Commits cibles"]
for i, h in enumerate(headers):
    table.rows[0].cells[i].text = h
    table.rows[0].cells[i].paragraphs[0].runs[0].bold = True
for idx, m in enumerate(MEMBRES, 1):
    table.rows[idx].cells[0].text = m["nom"]
    table.rows[idx].cells[1].text = str(len(m["branches"]))
    table.rows[idx].cells[2].text = str(len(m["fonctionnalites"]))
    table.rows[idx].cells[3].text = m["commits"].split("(")[0].strip()

doc.add_paragraph("")

doc.add_heading("Procedure Git (pour toute l'equipe)", level=1)
steps = [
    "Cloner le depot et se placer sur main : git checkout main && git pull",
    "Pour chaque branche attribuee : git checkout -b nom-de-branche",
    "Faire 1 a 2 commits par branche (messages clairs en francais ou anglais)",
    "Pousser : git push -u origin nom-de-branche",
    "Ouvrir une Pull Request sur GitHub vers main (1 PR par branche ou regrouper par membre)",
    "Regle d'or : 1 commit = 1 objectif (ex: feat(auth): login JWT et middleware RBAC)",
]
for s in steps:
    doc.add_paragraph(s, style="List Number")

doc.add_paragraph("")

for m in MEMBRES:
    doc.add_page_break()
    doc.add_heading(f"{m['nom']} — {m['role']}", level=1)

    doc.add_heading("Branches a creer", level=2)
    t = doc.add_table(rows=1 + len(m["branches"]), cols=2)
    t.style = "Table Grid"
    t.rows[0].cells[0].text = "Nom de branche"
    t.rows[0].cells[1].text = "Contenu / commits lies"
    t.rows[0].cells[0].paragraphs[0].runs[0].bold = True
    t.rows[0].cells[1].paragraphs[0].runs[0].bold = True
    for i, (branch, desc) in enumerate(m["branches"], 1):
        t.rows[i].cells[0].text = branch
        t.rows[i].cells[1].text = desc

    doc.add_paragraph("")
    doc.add_heading("Fonctionnalites attribuees", level=2)
    for f in m["fonctionnalites"]:
        doc.add_paragraph(f, style="List Bullet")

    doc.add_paragraph("")
    doc.add_heading("Fichiers principaux concernes", level=2)
    doc.add_paragraph(m["fichiers"])

    doc.add_paragraph("")
    doc.add_heading("Cadence commits", level=2)
    doc.add_paragraph(m["commits"])

    doc.add_paragraph("")
    doc.add_heading("Exemple de commandes", level=2)
    example_branch = m["branches"][0][0]
    code = doc.add_paragraph()
    code.add_run(
        f"git checkout main\n"
        f"git pull\n"
        f"git checkout -b {example_branch}\n"
        f"# ... modifications liees a la fonctionnalite ...\n"
        f'git add .\n'
        f'git commit -m "feat: description courte de la fonctionnalite"\n'
        f"git push -u origin {example_branch}"
    ).font.name = "Consolas"
    code.runs[0].font.size = Pt(9)

doc.add_page_break()
doc.add_heading("Recapitulatif — toutes les branches", level=1)

all_branches = []
for m in MEMBRES:
    doc.add_heading(m["nom"], level=2)
    branch_list = ", ".join(b[0] for b in m["branches"])
    doc.add_paragraph(branch_list)
    all_branches.extend([(m["nom"], b[0]) for b in m["branches"]])

doc.add_paragraph("")
doc.add_heading("Modules couverts par le MVP", level=1)
modules = [
    ("Module Administration", "Inscriptions, classes, salles, personnel, EDT, transferts, radiations, bulletins"),
    ("Module Enseignant", "Notes (matiere assignee), absences, appreciations, progression, messagerie"),
    ("Module Chef d'etablissement", "Dashboard KPIs, consultation bulletins PDF"),
    ("Transversal", "Auth RBAC, UI maquette EDUSMART, offline-first, tests CI/CD"),
]
for mod, desc in modules:
    p = doc.add_paragraph(style="List Bullet")
    p.add_run(f"{mod} : ").bold = True
    p.add_run(desc)

doc.add_paragraph("")
note = doc.add_paragraph()
note.add_run("Note : ").bold = True
note.add_run(
    "Le code complet existe deja dans le depot. Cette repartition sert a organiser "
    "l'historique Git pour la soutenance : chaque membre pousse ses branches avec des commits "
    "qui correspondent a ses fonctionnalites, meme en reorganisant des fichiers deja presents."
)

doc.save(OUT)
print(f"Document cree : {OUT}")
