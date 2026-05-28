import type { Dashboard, Room, SchoolClass, StaffMember, Student, Subject, Timetable } from "../api";
import { card, pageSection, statCard } from "../ui/shell";

type AdminData = {
  page: string;
  students: Student[];
  classes: SchoolClass[];
  rooms: Room[];
  subjects: Subject[];
  staff: StaffMember[];
  teachers: StaffMember[];
  timetables: Timetable[];
  transfers: { student_name: string; from_class: string; to_class: string; created_at: string }[];
  dashboard: Dashboard | null;
};

export function renderAdminPortal(d: AdminData) {
  const co = (id: string) => d.page === id;
  const classOpts = d.classes.map((c) => `<option value="${c.id}">${c.name}</option>`).join("");
  const subjOpts = d.subjects.map((s) => `<option value="${s.id}">${s.name}</option>`).join("");
  const teachOpts = d.teachers.map((t) => `<option value="${t.id}">${t.name}</option>`).join("");
  const roomOpts = d.rooms.map((r) => `<option value="${r.id}">${r.name}</option>`).join("");
  const studOpts = d.students.map((s) => `<option value="${s.id}">${s.fullName} (${s.matricule})</option>`).join("");

  const dash = d.dashboard;
  const pages = [
    pageSection(
      "dashboard",
      co("dashboard"),
      `
      <div class="stats">
        ${statCard("ti-users", "si-blue", "Élèves inscrits", String(dash?.totalStudents ?? d.students.length), "Actifs")}
        ${statCard("ti-id-badge", "si-green", "Enseignants", String(d.teachers.length), "Personnel")}
        ${statCard("ti-door", "si-amber", "Classes", String(dash?.totalClasses ?? d.classes.length), "Ouvertes")}
        ${statCard("ti-file-text", "si-red", "Notes saisies", String(dash?.totalGrades ?? 0), `Moy. ${dash?.classAverage ?? 0}/20`)}
      </div>
      <div class="row2">
        ${card(
          "Inscriptions récentes",
          "ti-users",
          `<table><thead><tr><th>Élève</th><th>Classe</th><th>Statut</th></tr></thead><tbody>
          ${d.students
            .slice(0, 6)
            .map(
              (s) =>
                `<tr><td><strong>${s.fullName}</strong><br><small>${s.matricule}</small></td><td>${s.className || "-"}</td><td><span class="badge b-green">Actif</span></td></tr>`
            )
            .join("")}</tbody></table>`,
          `<button type="button" class="btn-outline" data-goto="inscriptions">Voir tout</button>`
        )}
        ${card(
          "Transferts récents",
          "ti-transfer",
          `<ul class="mini-list">${d.transfers
            .slice(0, 5)
            .map((t) => `<li class="mini-item">${t.student_name}: ${t.from_class} → ${t.to_class}</li>`)
            .join("") || "<li class='mini-item'>Aucun transfert</li>"}</ul>`
        )}
      </div>`
    ),
    pageSection(
      "inscriptions",
      co("inscriptions"),
      card(
        "Inscrire un élève",
        "ti-user-plus",
        `<form id="student-form" class="form-grid">
          <div class="form-field"><label>Matricule</label><input required name="matricule" /></div>
          <div class="form-field"><label>Nom complet</label><input required name="fullName" /></div>
          <div class="form-field"><label>Genre</label><select name="gender" required><option value="F">F</option><option value="M">M</option></select></div>
          <div class="form-field"><label>Classe</label><select name="classId" required><option value="">—</option>${classOpts}</select></div>
          <div class="form-field" style="align-self:end"><button type="submit" class="btn-primary"><i class="ti ti-check"></i>Inscrire</button></div>
        </form>
        <table style="margin-top:14px"><thead><tr><th>Matricule</th><th>Nom</th><th>Classe</th></tr></thead><tbody>
        ${d.students.map((s) => `<tr><td>${s.matricule}</td><td>${s.fullName}</td><td>${s.className}</td></tr>`).join("")}
        </tbody></table>`
      )
    ),
    pageSection(
      "transfers",
      co("transfers"),
      `<div class="grid-2">
        ${card(
          "Transfert",
          "ti-transfer",
          `<form id="transfer-form" class="form-grid">
            <div class="form-field"><label>Élève</label><select name="studentId" required>${studOpts}</select></div>
            <div class="form-field"><label>Nouvelle classe</label><select name="toClassId" required>${classOpts}</select></div>
            <div class="form-field"><label>Motif</label><input name="reason" /></div>
            <div class="form-field" style="align-self:end"><button type="submit" class="btn-primary">Transférer</button></div>
          </form>`
        )}
        ${card(
          "Radiation",
          "ti-user-minus",
          `<form id="radiate-form" class="form-grid">
            <div class="form-field"><label>Élève</label><select name="studentId" required>${studOpts}</select></div>
            <div class="form-field"><label>Motif</label><input name="reason" /></div>
            <div class="form-field" style="align-self:end"><button type="submit" class="btn-danger">Radier</button></div>
          </form>`
        )}
      </div>`
    ),
    pageSection(
      "teachers",
      co("teachers"),
      `<div class="grid-2">
        ${card(
          "Créer enseignant / personnel",
          "ti-id-badge",
          `<form id="staff-form" class="form-grid">
            <div class="form-field"><label>Identifiant</label><input required name="username" /></div>
            <div class="form-field"><label>Nom</label><input required name="name" /></div>
            <div class="form-field"><label>Mot de passe</label><input required type="password" name="password" /></div>
            <div class="form-field"><label>Rôle</label><select name="role" id="staff-role" required><option value="teacher">Enseignant</option><option value="staff">Personnel</option></select></div>
            <div class="form-field"><label>Matière</label><select name="subjectId" id="staff-subject"><option value="">—</option>${subjOpts}</select></div>
            <div class="form-field"><label>Classe</label><select name="classId"><option value="">—</option>${classOpts}</select></div>
            <div class="form-field" style="align-self:end"><button type="submit" class="btn-primary">Créer</button></div>
          </form>`
        )}
        ${card(
          "Assigner matière",
          "ti-link",
          `<form id="assign-form" class="form-grid">
            <div class="form-field"><label>Enseignant</label><select name="userId" required>${teachOpts}</select></div>
            <div class="form-field"><label>Matière</label><select name="subjectId" required>${subjOpts}</select></div>
            <div class="form-field"><label>Classe</label><select name="classId">${classOpts}</select></div>
            <div class="form-field" style="align-self:end"><button type="submit" class="btn-outline">Assigner</button></div>
          </form>
          <form id="subject-form" class="form-grid" style="margin-top:12px;border-top:1px solid var(--border);padding-top:12px">
            <div class="form-field"><label>Nouvelle matière</label><input required name="name" placeholder="Nom" /></div>
            <div class="form-field"><label>Code</label><input name="code" /></div>
            <div class="form-field" style="align-self:end"><button type="submit" class="btn-outline">+ Matière</button></div>
          </form>`
        )}
      </div>
      ${card(
        "Liste du personnel",
        "ti-list",
        `<table><thead><tr><th>Nom</th><th>Rôle</th><th>Matières</th></tr></thead><tbody>
        ${d.staff.map((p) => `<tr><td>${p.name}<br><small>${p.username}</small></td><td><span class="badge b-blue">${p.role}</span></td><td>${p.assignments.map((a) => a.subject_name).join(", ") || "—"}</td></tr>`).join("")}
        </tbody></table>`
      )}`
    ),
    pageSection(
      "timetable",
      co("timetable"),
      `${card(
        "Emploi du temps",
        "ti-calendar-event",
        `<form id="timetable-form" class="form-grid">
          <div class="form-field"><label>Classe</label><select name="classId" required>${classOpts}</select></div>
          <div class="form-field"><label>Matière</label><select name="subjectId" required>${subjOpts}</select></div>
          <div class="form-field"><label>Enseignant</label><select name="teacherId" required>${teachOpts}</select></div>
          <div class="form-field"><label>Salle</label><select name="roomId"><option value="">—</option>${roomOpts}</select></div>
          <div class="form-field"><label>Jour</label><select name="dayOfWeek" required><option>Lundi</option><option>Mardi</option><option>Mercredi</option><option>Jeudi</option><option>Vendredi</option></select></div>
          <div class="form-field"><label>Début</label><input type="time" name="startTime" required /></div>
          <div class="form-field"><label>Fin</label><input type="time" name="endTime" required /></div>
          <div class="form-field" style="align-self:end"><button type="submit" class="btn-primary">Créer (brouillon)</button></div>
        </form>
        <table style="margin-top:14px"><thead><tr><th>Jour</th><th>Heure</th><th>Classe</th><th>Matière</th><th>Prof</th><th>Statut</th><th></th></tr></thead><tbody>
        ${d.timetables
          .map(
            (t) => `<tr><td>${t.day_of_week}</td><td>${t.start_time}-${t.end_time}</td><td>${t.class_name}</td><td>${t.subject_name}</td><td>${t.teacher_name}</td><td><span class="badge ${t.status === "validated" ? "b-green" : "b-amber"}">${t.status}</span></td><td>${t.status === "draft" ? `<button type="button" class="btn-link validate-tt" data-id="${t.id}">Valider</button>` : ""}</td></tr>`
          )
          .join("")}
        </tbody></table>`
      )}`
    ),
    pageSection(
      "classes",
      co("classes"),
      `<div class="grid-2">
        ${card("Classes", "ti-door", `<form id="class-form" class="form-grid"><div class="form-field"><label>Nom</label><input required name="name" /></div><div class="form-field" style="align-self:end"><button type="submit" class="btn-primary">Ajouter</button></div></form><ul class="mini-list" style="margin-top:10px">${d.classes.map((c) => `<li class="mini-item">${c.name} — ${c.level || "N/A"} (${c.capacity})</li>`).join("")}</ul>`)}
        ${card("Salles", "ti-building", `<form id="room-form" class="form-grid"><div class="form-field"><label>Nom</label><input required name="name" /></div><div class="form-field" style="align-self:end"><button type="submit" class="btn-primary">Ajouter</button></div></form><ul class="mini-list" style="margin-top:10px">${d.rooms.map((r) => `<li class="mini-item">${r.name} — ${r.building || "-"}</li>`).join("")}</ul>`)}
      </div>`
    ),
    pageSection(
      "bulletins",
      co("bulletins"),
      card(
        "Bulletins — toutes matières",
        "ti-file-text",
        `<p style="font-size:12px;color:var(--text-muted);margin-bottom:10px">Synthèse multi-matières + export PDF</p>
        <div class="form-field" style="max-width:320px;margin-bottom:12px">
          <label>Élève</label>
          <select id="bulletin-student"><option value="">Choisir…</option>${d.students.map((s) => `<option value="${s.id}">${s.fullName}</option>`).join("")}</select>
        </div>
        <div id="bulletin-preview" class="pdf-preview"><p style="font-size:12px;color:var(--text-muted)">Sélectionnez un élève</p></div>
        <button type="button" id="bulletin-pdf-btn" class="btn-primary" style="margin-top:10px" disabled><i class="ti ti-download"></i> Télécharger PDF</button>`
      )
    )
  ];

  return pages.join("");
}

export const adminNav = [
  { id: "dashboard", icon: "ti-layout-dashboard", label: "Accueil" },
  { id: "inscriptions", icon: "ti-users", label: "Inscriptions" },
  { id: "transfers", icon: "ti-transfer", label: "Transferts" },
  { id: "teachers", icon: "ti-id-badge", label: "Enseignants" },
  { id: "timetable", icon: "ti-calendar-event", label: "Emplois du temps" },
  { id: "classes", icon: "ti-door", label: "Classes & Salles" },
  { id: "bulletins", icon: "ti-file-text", label: "Bulletins PDF" }
];
