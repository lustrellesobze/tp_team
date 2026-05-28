"""Génère EDUSMART-CM_Milestones_Issues.docx"""
from docx import Document
from docx.shared import Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
import os

OUT = os.path.join(os.path.dirname(__file__), "EDUSMART-CM_Milestones_Issues.docx")

MILESTONES = [
    {
        "title": "M1 — Fondations techniques (Jour 1)",
        "due": "2026-05-29",
        "desc": "Setup projet, MySQL, authentification JWT/RBAC, structure API et login EDUSMART-CM.",
        "issues": [
            ("Setup monorepo frontend + backend", "Membre A", "Initialiser Vite/TS, Express, scripts npm, .gitignore, README.", ["setup", "membre-a"]),
            ("Schéma MySQL + seed EDUSMART", "Membre A", "Tables users, students, classes, migrations 002_extended.sql, npm run init-db.", ["backend", "mysql", "membre-a"]),
            ("API Auth JWT + middleware RBAC", "Membre A", "POST /api/auth/login, rôles admin/teacher/principal/staff, token 8h.", ["backend", "auth", "membre-a"]),
            ("Écran login maquette EDUSMART", "Membre C", "Design bleu/blanc, comptes démo, Tabler Icons.", ["frontend", "membre-c"]),
            ("Contrats API + conventions Git", "Tous", "Documenter endpoints, branches feature, 1 commit = 1 objectif.", ["documentation", "equipe"]),
        ],
    },
    {
        "title": "M2 — Module Administration (Jour 1-2)",
        "due": "2026-05-30",
        "desc": "Inscriptions, classes, salles, personnel, EDT, transferts, bulletins synthèse admin.",
        "issues": [
            ("CRUD inscriptions élèves", "Membre B", "GET/POST /api/students, formulaire admin, liste tableau.", ["admin", "membre-b"]),
            ("Gestion classes et salles", "Membre B", "GET/POST /api/classes et /api/rooms.", ["admin", "membre-b"]),
            ("Gestion enseignants + assignation matière", "Membre A", "POST /api/staff, assign subject, matière obligatoire enseignant.", ["admin", "membre-a"]),
            ("Emplois du temps brouillon/validé", "Membre B", "POST /api/timetables, PATCH validate, tableau EDT.", ["admin", "membre-b"]),
            ("Transferts et radiations", "Membre B", "POST transfer, POST radiate, historique transfers.", ["admin", "membre-b"]),
            ("Bulletin admin toutes matières + PDF", "Membre C", "GET summary + PDF multi-matières, aperçu maquette.", ["admin", "pdf", "membre-c"]),
            ("Refonte UI sidebar/topbar maquette", "Membre C", "Layout EDUSMART-CM identique au fichier HTML fourni.", ["frontend", "membre-c"]),
        ],
    },
    {
        "title": "M3 — Module Enseignant (Jour 2-3)",
        "due": "2026-05-31",
        "desc": "Notes par matière assignée, absences, appréciations, progressions, messagerie.",
        "issues": [
            ("Restriction saisie notes par matière", "Membre B", "Teacher ne peut noter que ses matières assignées (403 sinon).", ["enseignant", "membre-b"]),
            ("Absences avec motifs", "Membre B", "POST /api/absences, formulaire enseignant, liste.", ["enseignant", "membre-b"]),
            ("Appréciations comportementales", "Membre C", "POST /api/behavior-notes.", ["enseignant", "membre-c"]),
            ("Progression de cours", "Membre C", "POST /api/course-progress, % avancement.", ["enseignant", "membre-c"]),
            ("Messagerie interne", "Membre C", "POST /api/messages, inbox, contacts collègues/direction.", ["enseignant", "membre-c"]),
            ("Dashboard chef d'établissement KPIs", "Membre A", "GET /api/dashboard, stats maquette, rôle principal.", ["admin", "membre-a"]),
        ],
    },
    {
        "title": "M4 — Stabilisation & livraison (Jour 3)",
        "due": "2026-06-01",
        "desc": "Offline-first, QA, corrections bugs, démo soutenance, commits équipe.",
        "issues": [
            ("Offline-first file + synchronisation", "Membre C", "localStorage queue, bouton sync, events online.", ["offline", "membre-c"]),
            ("Correction bugs formulaires (events)", "Membre C", "Delegation events, payload staff, toast messages.", ["bugfix", "membre-c"]),
            ("Tests bout-en-bout 3 rôles", "Membre A", "Parcours admin, enseignant, chef < 5 min.", ["qa", "membre-a"]),
            ("Préparation démo soutenance", "Tous", "Scénario demo, comptes, données MySQL.", ["documentation", "equipe"]),
            ("Commits équipe sur dépôt GitHub", "Tous", "3 branches, 4-6 commits/personne, PR vers main.", ["git", "equipe"]),
        ],
    },
    {
        "title": "M5 — Roadmap Phase 2 (optionnel)",
        "due": "2026-06-15",
        "desc": "Module Parent/Élève, notifications SMS/email (hors MVP 3 jours).",
        "issues": [
            ("Module Parent — consultation résultats", "Tous", "Comptes parent, bulletins sécurisés.", ["roadmap", "parent"]),
            ("Notifications SMS et email", "Tous", "Twilio/SendGrid sur événements clés.", ["roadmap", "notifications"]),
            ("Module Parent — suivi absences temps réel", "Tous", "Alertes push/email.", ["roadmap", "parent"]),
        ],
    },
]

