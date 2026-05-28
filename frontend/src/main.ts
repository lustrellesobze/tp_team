import "./style.css";
import {
  api,
  authHeaders,
  clearSession,
  getToken,
  getUser,
  loaders,
  openBulletinPdf,
  saveSession,
  syncOfflineOps,
  type BulletinSummary,
  type Dashboard
} from "./api";
import { renderShell } from "./ui/shell";
import { adminNav, renderAdminPortal } from "./views/admin";
import { renderLoginPage } from "./views/login";
import { principalNav, renderPrincipalPortal } from "./views/principal";
import { renderTeacherPortal, teacherNav } from "./views/teacher";
import { settled } from "./utils/settled";

let selectedBulletinStudentId: number | null = null;
let globalEventsReady = false;
let adminPage = "dashboard";
let teacherPage = "dashboard";
let principalPage = "dashboard";

function setMessage(text: string, isError = false) {
  const el = document.querySelector<HTMLDivElement>("#toast");
  if (!el) return;
  el.textContent = text;
  el.className = isError ? "toast error" : "toast";
  el.classList.remove("hidden");
  setTimeout(() => el.classList.add("hidden"), 5000);
}

function syncStaffSubjectRequired() {
  const roleEl = document.querySelector<HTMLSelectElement>("#staff-role");
  const subjectEl = document.querySelector<HTMLSelectElement>("#staff-subject");
  if (roleEl && subjectEl) subjectEl.required = roleEl.value === "teacher";
}

async function postJson(path: string, body: unknown, okMsg: string) {
  await api(path, { method: "POST", headers: authHeaders(), body: JSON.stringify(body) });
  setMessage(okMsg);
  await renderPortal();
}

async function renderPortal() {
  const app = document.querySelector<HTMLDivElement>("#app");
  const user = getUser();
  if (!app || !user) return;

  const students = await loaders.students();

  if (user.role === "admin") {
    const results = await Promise.allSettled([
      loaders.classes(),
      loaders.rooms(),
      loaders.subjects(),
      loaders.staff(),
      loaders.timetables(),
      loaders.transfers(),
      loaders.dashboard()
    ]);
    const classes = settled(results[0], []);
    const rooms = settled(results[1], []);
    const subjects = settled(results[2], []);
    const staff = settled(results[3], []);
    const timetables = settled(results[4], []);
    const transfers = settled(results[5], []);
    const dashboard = settled(results[6], null as Dashboard | null);
    const teachers = staff.filter((s) => s.role === "teacher");

    const nav = adminNav.map((n) => ({
      ...n,
      badge: n.id === "inscriptions" ? students.length : n.id === "bulletins" ? students.length : undefined
    }));

    app.innerHTML = renderShell(
      user,
      "Portail Administration",
      nav,
      adminPage,
      renderAdminPortal({
        page: adminPage,
        students,
        classes,
        rooms,
        subjects,
        staff,
        teachers,
        timetables,
        transfers,
        dashboard
      })
    );
    syncStaffSubjectRequired();
  } else if (user.role === "teacher") {
    let assigned = user.subjects || [];
    try {
      const me = await loaders.me();
      assigned = me.subjects || assigned;
    } catch {
      /* fallback */
    }
    const tResults = await Promise.allSettled([
      loaders.subjects(),
      loaders.absences(),
      loaders.behaviorNotes(),
      loaders.courseProgress(),
      loaders.messageInbox(),
      loaders.messageContacts()
    ]);

    app.innerHTML = renderShell(
      user,
      "Portail Enseignant",
      teacherNav.map((n) => ({ ...n, badge: n.id === "messages" ? settled(tResults[4], []).length : undefined })),
      teacherPage,
      renderTeacherPortal({
        page: teacherPage,
        students,
        assigned,
        subjects: settled(tResults[0], []),
        absences: settled(tResults[1], []),
        behaviors: settled(tResults[2], []),
        progress: settled(tResults[3], []),
        inbox: settled(tResults[4], []),
        contacts: settled(tResults[5], [])
      }),
      assigned.length ? `<span class="offline-chip"><i class="ti ti-book"></i> ${assigned.join(", ")}</span>` : ""
    );
  } else if (user.role === "principal") {
    const dashboard = await loaders.dashboard();
    app.innerHTML = renderShell(
      user,
      "Chef d'établissement",
      principalNav,
      principalPage,
      renderPrincipalPortal(principalPage, dashboard, students)
    );
  } else {
    app.innerHTML = `<div class="login-screen"><p class="login-error">Rôle non reconnu</p></div>`;
  }
}

