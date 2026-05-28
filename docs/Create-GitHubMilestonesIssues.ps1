# EDUSMART-CM - Creation automatique des milestones et issues sur GitHub
# Prerequis : gh auth login  |  git remote origin configure
# Encodage : ASCII uniquement (evite les erreurs PowerShell Windows)

$ErrorActionPreference = "Stop"

function Write-Info($msg) { Write-Host "[EDUSMART] $msg" -ForegroundColor Cyan }
function Write-Ok($msg) { Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }

function Find-Gh {
    $cmd = Get-Command gh -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    $candidates = @(
        "${env:ProgramFiles}\GitHub CLI\gh.exe",
        "${env:ProgramFiles(x86)}\GitHub CLI\gh.exe",
        "$env:LOCALAPPDATA\Programs\GitHub CLI\gh.exe"
    )
    foreach ($path in $candidates) {
        if (Test-Path $path) { return $path }
    }
    return $null
}

$ghExe = Find-Gh
if (-not $ghExe) {
    Write-Warn "GitHub CLI (gh) introuvable."
    Write-Host "Installez : winget install GitHub.cli"
    Write-Host "Puis FERMEZ et ROUVREZ PowerShell, ou executez :"
    Write-Host '  $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")'
    Write-Host '  gh auth login'
    exit 1
}

Write-Info "gh trouve : $ghExe"

$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

$remote = git remote get-url origin 2>$null
if (-not $remote) {
    Write-Warn "Aucun remote 'origin'. Configurez : git remote add origin https://github.com/USER/REPO.git"
    exit 1
}

if ($remote -match "github\.com[:/](.+?)/(.+?)(?:\.git)?$") {
    $owner = $Matches[1]
    $repo = $Matches[2] -replace '\.git$', ''
} else {
    Write-Warn "URL origin non reconnue : $remote"
    exit 1
}

Write-Info "Depot cible : $owner/$repo"
$confirm = Read-Host "Creer milestones + issues sur ce depot ? (o/N)"
if ($confirm -notin @("o", "O", "oui", "Oui", "y", "Y")) {
    Write-Host "Annule."
    exit 0
}

$labels = @(
    "setup", "backend", "frontend", "mysql", "auth", "admin", "enseignant",
    "pdf", "offline", "bugfix", "qa", "documentation", "git", "roadmap",
    "membre-a", "membre-b", "membre-c", "equipe", "parent", "notifications"
)
foreach ($lb in $labels) {
    & $ghExe label create $lb --repo "$owner/$repo" --color "1D76DB" --force 2>$null | Out-Null
}
Write-Ok "Labels crees/mis a jour"

