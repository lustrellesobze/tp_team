import type { Dashboard, Student } from "../api";
import { card, pageSection, statCard } from "../ui/shell";

export function renderPrincipalPortal(page: string, dashboard: Dashboard, students: Student[]) {
  const co = (id: string) => page === id;

  return [
    pageSection(
      "dashboard",
      co("dashboard"),
      `
      <div class="stats">
        ${statCard("ti-users", "si-blue", "Élèves actifs", String(dashboard.totalStudents), "Inscrits")}
        ${statCard("ti-pencil", "si-green", "Notes", String(dashboard.totalGrades), "Saisies")}
        ${statCard("ti-chart-bar", "si-amber", "Moyenne", `${dashboard.classAverage}/20`, "Trimestre T1")}
        ${statCard("ti-door", "si-red", "Classes", String(dashboard.totalClasses ?? 0), `${dashboard.totalRooms ?? 0} salles`)}
      </div>
      ${card("Pilotage établissement", "ti-chart-bar", `<p style="font-size:13px;color:var(--text-muted)">Vue synthèse pour le chef d'établissement — EDUSMART-CM</p>`)}`
    ),
    pageSection(
      "bulletins",
      co("bulletins"),
      card(
        "Bulletins PDF",
        "ti-file-text",
        `<table><thead><tr><th>Élève</th><th>Classe</th><th></th></tr></thead><tbody>
        ${students
          .map(
            (s) =>
              `<tr><td>${s.fullName}<br><small>${s.matricule}</small></td><td>${s.className}</td><td><button type="button" class="btn-link pdf-btn" data-id="${s.id}"><i class="ti ti-download"></i> PDF</button></td></tr>`
          )
          .join("")}
        </tbody></table>`
      )
    )
  ].join("");
}

export const principalNav = [
  { id: "dashboard", icon: "ti-layout-dashboard", label: "Pilotage" },
  { id: "bulletins", icon: "ti-file-text", label: "Bulletins" }
];