doc = Document()
title = doc.add_heading("EDUSMART-CM — Milestones & Issues GitHub", 0)
title.alignment = WD_ALIGN_PARAGRAPH.CENTER
doc.add_paragraph("Projet : Portail scolaire (Module Administration + Enseignant)")
doc.add_paragraph("Équipe : 3 développeurs — Durée : 3 jours")
doc.add_paragraph("")

doc.add_heading("1. Résumé des milestones", level=1)
table = doc.add_table(rows=1, cols=3)
table.style = "Table Grid"
hdr = table.rows[0].cells
hdr[0].text = "Milestone"
hdr[1].text = "Échéance"
hdr[2].text = "Nb issues"
for m in MILESTONES:
    row = table.add_row().cells
    row[0].text = m["title"]
    row[1].text = m["due"]
    row[2].text = str(len(m["issues"]))

doc.add_page_break()
doc.add_heading("2. Détail milestones et issues", level=1)

for m in MILESTONES:
    doc.add_heading(m["title"], level=2)
    p = doc.add_paragraph()
    p.add_run(f"Échéance : {m['due']}\n").bold = True
    p.add_run(m["desc"])
    for i, (title_i, owner, body, labels) in enumerate(m["issues"], 1):
        doc.add_heading(f"Issue : {title_i}", level=3)
        doc.add_paragraph(f"Assignation suggérée : {owner}")
        doc.add_paragraph(f"Labels : {', '.join(labels)}")
        doc.add_paragraph(f"Description :\n{body}")

doc.add_page_break()
doc.add_heading("3. Création automatique sur GitHub", level=1)
doc.add_paragraph(
    "Un script PowerShell est fourni dans ce dossier : Create-GitHubMilestonesIssues.ps1\n"
    "Il utilise GitHub CLI (gh) pour créer les labels, milestones et issues dans votre dépôt."
)
doc.add_heading("Prérequis", level=2)
for line in [
    "1. Dépôt GitHub créé et remote origin configuré (git remote add origin URL)",
    "2. GitHub CLI installé : winget install GitHub.cli",
    "3. Connexion : gh auth login",
    "4. Se placer à la racine du projet (dossier Team)",
]:
    doc.add_paragraph(line, style="List Bullet")

doc.add_heading("Commande unique (PowerShell)", level=2)
cmd = doc.add_paragraph()
cmd.add_run(
    "cd c:\\Users\\USER\\Desktop\\Team\n"
    ".\\docs\\Create-GitHubMilestonesIssues.ps1\n"
).font.name = "Consolas"

doc.add_heading("Alternative si gh n'est pas installé", level=2)
doc.add_paragraph(
    "Installez d'abord GitHub CLI puis relancez le script. "
    "Le script affiche le dépôt détecté et demande confirmation avant création."
)

doc.save(OUT)
print(f"Document créé : {OUT}")