$milestonesData = @(
    @{
        title = "M1 - Fondations techniques (Jour 1)"
        due   = "2026-05-29T23:59:59Z"
        desc  = "Setup projet, MySQL, authentification JWT/RBAC, structure API et login EDUSMART-CM."
        issues = @(
            @{ title = "Setup monorepo frontend + backend"; body = "Membre A - Initialiser Vite/TS, Express, scripts npm, README."; labels = "setup,membre-a" }
            @{ title = "Schema MySQL + seed EDUSMART"; body = "Membre A - schema.sql, migrations, npm run init-db."; labels = "backend,mysql,membre-a" }
            @{ title = "API Auth JWT + middleware RBAC"; body = "Membre A - POST /api/auth/login, roles admin/teacher/principal."; labels = "backend,auth,membre-a" }
            @{ title = "Ecran login maquette EDUSMART"; body = "Membre C - Design bleu/blanc, comptes demo."; labels = "frontend,membre-c" }
            @{ title = "Contrats API + conventions Git"; body = "Tous - Documenter endpoints et branches feature."; labels = "documentation,equipe" }
        )
    }
    @{
        title = "M2 - Module Administration (Jour 1-2)"
        due   = "2026-05-30T23:59:59Z"
        desc  = "Inscriptions, classes, salles, personnel, EDT, transferts, bulletins."
        issues = @(
            @{ title = "CRUD inscriptions eleves"; body = "Membre B - API + formulaire admin."; labels = "admin,membre-b" }
            @{ title = "Gestion classes et salles"; body = "Membre B - /api/classes, /api/rooms."; labels = "admin,membre-b" }
            @{ title = "Gestion enseignants + assignation matiere"; body = "Membre A - POST /api/staff, assign."; labels = "admin,membre-a" }
            @{ title = "Emplois du temps brouillon/valide"; body = "Membre B - timetables + validation."; labels = "admin,membre-b" }
            @{ title = "Transferts et radiations"; body = "Membre B - transfer + radiate."; labels = "admin,membre-b" }
            @{ title = "Bulletin admin toutes matieres + PDF"; body = "Membre C - summary + PDF."; labels = "admin,pdf,membre-c" }
            @{ title = "Refonte UI sidebar/topbar maquette"; body = "Membre C - Layout EDUSMART-CM."; labels = "frontend,membre-c" }
        )
    }
    @{
        title = "M3 - Module Enseignant (Jour 2-3)"
        due   = "2026-05-31T23:59:59Z"
        desc  = "Notes par matiere, absences, appreciations, progressions, messagerie."
        issues = @(
            @{ title = "Restriction saisie notes par matiere"; body = "Membre B - 403 si matiere non assignee."; labels = "enseignant,membre-b" }
            @{ title = "Absences avec motifs"; body = "Membre B - POST /api/absences."; labels = "enseignant,membre-b" }
            @{ title = "Appreciations comportementales"; body = "Membre C - behavior-notes."; labels = "enseignant,membre-c" }
            @{ title = "Progression de cours"; body = "Membre C - course-progress."; labels = "enseignant,membre-c" }
            @{ title = "Messagerie interne"; body = "Membre C - messages inbox/contacts."; labels = "enseignant,membre-c" }
            @{ title = "Dashboard chef etablissement KPIs"; body = "Membre A - /api/dashboard."; labels = "admin,membre-a" }
        )
    }
    @{
        title = "M4 - Stabilisation et livraison (Jour 3)"
        due   = "2026-06-01T23:59:59Z"
        desc  = "Offline-first, QA, bugs, demo, commits equipe."
        issues = @(
            @{ title = "Offline-first file + synchronisation"; body = "Membre C - queue localStorage + sync."; labels = "offline,membre-c" }
            @{ title = "Correction bugs formulaires (events)"; body = "Membre C - staff-form, delegation."; labels = "bugfix,membre-c" }
            @{ title = "Tests bout-en-bout 3 roles"; body = "Membre A - parcours complet."; labels = "qa,membre-a" }
            @{ title = "Preparation demo soutenance"; body = "Tous - scenario + comptes demo."; labels = "documentation,equipe" }
            @{ title = "Commits equipe sur depot GitHub"; body = "Tous - branches + PR."; labels = "git,equipe" }
        )
    }
    @{
        title = "M5 - Roadmap Phase 2 (optionnel)"
        due   = "2026-06-15T23:59:59Z"
        desc  = "Module Parent/Eleve, notifications (post-MVP)."
        issues = @(
            @{ title = "Module Parent - consultation resultats"; body = "Roadmap - comptes parent."; labels = "roadmap,parent" }
            @{ title = "Notifications SMS et email"; body = "Roadmap - Twilio/SendGrid."; labels = "roadmap,notifications" }
            @{ title = "Module Parent - suivi absences temps reel"; body = "Roadmap."; labels = "roadmap,parent" }
        )
    }
)

$createdIssues = 0
foreach ($ms in $milestonesData) {
    Write-Info "Milestone : $($ms.title)"
    $mJson = & $ghExe api "repos/$owner/$repo/milestones" -f "title=$($ms.title)" -f "description=$($ms.desc)" -f "due_on=$($ms.due)" 2>$null | ConvertFrom-Json
    if (-not $mJson) {
        Write-Warn "Milestone existant ou erreur : $($ms.title)"
    } else {
        Write-Ok "Milestone #$($mJson.number) cree"
    }

    foreach ($issue in $ms.issues) {
        $labelArgs = ($issue.labels -split ",") | ForEach-Object { "--label"; $_.Trim() }
        & $ghExe issue create --repo "$owner/$repo" --title $issue.title --body $issue.body --milestone $ms.title @labelArgs 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) {
            $createdIssues++
            Write-Host "  + Issue : $($issue.title)"
        } else {
            Write-Warn "  Echec issue : $($issue.title)"
        }
        Start-Sleep -Milliseconds 300
    }
}

Write-Ok "Termine - $createdIssues issues creees sur $owner/$repo"
Write-Host "Verifiez : https://github.com/$owner/$repo/issues"
