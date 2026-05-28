const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const PDFDocument = require("pdfkit");
const { registerExtendedRoutes } = require("./routes-extended");

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-demo-key";

function createApp(getPool) {
const app = express();

app.use(cors());
app.use(express.json());

function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Token manquant" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Token invalide" });
  }
}

function allow(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Acces refuse pour ce role" });
    }
    next();
  };
}

async function computeAverage(db, studentId, term) {
  const [rows] = await db.query(
    "SELECT value, coefficient FROM grades WHERE student_id = ? AND term = ?",
    [studentId, term]
  );
  if (!rows.length) return 0;
  const total = rows.reduce((sum, g) => sum + Number(g.value) * g.coefficient, 0);
  const coeffs = rows.reduce((sum, g) => sum + g.coefficient, 0);
  return Number((total / coeffs).toFixed(2));
}

function mapStudent(row) {
  return {
    id: row.id,
    matricule: row.matricule,
    fullName: row.full_name,
    gender: row.gender,
    classId: row.class_id,
    className: row.class_name || null,
    status: row.status
  };
}

registerExtendedRoutes(app, { auth, allow, getPool, computeAverage });

app.get("/api/health", async (req, res) => {
  try {
    const db = await getPool();
    await db.query("SELECT 1");
    res.json({ status: "ok", service: "EDUSMART-CM", database: "mysql" });
  } catch {
    res.status(503).json({ status: "error", message: "MySQL indisponible" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const username = String(req.body?.username || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  if (!username || !password) {
    return res.status(400).json({ message: "Username et mot de passe requis" });
  }
  const db = await getPool();
  const [rows] = await db.query("SELECT * FROM users WHERE username = ?", [username]);
  const user = rows[0];
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({
      message: "Identifiants invalides. Comptes: admin/admin123, enseignant/teacher123, chef/principal123"
    });
  }
  let subjects = [];
  if (user.role === "teacher") {
    const [rows] = await db.query(
      `SELECT s.name FROM teacher_assignments ta JOIN subjects s ON s.id = ta.subject_id WHERE ta.user_id = ?`,
      [user.id]
    );
    subjects = rows.map((r) => r.name);
  }
  const payload = { id: user.id, role: user.role, name: user.name, subjects };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "8h" });
  return res.json({ token, user: payload });
});

app.get("/api/dashboard", auth, allow("admin", "principal"), async (req, res) => {
  const db = await getPool();
  const [[{ totalStudents }]] = await db.query(
    "SELECT COUNT(*) AS totalStudents FROM students WHERE status = 'active'"
  );
  const [[{ totalGrades }]] = await db.query("SELECT COUNT(*) AS totalGrades FROM grades");
  const [activeStudents] = await db.query("SELECT id FROM students WHERE status = 'active'");
  let classAverage = 0;
  if (activeStudents.length) {
    const avgs = await Promise.all(activeStudents.map((s) => computeAverage(db, s.id, "T1")));
    classAverage = Number((avgs.reduce((a, b) => a + b, 0) / avgs.length).toFixed(2));
  }
  const [[{ totalClasses }]] = await db.query("SELECT COUNT(*) AS totalClasses FROM classes");
  const [[{ totalRooms }]] = await db.query("SELECT COUNT(*) AS totalRooms FROM rooms");
  res.json({
    totalStudents,
    totalGrades,
    classAverage,
    totalClasses,
    totalRooms,
    role: req.user.role
  });
});

app.get("/api/classes", auth, async (req, res) => {
  const db = await getPool();
  const [rows] = await db.query("SELECT * FROM classes ORDER BY name");
  res.json(rows);
});

app.post("/api/classes", auth, allow("admin"), async (req, res) => {
  try {
    const { name, level, capacity } = req.body;
    if (!name) return res.status(400).json({ message: "Nom de classe requis" });
    const db = await getPool();
    const [result] = await db.query("INSERT INTO classes (name, level, capacity) VALUES (?, ?, ?)", [
      name,
      level || null,
      Number(capacity) || 40
    ]);
    res.status(201).json({ id: result.insertId, name, level, capacity: Number(capacity) || 40 });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "Cette classe existe deja" });
    console.error(err);
    res.status(500).json({ message: "Erreur enregistrement classe" });
  }
});

app.get("/api/rooms", auth, async (req, res) => {
  const db = await getPool();
  const [rows] = await db.query("SELECT * FROM rooms ORDER BY name");
  res.json(rows);
});

