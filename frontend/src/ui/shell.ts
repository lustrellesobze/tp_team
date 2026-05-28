import type { User } from "../api";

export function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

type NavItem = { id: string; icon: string; label: string; badge?: number };

export function renderShell(
  user: User,
  portalSubtitle: string,
  navItems: NavItem[],
  activePage: string,
  mainHtml: string,
  topbarExtra = ""
) {
  const nav = navItems
    .map(
      (n) => `
    <div class="nav-item ${activePage === n.id ? "active" : ""}" data-page="${n.id}" role="button" tabindex="0">
      <i class="ti ${n.icon}" aria-hidden="true"></i>${n.label}
      ${n.badge ? `<span class="nav-badge">${n.badge}</span>` : ""}
    </div>`
    )
    .join("");

  const offline = navigator.onLine
    ? ""
    : `<span class="offline-chip"><i class="ti ti-wifi-off"></i> Hors ligne</span>`;

  return `
    <div class="app-root">
      <div class="layout">
        <aside class="sidebar">
          <div class="sidebar-logo">
            <div class="sidebar-logo-icon"><i class="ti ti-school" style="color:white;font-size:17px"></i></div>
            <div>
              <div class="sidebar-logo-text">EDUSMART-CM</div>
              <div class="sidebar-logo-sub">${portalSubtitle}</div>
            </div>
          </div>
          ${nav}
          <div class="sidebar-footer">
            <div class="nav-item" id="sync-btn" role="button"><i class="ti ti-refresh"></i>Synchroniser</div>
            <div class="nav-item" id="logout-btn" role="button"><i class="ti ti-logout"></i>Déconnexion</div>
          </div>
        </aside>
        <div class="main">
          <div class="topbar">
            <div>
              <div class="topbar-title">${user.name}</div>
              <div class="topbar-sub">${portalSubtitle} • ${user.role}${offline}</div>
            </div>
            <div class="topbar-right">
              ${topbarExtra}
              <div class="avatar">${initials(user.name)}</div>
            </div>
          </div>
          <div id="toast" class="toast hidden"></div>
          ${mainHtml}
        </div>
      </div>
    </div>
  `;
}

export function statCard(icon: string, iconClass: string, label: string, value: string, sub: string) {
  return `
    <div class="stat">
      <div class="stat-icon ${iconClass}"><i class="ti ${icon}"></i></div>
      <div class="stat-label">${label}</div>
      <div class="stat-val">${value}</div>
      <div class="stat-sub">${sub}</div>
    </div>`;
}

export function card(title: string, icon: string, body: string, actions = "") {
  return `
    <div class="card">
      <div class="card-header">
        <div class="card-title"><i class="ti ${icon}"></i>${title}</div>
        ${actions ? `<div class="card-actions">${actions}</div>` : ""}
      </div>
      ${body}
    </div>`;
}

export function pageSection(id: string, active: boolean, content: string) {
  return `<div class="portal-page ${active ? "active" : ""}" data-portal-page="${id}">${content}</div>`;
}
