export const API_BASE = "http://localhost:4000/api";
export const pendingOpsKey = "pendingOfflineOps";

export type User = { id: number; role: string; name: string; subjects?: string[] };
export type Student = {
  id: number;
  matricule: string;
  fullName: string;
  className: string | null;
  classId: number | null;
  gender: string;
  status: string;
};
export type SchoolClass = { id: number; name: string; level: string; capacity: number };
export type Room = { id: number; name: string; building: string; capacity: number };
export type Subject = { id: number; name: string; code: string };
export type StaffMember = {
  id: number;
  username: string;
  name: string;
  role: string;
  assignments: { subject_id: number; subject_name: string; class_id: number | null; class_name: string | null }[];
};
export type Timetable = {
  id: number;
  class_name: string;
  subject_name: string;
  teacher_name: string;
  room_name: string | null;
  day_of_week: string;
  start_time: string;
  end_time: string;
  status: string;
};
export type Dashboard = {
  totalStudents: number;
  totalGrades: number;
  classAverage: number;
  totalClasses?: number;
  totalRooms?: number;
  role: string;
};

export type BulletinSummary = {
  student: { id: number; matricule: string; fullName: string; className: string };
  term: string;
  average: number;
  gradesBySubject: { subject: string; value: number; coefficient: number; teacherName: string }[];
  absences: { absence_date: string; motif: string }[];
  behaviorNotes: { content: string; note_date: string; teacher_name: string }[];
};

let token = localStorage.getItem("token") || "";
let currentUser: User | null = JSON.parse(localStorage.getItem("user") || "null");

export function getUser() {
  return currentUser;
}

export function getToken() {
  return token;
}

export function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };
}

export async function api(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message || "Erreur API");
  }
  return res;
}

export function saveSession(newToken: string, user: User) {
  token = newToken;
  currentUser = user;
  localStorage.setItem("token", newToken);
  localStorage.setItem("user", JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  token = "";
  currentUser = null;
}

export function queueOfflineOp(op: unknown) {
  const current = JSON.parse(localStorage.getItem(pendingOpsKey) || "[]");
  current.push(op);
  localStorage.setItem(pendingOpsKey, JSON.stringify(current));
}

export async function syncOfflineOps() {
  if (!navigator.onLine || !token) return;
  const queue = JSON.parse(localStorage.getItem(pendingOpsKey) || "[]");
  if (!queue.length) return;
  for (const op of queue) {
    const data = op as { path: string; body: unknown };
    await api(data.path, { method: "POST", headers: authHeaders(), body: JSON.stringify(data.body) });
  }
  localStorage.removeItem(pendingOpsKey);
}

export async function openBulletinPdf(studentId: number, term = "T1") {
  const res = await fetch(`${API_BASE}/bulletins/${studentId}/pdf?term=${term}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Impossible de generer le bulletin");
  const blob = await res.blob();
  window.open(URL.createObjectURL(blob), "_blank");
}

export const loaders = {
  me: async () => (await api("/me", { headers: authHeaders() })).json() as Promise<User & { assignments?: unknown[] }>,
  dashboard: async () => (await api("/dashboard", { headers: authHeaders() })).json(),
  students: async () => (await api("/students", { headers: authHeaders() })).json() as Promise<Student[]>,
  classes: async () => (await api("/classes", { headers: authHeaders() })).json() as Promise<SchoolClass[]>,
  rooms: async () => (await api("/rooms", { headers: authHeaders() })).json() as Promise<Room[]>,
  subjects: async () => (await api("/subjects", { headers: authHeaders() })).json() as Promise<Subject[]>,
  staff: async () => (await api("/staff", { headers: authHeaders() })).json() as Promise<StaffMember[]>,
  timetables: async () => (await api("/timetables", { headers: authHeaders() })).json() as Promise<Timetable[]>,
  transfers: async () => (await api("/transfers", { headers: authHeaders() })).json(),
  absences: async () => (await api("/absences", { headers: authHeaders() })).json(),
  behaviorNotes: async () => (await api("/behavior-notes", { headers: authHeaders() })).json(),
  courseProgress: async () => (await api("/course-progress", { headers: authHeaders() })).json(),
  messageInbox: async () => (await api("/messages/inbox", { headers: authHeaders() })).json(),
  messageContacts: async () => (await api("/messages/contacts", { headers: authHeaders() })).json(),
  bulletinSummary: async (studentId: number) =>
    (await api(`/bulletins/${studentId}/summary?term=T1`, { headers: authHeaders() })).json() as Promise<BulletinSummary>
};