app.post("/api/rooms", auth, allow("admin"), async (req, res) => {
  try {
    const { name, building, capacity } = req.body;
    if (!name) return res.status(400).json({ message: "Nom de salle requis" });
    const db = await getPool();
    const [result] = await db.query("INSERT INTO rooms (name, building, capacity) VALUES (?, ?, ?)", [
      name,
      building || null,
      Number(capacity) || 40
    ]);
    res.status(201).json({ id: result.insertId, name, building, capacity: Number(capacity) || 40 });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "Cette salle existe deja" });
    console.error(err);
    res.status(500).json({ message: "Erreur enregistrement salle" });
  }
});

app.get("/api/students", auth, async (req, res) => {
  const db = await getPool();
  const status = req.query.status || "active";
  const [rows] = await db.query(
    `SELECT s.*, c.name AS class_name
     FROM students s
     LEFT JOIN classes c ON c.id = s.class_id
     WHERE s.status = ?
     ORDER BY s.full_name`,
    [status]
  );
  res.json(rows.map(mapStudent));
});

app.post("/api/students", auth, allow("admin"), async (req, res) => {
  try {
    const { matricule, fullName, gender, classId } = req.body;
    if (!matricule || !fullName || !gender || !classId) {
      return res.status(400).json({ message: "Matricule, nom, genre et classe requis" });
    }
    const db = await getPool();
    const [result] = await db.query(
      "INSERT INTO students (matricule, full_name, gender, class_id, status) VALUES (?, ?, ?, ?, 'active')",
      [matricule, fullName, gender, Number(classId)]
    );
    const [rows] = await db.query(
      `SELECT s.*, c.name AS class_name FROM students s LEFT JOIN classes c ON c.id = s.class_id WHERE s.id = ?`,
      [result.insertId]
    );
    res.status(201).json(mapStudent(rows[0]));
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "Ce matricule existe deja" });
    if (err.code === "ER_NO_REFERENCED_ROW_2") return res.status(400).json({ message: "Classe invalide" });
    console.error(err);
    res.status(500).json({ message: "Erreur enregistrement eleve" });
  }
});

app.post("/api/students/:id/transfer", auth, allow("admin"), async (req, res) => {
  const studentId = Number(req.params.id);
  const { toClassId, reason } = req.body;
  if (!toClassId) return res.status(400).json({ message: "Classe destination requise" });
  const db = await getPool();
  const [students] = await db.query("SELECT * FROM students WHERE id = ? AND status = 'active'", [studentId]);
  if (!students.length) return res.status(404).json({ message: "Eleve introuvable" });
  const student = students[0];
  await db.query(
    "INSERT INTO transfers (student_id, from_class_id, to_class_id, reason, transferred_by) VALUES (?, ?, ?, ?, ?)",
    [studentId, student.class_id, toClassId, reason || null, req.user.id]
  );
  await db.query("UPDATE students SET class_id = ? WHERE id = ?", [toClassId, studentId]);
  const [updated] = await db.query(
    `SELECT s.*, c.name AS class_name FROM students s LEFT JOIN classes c ON c.id = s.class_id WHERE s.id = ?`,
    [studentId]
  );
  res.json({ message: "Transfert effectue", student: mapStudent(updated[0]) });
});

app.post("/api/students/:id/radiate", auth, allow("admin"), async (req, res) => {
  const studentId = Number(req.params.id);
  const { reason } = req.body;
  const db = await getPool();
  const [result] = await db.query(
    "UPDATE students SET status = 'radiated' WHERE id = ? AND status = 'active'",
    [studentId]
  );
  if (!result.affectedRows) return res.status(404).json({ message: "Eleve introuvable ou deja radie" });
  res.json({ message: "Radiation enregistree", reason: reason || null });
});

app.get("/api/transfers", auth, allow("admin", "principal"), async (req, res) => {
  const db = await getPool();
  const [rows] = await db.query(
    `SELECT t.id, t.created_at, t.reason,
            s.full_name AS student_name, s.matricule,
            fc.name AS from_class, tc.name AS to_class
     FROM transfers t
     JOIN students s ON s.id = t.student_id
     LEFT JOIN classes fc ON fc.id = t.from_class_id
     LEFT JOIN classes tc ON tc.id = t.to_class_id
     ORDER BY t.created_at DESC
     LIMIT 50`
  );
  res.json(rows);
});

app.get("/api/grades", auth, async (req, res) => {
  const db = await getPool();
  const { studentId } = req.query;
  let sql = "SELECT * FROM grades";
  const params = [];
  if (studentId) {
    sql += " WHERE student_id = ?";
    params.push(Number(studentId));
  }
  sql += " ORDER BY id DESC";
  const [rows] = await db.query(sql, params);
  res.json(
    rows.map((g) => ({
      id: g.id,
      studentId: g.student_id,
      subject: g.subject,
      value: Number(g.value),
      coefficient: g.coefficient,
      teacherId: g.teacher_id,
      term: g.term
    }))
  );
});

