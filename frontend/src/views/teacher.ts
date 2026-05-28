import type { Student, Subject } from "../api";
import { card, pageSection, statCard } from "../ui/shell";

type TeacherData = {
  page: string;
  students: Student[];
  assigned: string[];
  subjects: Subject[];
  absences: { student_name: string; absence_date: string; motif: string }[];
  behaviors: { student_name: string; content: string; note_date: string }[];
  progress: { title: string; class_name: string; subject_name: string; progress_percent: number }[];
  inbox: { from_name: string; subject: string; body: string; created_at: string }[];
  contacts: { id: number; name: string; role: string }[];
};

export function renderTeacherPortal(d: TeacherData) {
  const co = (id: string) => d.page === id;
  const studOpts = d.students.map((s) => `<option value="${s.id}">${s.fullName} — ${s.className}</option>`).join("");
  const subjField =
    d.assigned.length === 1
      ? `<input name="subject" readonly value="${d.assigned[0]}" />`
      : `<select name="subject" required><option value="">Matière</option>${d.assigned.map((s) => `<option value="${s}">${s}</option>`).join("")}</select>`;
  const progSubj = d.subjects.filter((s) => d.assigned.includes(s.name)).map((s) => `<option value="${s.id}">${s.name}</option>`).join("");
  const classIds = [...new Set(d.students.map((s) => s.classId).filter(Boolean))];
  const classOpts = classIds
    .map((id) => {
      const s = d.students.find((x) => x.classId === id);
      return `<option value="${id}">${s?.className}</option>`;
    })
    .join("");

  return [
    pageSection(
      "dashboard",
      co("dashboard"),
      `
      <div class="stats">
        ${statCard("ti-users", "si-blue", "Élèves", String(d.students.length), "Classes assignées")}
        ${statCard("ti-user-x", "si-amber", "Absences", String(d.absences.length), "Enregistrées")}
        ${statCard("ti-pencil", "si-green", "Matières", String(d.assigned.length), d.assigned.join(", ") || "—")}
        ${statCard("ti-messages", "si-red", "Messages", String(d.inbox.length), "Boîte de réception")}
      </div>
      <div class="row2">
        ${card("Dernières absences", "ti-user-x", `<ul class="mini-list">${d.absences.slice(0, 5).map((a) => `<li class="mini-item">${a.student_name} — ${a.absence_date}: ${a.motif}</li>`).join("") || "<li class='mini-item'>Aucune</li>"}</ul>`)}
        ${card("Messages récents", "ti-messages", `<div class="msg-list">${d.inbox.slice(0, 3).map((m) => `<div class="msg-item"><div class="msg-avatar">${m.from_name.slice(0, 2)}</div><div><div class="msg-from">${m.from_name}</div><div class="msg-text">${m.subject}</div></div></div>`).join("") || "<p style='font-size:12px'>Aucun message</p>"}</div>`)}
      </div>`
    ),
    pageSection(
      "notes",
      co("notes"),
      card(
        "Saisie des notes (votre matière uniquement)",
        "ti-pencil",
        `<p style="font-size:11px;color:var(--text-muted);margin-bottom:10px">Matières assignées: <strong>${d.assigned.join(", ") || "aucune"}</strong></p>
        <form id="grade-form" class="form-grid">
          <div class="form-field"><label>Élève</label><select name="studentId" required><option value="">—</option>${studOpts}</select></div>
          <div class="form-field"><label>Matière</label>${subjField}</div>
          <div class="form-field"><label>Note /20</label><input type="number" min="0" max="20" step="0.25" name="value" required /></div>
          <div class="form-field"><label>Coeff.</label><input type="number" name="coefficient" value="2" required /></div>
          <div class="form-field"><label>Trimestre</label><input name="term" value="T1" required /></div>
          <div class="form-field" style="align-self:end"><button type="submit" class="btn-primary"><i class="ti ti-device-floppy"></i>Enregistrer</button></div>
        </form>`
      )
    ),
    pageSection(
      "absences",
      co("absences"),
      card(
        "Absences avec motifs",
        "ti-user-x",
        `<form id="absence-form" class="form-grid">
          <div class="form-field"><label>Élève</label><select name="studentId" required>${studOpts}</select></div>
          <div class="form-field"><label>Date</label><input type="date" name="absenceDate" required /></div>
          <div class="form-field"><label>Motif</label><input name="motif" required placeholder="Maladie, retard…" /></div>
          <div class="form-field"><label><input type="checkbox" name="justified" value="1" /> Justifiée</label></div>
          <div class="form-field" style="align-self:end"><button type="submit" class="btn-primary">Enregistrer</button></div>
        </form>
        <table style="margin-top:12px"><thead><tr><th>Élève</th><th>Date</th><th>Motif</th></tr></thead><tbody>
        ${d.absences.map((a) => `<tr><td>${a.student_name}</td><td>${a.absence_date}</td><td>${a.motif}</td></tr>`).join("")}
        </tbody></table>`
      )
    ),
    pageSection(
      "behavior",
      co("behavior"),
      card(
        "Appréciations comportementales",
        "ti-clipboard-text",
        `<form id="behavior-form" class="form-grid">
          <div class="form-field"><label>Élève</label><select name="studentId" required>${studOpts}</select></div>
          <div class="form-field"><label>Date</label><input type="date" name="noteDate" required /></div>
          <div class="form-field" style="grid-column:1/-1"><label>Appréciation</label><textarea name="content" required></textarea></div>
          <div class="form-field"><button type="submit" class="btn-primary">Enregistrer</button></div>
        </form>
        <ul class="mini-list" style="margin-top:12px">${d.behaviors.map((b) => `<li class="mini-item"><strong>${b.student_name}</strong> (${b.note_date}): ${b.content}</li>`).join("")}</ul>`
      )
    ),
    pageSection(
      "progress",
      co("progress"),
      card(
        "Progression de cours",
        "ti-trending-up",
        `<form id="progress-form" class="form-grid">
          <div class="form-field"><label>Classe</label><select name="classId" required>${classOpts}</select></div>
          <div class="form-field"><label>Matière</label><select name="subjectId" required>${progSubj}</select></div>
          <div class="form-field"><label>Titre chapitre</label><input name="title" required /></div>
          <div class="form-field"><label>Avancement %</label><input type="number" name="progressPercent" min="0" max="100" value="50" /></div>
          <div class="form-field" style="grid-column:1/-1"><label>Contenu</label><textarea name="content"></textarea></div>
          <div class="form-field"><button type="submit" class="btn-primary">Publier</button></div>
        </form>
        <ul class="mini-list" style="margin-top:12px">${d.progress.map((p) => `<li class="mini-item">${p.subject_name} — ${p.title} (${p.progress_percent}%)</li>`).join("")}</ul>`
      )
    ),
    pageSection(
      "messages",
      co("messages"),
      `<div class="row2">
        ${card(
          "Nouveau message",
          "ti-send",
          `<form id="message-form" class="form-grid">
            <div class="form-field"><label>Destinataire</label><select name="toUserId" required><option value="">—</option>${d.contacts.map((c) => `<option value="${c.id}">${c.name} (${c.role})</option>`).join("")}</select></div>
            <div class="form-field"><label>Sujet</label><input name="subject" required /></div>
            <div class="form-field" style="grid-column:1/-1"><label>Message</label><textarea name="body" required></textarea></div>
            <div class="form-field"><button type="submit" class="btn-primary">Envoyer</button></div>
          </form>`
        )}
        ${card(
          "Boîte de réception",
          "ti-inbox",
          `<div class="msg-list">${d.inbox.map((m) => `<div class="msg-item"><div class="msg-avatar">${m.from_name.slice(0, 2)}</div><div style="flex:1"><div class="msg-from">${m.from_name}</div><div class="msg-text">${m.subject}</div><div class="msg-text">${m.body}</div></div></div>`).join("") || "<p style='font-size:12px'>Aucun message</p>"}</div>`
        )}
      </div>`
    )
  ].join("");
}

export const teacherNav = [
  { id: "dashboard", icon: "ti-layout-dashboard", label: "Tableau de bord" },
  { id: "notes", icon: "ti-pencil", label: "Saisie notes" },
  { id: "absences", icon: "ti-user-x", label: "Absences" },
  { id: "behavior", icon: "ti-clipboard-text", label: "Appréciations" },
  { id: "progress", icon: "ti-trending-up", label: "Progressions" },
  { id: "messages", icon: "ti-messages", label: "Messagerie" }
];