function setupGlobalEvents() {
  if (globalEventsReady) return;
  globalEventsReady = true;
  const app = document.querySelector<HTMLDivElement>("#app");
  if (!app) return;

  app.addEventListener("click", (e) => {
    const nav = (e.target as HTMLElement).closest<HTMLElement>("[data-page]");
    if (nav?.dataset.page) {
      const user = getUser();
      if (user?.role === "admin") adminPage = nav.dataset.page;
      if (user?.role === "teacher") teacherPage = nav.dataset.page;
      if (user?.role === "principal") principalPage = nav.dataset.page;
      renderPortal();
      return;
    }
    const goto = (e.target as HTMLElement).closest<HTMLElement>("[data-goto]");
    if (goto?.dataset.goto) {
      adminPage = goto.dataset.goto;
      renderPortal();
    }
  });

  app.addEventListener("change", (e) => {
    if ((e.target as HTMLElement).id === "staff-role") syncStaffSubjectRequired();
  });

  app.addEventListener("click", async (e) => {
    if ((e.target as HTMLElement).id === "logout-btn" || (e.target as HTMLElement).closest("#logout-btn")) {
      clearSession();
      adminPage = teacherPage = principalPage = "dashboard";
      render();
      return;
    }
    if ((e.target as HTMLElement).id === "sync-btn" || (e.target as HTMLElement).closest("#sync-btn")) {
      try {
        await syncOfflineOps();
        setMessage("Synchronisation terminée");
        await renderPortal();
      } catch (err) {
        setMessage((err as Error).message, true);
      }
      return;
    }
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(".validate-tt");
    if (btn?.dataset.id) {
      try {
        await api(`/timetables/${btn.dataset.id}/validate`, { method: "PATCH", headers: authHeaders() });
        setMessage("Emploi du temps validé");
        await renderPortal();
      } catch (err) {
        setMessage((err as Error).message, true);
      }
      return;
    }
    const pdfBtn = (e.target as HTMLElement).closest<HTMLButtonElement>(".pdf-btn");
    if (pdfBtn?.dataset.id) {
      try {
        await openBulletinPdf(Number(pdfBtn.dataset.id));
      } catch (err) {
        setMessage((err as Error).message, true);
      }
      return;
    }
    if ((e.target as HTMLElement).id === "bulletin-pdf-btn" && selectedBulletinStudentId) {
      try {
        await openBulletinPdf(selectedBulletinStudentId);
      } catch (err) {
        setMessage((err as Error).message, true);
      }
    }
  });

  app.addEventListener("change", async (e) => {
    const sel = e.target as HTMLSelectElement;
    if (sel.id !== "bulletin-student") return;
    const id = Number(sel.value);
    selectedBulletinStudentId = id || null;
    const preview = document.querySelector<HTMLDivElement>("#bulletin-preview");
    const pdfBtn = document.querySelector<HTMLButtonElement>("#bulletin-pdf-btn");
    if (!preview || !id) {
      if (preview) preview.innerHTML = `<p style="font-size:12px;color:var(--text-muted)">Sélectionnez un élève</p>`;
      pdfBtn?.setAttribute("disabled", "true");
      return;
    }
    try {
      const data: BulletinSummary = await loaders.bulletinSummary(id);
      pdfBtn?.removeAttribute("disabled");
      preview.innerHTML = `
        <div class="pdf-header"><div><div style="font-weight:600">BULLETIN TRIMESTRIEL</div><div style="font-size:11px;opacity:.85">${data.student.fullName} — ${data.student.className}</div></div><span class="badge b-blue">Moy. ${data.average}/20</span></div>
        <table class="pdf-table"><thead><tr><th>Matière</th><th>Note</th><th>Coeff.</th><th>Prof</th></tr></thead><tbody>
        ${data.gradesBySubject.map((g) => `<tr><td>${g.subject}</td><td><strong>${g.value}</strong></td><td>${g.coefficient}</td><td>${g.teacherName || "—"}</td></tr>`).join("")}
        </tbody></table>
        <p style="font-size:11px;margin-top:8px;color:var(--text-muted)">Absences: ${data.absences.length} | Appréciations: ${data.behaviorNotes.length}</p>`;
    } catch (err) {
      preview.textContent = (err as Error).message;
    }
  });

  app.addEventListener("submit", async (e) => {
    const form = e.target as HTMLFormElement;
    if (!form?.id || form.id === "login-form") return;
    e.preventDefault();
    const user = getUser();
    if (!user) return;
    const raw = Object.fromEntries(new FormData(form).entries());

    try {
      switch (form.id) {
        case "staff-form": {
          const role = String(raw.role);
          const body: Record<string, unknown> = {
            username: String(raw.username).trim().toLowerCase(),
            name: String(raw.name).trim(),
            password: String(raw.password),
            role
          };
          if (role === "teacher") {
            if (!raw.subjectId) {
              setMessage("Choisissez une matière pour l'enseignant", true);
              return;
            }
            body.subjectId = Number(raw.subjectId);
            if (raw.classId) body.classId = Number(raw.classId);
          }
          await api("/staff", { method: "POST", headers: authHeaders(), body: JSON.stringify(body) });
          setMessage(`Compte ${body.username} créé avec succès`);
          form.reset();
          await renderPortal();
          break;
        }
        case "assign-form":
          await api(`/staff/${raw.userId}/assign`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ subjectId: Number(raw.subjectId), classId: raw.classId ? Number(raw.classId) : null })
          });
          setMessage("Matière assignée");
          await renderPortal();
          break;
        case "subject-form":
          await postJson("/subjects", { name: raw.name, code: raw.code || null }, "Matière ajoutée");
          break;
        case "timetable-form":
          await postJson(
            "/timetables",
            {
              classId: Number(raw.classId),
              subjectId: Number(raw.subjectId),
              teacherId: Number(raw.teacherId),
              roomId: raw.roomId ? Number(raw.roomId) : null,
              dayOfWeek: raw.dayOfWeek,
              startTime: raw.startTime,
              endTime: raw.endTime
            },
            "Emploi du temps créé"
          );
          break;
        case "student-form":
          await postJson(
            "/students",
            { matricule: raw.matricule, fullName: raw.fullName, gender: raw.gender, classId: Number(raw.classId) },
            "Élève inscrit"
          );
          break;
        case "class-form":
          await postJson("/classes", { name: raw.name, level: "Collège", capacity: 40 }, "Classe ajoutée");
          break;
        case "room-form":
          await postJson("/rooms", { name: raw.name, building: "Bloc", capacity: 40 }, "Salle ajoutée");
          break;
        case "transfer-form":
          await api(`/students/${raw.studentId}/transfer`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ toClassId: Number(raw.toClassId), reason: raw.reason || null })
          });
          setMessage("Transfert effectué");
          await renderPortal();
          break;
        case "radiate-form":
          if (!confirm("Confirmer la radiation ?")) return;
          await api(`/students/${raw.studentId}/radiate`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ reason: raw.reason || null })
          });
          setMessage("Radiation enregistrée");
          await renderPortal();
          break;
        case "grade-form":
          await api("/grades", {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({
              studentId: Number(raw.studentId),
              subject: raw.subject,
              value: Number(raw.value),
              coefficient: Number(raw.coefficient),
              term: raw.term
            })
          });
          setMessage("Note enregistrée");
          form.reset();
          break;
        case "absence-form":
          await api("/absences", {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({
              studentId: Number(raw.studentId),
              absenceDate: raw.absenceDate,
              motif: raw.motif,
              justified: raw.justified === "1"
            })
          });
          setMessage("Absence enregistrée");
          await renderPortal();
          break;
        case "behavior-form":
          await api("/behavior-notes", {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ studentId: Number(raw.studentId), noteDate: raw.noteDate, content: raw.content })
          });
          setMessage("Appréciation enregistrée");
          await renderPortal();
          break;
        case "progress-form":
          await api("/course-progress", {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({
              classId: Number(raw.classId),
              subjectId: Number(raw.subjectId),
              title: raw.title,
              content: raw.content,
              progressPercent: Number(raw.progressPercent)
            })
          });
          setMessage("Progression publiée");
          await renderPortal();
          break;
        case "message-form":
          await api("/messages", {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ toUserId: Number(raw.toUserId), subject: raw.subject, body: raw.body })
          });
          setMessage("Message envoyé");
          await renderPortal();
          break;
      }
    } catch (err) {
      setMessage((err as Error).message, true);
    }
  });
}