app.post("/api/grades", auth, allow("teacher", "admin"), async (req, res) => {
  const { studentId, subject, value, coefficient, term } = req.body;
  if (!studentId || !subject || value === undefined || !coefficient || !term) {
    return res.status(400).json({ message: "Champs note incomplets" });
  }
  const db = await getPool();
  if (req.user.role === "teacher") {
    const [rows] = await db.query(
      `SELECT s.name FROM teacher_assignments ta JOIN subjects s ON s.id = ta.subject_id WHERE ta.user_id = ?`,
      [req.user.id]
    );
    const allowed = rows.map((r) => r.name);
    if (!allowed.length) {
      return res.status(403).json({ message: "Aucune matiere assignee. Contactez l'administration." });
    }
    if (!allowed.includes(subject)) {
      return res.status(403).json({ message: `Vous ne pouvez saisir que: ${allowed.join(", ")}` });
    }
  }
  const [students] = await db.query("SELECT id FROM students WHERE id = ? AND status = 'active'", [
    Number(studentId)
  ]);
  if (!students.length) return res.status(404).json({ message: "Eleve introuvable" });
  const [result] = await db.query(
    "INSERT INTO grades (student_id, subject, value, coefficient, teacher_id, term) VALUES (?, ?, ?, ?, ?, ?)",
    [Number(studentId), subject, Number(value), Number(coefficient), req.user.id, term]
  );
  res.status(201).json({
    id: result.insertId,
    studentId: Number(studentId),
    subject,
    value: Number(value),
    coefficient: Number(coefficient),
    teacherId: req.user.id,
    term
  });
});

app.get("/api/bulletins/:studentId/pdf", auth, allow("admin", "teacher", "principal"), async (req, res) => {
  const studentId = Number(req.params.studentId);
  const term = req.query.term || "T1";
  const db = await getPool();
  const [rows] = await db.query(
    `SELECT s.*, c.name AS class_name FROM students s
     LEFT JOIN classes c ON c.id = s.class_id WHERE s.id = ?`,
    [studentId]
  );
  if (!rows.length) return res.status(404).json({ message: "Eleve introuvable" });
  const student = rows[0];
  const [studentGrades] = await db.query(
    `SELECT g.*, u.name AS teacher_name FROM grades g
     LEFT JOIN users u ON u.id = g.teacher_id
     WHERE g.student_id = ? AND g.term = ? ORDER BY g.subject`,
    [studentId, term]
  );
  const [absences] = await db.query("SELECT * FROM absences WHERE student_id = ?", [studentId]);
  const [behaviors] = await db.query("SELECT content, note_date FROM behavior_notes WHERE student_id = ?", [
    studentId
  ]);
  const average = await computeAverage(db, studentId, term);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename=bulletin-${student.matricule}.pdf`);

  const doc = new PDFDocument({ margin: 40 });
  doc.pipe(res);
  doc.fontSize(18).text("EDUSMART-CM - Bulletin scolaire", { align: "center" });
  doc.moveDown();
  doc.fontSize(12).text(`Eleve: ${student.full_name}`);
  doc.text(`Matricule: ${student.matricule}`);
  doc.text(`Classe: ${student.class_name || "-"}`);
  doc.text(`Trimestre: ${term}`);
  doc.moveDown();
  doc.fontSize(14).text("Notes — toutes matieres");
  doc.moveDown(0.5);
  studentGrades.forEach((g) => {
    doc.fontSize(11).text(
      `${g.subject} | ${g.value}/20 | coeff ${g.coefficient} | prof: ${g.teacher_name || "-"}`
    );
  });
  doc.moveDown();
  doc.fontSize(13).text(`Moyenne generale: ${average}/20`);
  if (absences.length) {
    doc.moveDown();
    doc.fontSize(14).text(`Absences: ${absences.length}`);
    absences.slice(0, 5).forEach((a) => doc.fontSize(10).text(`- ${a.absence_date}: ${a.motif}`));
  }
  if (behaviors.length) {
    doc.moveDown();
    doc.fontSize(14).text("Appreciations comportementales");
    behaviors.slice(0, 3).forEach((b) => doc.fontSize(10).text(`- ${b.note_date}: ${b.content}`));
  }
  doc.end();
});

return app;
}

module.exports = { createApp, JWT_SECRET };
