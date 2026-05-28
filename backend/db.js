require("dotenv").config();
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const config = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "edusmart_cm",
  multipleStatements: true
};

let pool;

async function getPool() {
  if (!pool) {
    pool = mysql.createPool({ ...config, waitForConnections: true, connectionLimit: 10 });
  }
  return pool;
}

async function initDatabase() {
  const bootstrap = await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    multipleStatements: true
  });

  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  await bootstrap.query(schema);
  const migration = fs.readFileSync(path.join(__dirname, "migrations", "002_extended.sql"), "utf8");
  await bootstrap.query(migration);
  await bootstrap.end();

  const db = await getPool();

  const [userRows] = await db.query("SELECT COUNT(*) AS c FROM users");
  if (userRows[0].c === 0) {
    const users = [
      ["admin", "Admin Scolarite", "admin", "admin123"],
      ["enseignant", "Mme Enseignante", "teacher", "teacher123"],
      ["chef", "Chef Etablissement", "principal", "principal123"]
    ];
    for (const [username, name, role, password] of users) {
      await db.query("INSERT INTO users (username, name, role, password_hash) VALUES (?, ?, ?, ?)", [
        username,
        name,
        role,
        bcrypt.hashSync(password, 10)
      ]);
    }
  }

  const [classRows] = await db.query("SELECT COUNT(*) AS c FROM classes");
  if (classRows[0].c === 0) {
    await db.query("INSERT INTO classes (name, level, capacity) VALUES (?, ?, ?), (?, ?, ?)", [
      "3eme A",
      "College",
      40,
      "3eme B",
      "College",
      40
    ]);
  }

  const [roomRows] = await db.query("SELECT COUNT(*) AS c FROM rooms");
  if (roomRows[0].c === 0) {
    await db.query("INSERT INTO rooms (name, building, capacity) VALUES (?, ?, ?), (?, ?, ?)", [
      "Salle 101",
      "Bloc A",
      35,
      "Salle 202",
      "Bloc B",
      40
    ]);
  }

  const [studentRows] = await db.query("SELECT COUNT(*) AS c FROM students");
  if (studentRows[0].c === 0) {
    const [classes] = await db.query("SELECT id, name FROM classes ORDER BY id");
    const classA = classes.find((c) => c.name === "3eme A") || classes[0];
    await db.query(
      "INSERT INTO students (matricule, full_name, gender, class_id, status) VALUES (?, ?, ?, ?, 'active'), (?, ?, ?, ?, 'active')",
      ["MAT001", "Amina Diallo", "F", classA.id, "MAT002", "Moussa Traore", "M", classA.id]
    );
    const [students] = await db.query("SELECT id FROM students");
    const [teachers] = await db.query("SELECT id FROM users WHERE role = 'teacher' LIMIT 1");
    const teacherId = teachers[0]?.id || 1;
    if (students.length >= 2) {
      await db.query(
        "INSERT INTO grades (student_id, subject, value, coefficient, teacher_id, term) VALUES (?, 'Maths', 15, 3, ?, 'T1'), (?, 'Francais', 14, 2, ?, 'T1'), (?, 'Maths', 12, 3, ?, 'T1')",
        [students[0].id, teacherId, students[0].id, teacherId, students[1].id, teacherId]
      );
    }
  }

  const [subjectRows] = await db.query("SELECT COUNT(*) AS c FROM subjects");
  if (subjectRows[0].c === 0) {
    await db.query(
      "INSERT INTO subjects (name, code) VALUES ('Maths','MATH'),('Francais','FR'),('Anglais','EN'),('SVT','SVT'),('Histoire-Geo','HG')"
    );
  }

  const [teachers] = await db.query("SELECT id FROM users WHERE username = 'enseignant' LIMIT 1");
  const [mathSubject] = await db.query("SELECT id FROM subjects WHERE name = 'Maths' LIMIT 1");
  const [classes] = await db.query("SELECT id FROM classes LIMIT 1");
  if (teachers.length && mathSubject.length) {
    const [assignCount] = await db.query(
      "SELECT COUNT(*) AS c FROM teacher_assignments WHERE user_id = ?",
      [teachers[0].id]
    );
    if (assignCount[0].c === 0) {
      await db.query("INSERT INTO teacher_assignments (user_id, subject_id, class_id) VALUES (?, ?, ?)", [
        teachers[0].id,
        mathSubject[0].id,
        classes[0]?.id || null
      ]);
    }
  }

  console.log("MySQL EDUSMART-CM pret");
}

module.exports = { getPool, initDatabase, config };