function bindLogin() {
  const form = document.querySelector<HTMLFormElement>("#login-form");
  const errorZone = document.querySelector<HTMLParagraphElement>("#login-error");
  const demoSelect = document.querySelector<HTMLSelectElement>("#demo-account");
  const usernameInput = document.querySelector<HTMLInputElement>("#username");
  const passwordInput = document.querySelector<HTMLInputElement>("#password");

  if (demoSelect && usernameInput && passwordInput) {
    const applyDemo = () => {
      const [user, pass] = demoSelect.value.split("|");
      usernameInput.value = user;
      passwordInput.value = pass;
    };
    demoSelect.onchange = applyDemo;
    applyDemo();
  }

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const raw = Object.fromEntries(new FormData(form).entries());
    try {
      const res = await api("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: String(raw.username || "").trim(), password: String(raw.password || "") })
      });
      const data = await res.json();
      saveSession(data.token, data.user);
      await renderPortal();
    } catch (err) {
      if (errorZone) errorZone.textContent = (err as Error).message;
    }
  });
}

function render() {
  const app = document.querySelector<HTMLDivElement>("#app");
  if (!app) return;
  if (!getToken() || !getUser()) {
    app.innerHTML = renderLoginPage();
    bindLogin();
    return;
  }
  renderPortal().catch((err) => {
    app.innerHTML = `<div class="login-screen"><p class="login-error">Erreur: ${err.message}</p></div>`;
  });
}

window.addEventListener("online", () => {
  syncOfflineOps().catch(() => {});
  render();
});
window.addEventListener("offline", () => render());

setupGlobalEvents();
render();
