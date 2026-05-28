const bcrypt = require("bcryptjs");

function registerExtendedRoutes(app, { auth, allow, getPool, computeAverage }) {
  async function getTeacherSubjectNames(db, userId) {
    const [rows] = await db.query(
      `SELECT s.name FROM teacher_assignments ta
       JOIN subjects s ON s.id = ta.subject_id
       WHERE ta.user_id = ?`,
      [userId]
    );
    return rows.map((r) => r.name);
  }

  app.get("/api/me", auth, async (req, res) => {
    const db = await getPool();
    const [users] = await db.query("SELECT id, username, name, role FROM users WHERE id = ?", [req.user.id]);
    const user = users[0];
    let subjects = [];
    let assignments = [];
    if (user.role === "teacher") {
      const [rows] = await db.query(
        `SELECT s.id, s.name, s.code, c.name AS class_name, ta.class_id
         FROM teacher_assignments ta
         JOIN subjects s ON s.id = ta.subject_id
         LEFT JOIN classes c ON c.id = ta.class_id
         WHERE ta.user_id = ?`,
        [req.user.id]
      );
      assignments = rows;
      subjects = rows.map((r) => r.name);
    }
    res.json({ ...user, subjects, assignments });
  });

  app.get("/api/subjects", auth, async (req, res) => {
    const db = await getPool();
    const [rows] = await db.query("SELECT * FROM subjects ORDER BY name");
    res.json(rows);
  });

  app.post("/api/subjects", auth, allow("admin"), async (req, res) => {
    const { name, code } = req.body;
    if (!name) return res.status(400).json({ message: "Nom matiere requis" });
    const db = await getPool();
    const [result] = await db.query("INSERT INTO subjects (name, code) VALUES (?, ?)", [name, code || null]);
    res.status(201).json({ id: result.insertId, name, code });
  });

  app.get("/api/staff", auth, allow("admin"), async (req, res) => {
    const db = await getPool();
    const [users] = await db.query(
      "SELECT id, username, name, role FROM users WHERE role IN ('teacher', 'staff') ORDER BY name"
    );
    const result = [];
    for (const u of users) {
      const [assignments] = await db.query(
        `SELECT s.id AS subject_id, s.name AS subject_name, c.id AS class_id, c.name AS class_name
         FROM teacher_assignments ta
         JOIN subjects s ON s.id = ta.subject_id
         LEFT JOIN classes c ON c.id = ta.class_id
         WHERE ta.user_id = ?`,
        [u.id]
      );
      result.push({ ...u, assignments });
    }
    res.json(result);
  });

  app.post("/api/staff", auth, allow("admin"), async (req, res) => {
    try {
      const username = String(req.body?.username || "").trim().toLowerCase();
      const name = String(req.body?.name || "").trim();
      const password = String(req.body?.password || "");
      const role = String(req.body?.role || "");
      const subjectId = req.body?.subjectId ? Number(req.body.subjectId) : null;
      const classId = req.body?.classId ? Number(req.body.classId) : null;

      if (!username || !name || !password || !role) {
        return res.status(400).json({ message: "Identifiant, nom, mot de passe et role requis" });
      }
      if (!["teacher", "staff"].includes(role)) {
        return res.status(400).json({ message: "Role invalide (teacher ou staff)" });
      }
      if (role === "teacher" && !subjectId) {
        return res.status(400).json({ message: "Matiere obligatoire pour un enseignant" });
      }

      const db = await getPool();
      const [r] = await db.query(
        "INSERT INTO users (username, name, role, password_hash) VALUES (?, ?, ?, ?)",
        [username, name, role, bcrypt.hashSync(password, 10)]
      );
      const userId = r.insertId;

      if (role === "teacher" && subjectId) {
        await db.query("INSERT INTO teacher_assignments (user_id, subject_id, class_id) VALUES (?, ?, ?)", [
          userId,
          subjectId,
          classId || null
        ]);
      }

      res.status(201).json({ id: userId, message: "Compte cree avec succes" });
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ message: "Cet identifiant existe deja" });
      }
      console.error("POST /api/staff", err);
      res.status(500).json({ message: "Erreur creation personnel: " + err.message });
    }
  });

  app.post("/api/staff/:id/assign", auth, allow("admin"), async (req, res) => {
    try {
      const userId = Number(req.params.id);
      const subjectId = Number(req.body?.subjectId);
      const classId = req.body?.classId ? Number(req.body.classId) : null;
      if (!subjectId) return res.status(400).json({ message: "Matiere requise" });
      const db = await getPool();
      const [existing] = await db.query(
        "SELECT id FROM teacher_assignments WHERE user_id = ? AND subject_id = ? AND (class_id = ? OR (class_id IS NULL AND ? IS NULL))",
        [userId, subjectId, classId, classId]
      );
      if (existing.length) {
        return res.status(409).json({ message: "Cette matiere est deja assignee a cet enseignant" });
      }
      await db.query("INSERT INTO teacher_assignments (user_id, subject_id, class_id) VALUES (?, ?, ?)", [
        userId,
        subjectId,
        classId
      ]);
      res.json({ message: "Matiere assignee" });
    } catch (err) {
      console.error("POST assign", err);
      res.status(500).json({ message: "Erreur assignation: " + err.message });
    }
  });

  app.get("/api/timetables", auth, async (req, res) => {
    const db = await getPool();
    const [rows] = await db.query(
      `SELECT t.*, c.name AS class_name, s.name AS subject_name, u.name AS teacher_name, r.name AS room_name
       FROM timetables t
       JOIN classes c ON c.id = t.class_id
       JOIN subjects s ON s.id = t.subject_id
       JOIN users u ON u.id = t.teacher_id
       LEFT JOIN rooms r ON r.id = t.room_id
       ORDER BY FIELD(t.day_of_week,'Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'), t.start_time`
    );
    res.json(rows);
  });

  app.post("/api/timetables", auth, allow("admin"), async (req, res) => {
    const { classId, subjectId, teacherId, roomId, dayOfWeek, startTime, endTime } = req.body;
    if (!classId || !subjectId || !teacherId || !dayOfWeek || !startTime || !endTime) {
      return res.status(400).json({ message: "Champs emploi du temps incomplets" });
    }
    const db = await getPool();
    const [result] = await db.query(
      `INSERT INTO timetables (class_id, subject_id, teacher_id, room_id, day_of_week, start_time, end_time, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'draft')`,
      [Number(classId), Number(subjectId), Number(teacherId), roomId ? Number(roomId) : null, dayOfWeek, startTime, endTime]
    );
    res.status(201).json({ id: result.insertId, message: "Emploi du temps cree (brouillon)" });
  });

  app.patch("/api/timetables/:id/validate", auth, allow("admin"), async (req, res) => {
    const db = await getPool();
    await db.query("UPDATE timetables SET status = 'validated' WHERE id = ?", [Number(req.params.id)]);
    res.json({ message: "Emploi du temps valide" });
  });

  app.get("/api/absences", auth, async (req, res) => {
    const db = await getPool();
    const [rows] = await db.query(
      `SELECT a.*, s.full_name AS student_name, s.matricule, u.name AS teacher_name
       FROM absences a
       JOIN students s ON s.id = a.student_id
       LEFT JOIN users u ON u.id = a.teacher_id
       ORDER BY a.absence_date DESC LIMIT 100`
    );
    res.json(rows);
  });

  app.post("/api/absences", auth, allow("teacher", "admin"), async (req, res) => {
    const { studentId, absenceDate, motif, justified } = req.body;
    if (!studentId || !absenceDate || !motif) {
      return res.status(400).json({ message: "Eleve, date et motif requis" });
    }
    const db = await getPool();
    const [result] = await db.query(
      "INSERT INTO absences (student_id, absence_date, motif, justified, teacher_id) VALUES (?, ?, ?, ?, ?)",
      [Number(studentId), absenceDate, motif, justified ? 1 : 0, req.user.id]
    );
    res.status(201).json({ id: result.insertId });
  });

  app.get("/api/behavior-notes", auth, async (req, res) => {
    const db = await getPool();
    const [rows] = await db.query(
      `SELECT b.*, s.full_name AS student_name, u.name AS teacher_name
       FROM behavior_notes b
       JOIN students s ON s.id = b.student_id
       JOIN users u ON u.id = b.teacher_id
       ORDER BY b.note_date DESC LIMIT 100`
    );
    res.json(rows);
  });

  app.post("/api/behavior-notes", auth, allow("teacher", "admin"), async (req, res) => {
    const { studentId, content, noteDate } = req.body;
    if (!studentId || !content || !noteDate) {
      return res.status(400).json({ message: "Eleve, date et appreciation requises" });
    }
    const db = await getPool();
    const [result] = await db.query(
      "INSERT INTO behavior_notes (student_id, teacher_id, content, note_date) VALUES (?, ?, ?, ?)",
      [Number(studentId), req.user.id, content, noteDate]
    );
    res.status(201).json({ id: result.insertId });
  });

  app.get("/api/course-progress", auth, async (req, res) => {
    const db = await getPool();
    let sql = `SELECT cp.*, c.name AS class_name, s.name AS subject_name, u.name AS teacher_name
               FROM course_progress cp
               JOIN classes c ON c.id = cp.class_id
               JOIN subjects s ON s.id = cp.subject_id
               JOIN users u ON u.id = cp.teacher_id`;
    const params = [];
    if (req.user.role === "teacher") {
      sql += " WHERE cp.teacher_id = ?";
      params.push(req.user.id);
    }
    sql += " ORDER BY cp.updated_at DESC";
    const [rows] = await db.query(sql, params);
    res.json(rows);
  });

  app.post("/api/course-progress", auth, allow("teacher", "admin"), async (req, res) => {
    const { classId, subjectId, title, content, progressPercent } = req.body;
    if (!classId || !subjectId || !title) {
      return res.status(400).json({ message: "Classe, matiere et titre requis" });
    }
    const db = await getPool();
    if (req.user.role === "teacher") {
      const allowed = await getTeacherSubjectNames(db, req.user.id);
      const [sub] = await db.query("SELECT name FROM subjects WHERE id = ?", [Number(subjectId)]);
      if (!sub.length || !allowed.includes(sub[0].name)) {
        return res.status(403).json({ message: "Matiere non assignee a votre profil" });
      }
    }
    const [result] = await db.query(
      `INSERT INTO course_progress (class_id, subject_id, teacher_id, title, content, progress_percent)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [Number(classId), Number(subjectId), req.user.id, title, content || "", Number(progressPercent) || 0]
    );
    res.status(201).json({ id: result.insertId });
  });

  app.get("/api/messages/inbox", auth, async (req, res) => {
    const db = await getPool();
    const [rows] = await db.query(
      `SELECT m.*, u.name AS from_name
       FROM messages m
       JOIN users u ON u.id = m.from_user_id
       WHERE m.to_user_id = ?
       ORDER BY m.created_at DESC LIMIT 50`,
      [req.user.id]
    );
    res.json(rows);
  });

  app.get("/api/messages/contacts", auth, async (req, res) => {
    const db = await getPool();
    const [rows] = await db.query(
      "SELECT id, name, role FROM users WHERE id != ? ORDER BY role, name",
      [req.user.id]
    );
    res.json(rows);
  });

  app.post("/api/messages", auth, async (req, res) => {
    const { toUserId, subject, body } = req.body;
    if (!toUserId || !subject || !body) {
      return res.status(400).json({ message: "Destinataire, sujet et message requis" });
    }
    const db = await getPool();
    const [result] = await db.query(
      "INSERT INTO messages (from_user_id, to_user_id, subject, body) VALUES (?, ?, ?, ?)",
      [req.user.id, Number(toUserId), subject, body]
    );
    res.status(201).json({ id: result.insertId });
  });

  app.get("/api/bulletins/:studentId/summary", auth, allow("admin", "principal", "teacher"), async (req, res) => {
    const studentId = Number(req.params.studentId);
    const term = req.query.term || "T1";
    const db = await getPool();
    const [students] = await db.query(
      `SELECT s.*, c.name AS class_name FROM students s
       LEFT JOIN classes c ON c.id = s.class_id WHERE s.id = ?`,
      [studentId]
    );
    if (!students.length) return res.status(404).json({ message: "Eleve introuvable" });
    const student = students[0];
    const [grades] = await db.query(
      `SELECT g.*, u.name AS teacher_name FROM grades g
       LEFT JOIN users u ON u.id = g.teacher_id
       WHERE g.student_id = ? AND g.term = ? ORDER BY g.subject`,
      [studentId, term]
    );
    const [absences] = await db.query("SELECT * FROM absences WHERE student_id = ? ORDER BY absence_date DESC", [
      studentId
    ]);
    const [behaviors] = await db.query(
      `SELECT b.*, u.name AS teacher_name FROM behavior_notes b
       JOIN users u ON u.id = b.teacher_id WHERE b.student_id = ? ORDER BY b.note_date DESC`,
      [studentId]
    );
    const average = await computeAverage(db, studentId, term);
    res.json({
      student: mapStudentSummary(student),
      term,
      average,
      gradesBySubject: grades.map((g) => ({
        subject: g.subject,
        value: Number(g.value),
        coefficient: g.coefficient,
        teacherName: g.teacher_name
      })),
      absences,
      behaviorNotes: behaviors
    });
  });

  return { getTeacherSubjectNames };
}

function mapStudentSummary(row) {
  return {
    id: row.id,
    matricule: row.matricule,
    fullName: row.full_name,
    className: row.class_name
  };
}

module.exports = { registerExtendedRoutes };
