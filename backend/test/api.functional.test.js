const { describe, it, before } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const { createApp } = require("../createApp");
const { createMockGetPool } = require("./mockDb");
const { login, auth } = require("./helpers");

describe("EDUSMART-CM API — tests fonctionnels", () => {
  let app;
  let adminToken;
  let teacherToken;
  let principalToken;

  before(async () => {
    app = createApp(createMockGetPool());
    const admin = await login(app, "admin", "admin123");
    adminToken = admin.token;
    const teacher = await login(app, "enseignant", "teacher123");
    teacherToken = teacher.token;
    const principal = await login(app, "chef", "principal123");
    principalToken = principal.token;
  });

  describe("Santé et authentification", () => {
    it("GET /api/health retourne ok", async () => {
      const res = await request(app).get("/api/health").expect(200);
      assert.equal(res.body.status, "ok");
      assert.equal(res.body.service, "EDUSMART-CM");
    });

    it("POST /api/auth/login refuse identifiants invalides", async () => {
      await request(app)
        .post("/api/auth/login")
        .send({ username: "admin", password: "wrong" })
        .expect(401);
    });

    it("routes protégées sans token → 401", async () => {
      await request(app).get("/api/classes").expect(401);
    });
  });

  describe("Administration — classes, salles, élèves", () => {
    it("GET /api/classes liste les classes", async () => {
      const res = await request(app).get("/api/classes").set(auth(adminToken)).expect(200);
      assert.ok(Array.isArray(res.body));
      assert.ok(res.body.length >= 1);
    });

    it("POST /api/classes crée une classe", async () => {
      const res = await request(app)
        .post("/api/classes")
        .set(auth(adminToken))
        .send({ name: "4eme B", level: "College", capacity: 35 })
        .expect(201);
      assert.equal(res.body.name, "4eme B");
      assert.ok(res.body.id);
    });

    it("POST /api/rooms crée une salle", async () => {
      const res = await request(app)
        .post("/api/rooms")
        .set(auth(adminToken))
        .send({ name: "Labo Sciences", building: "B", capacity: 30 })
        .expect(201);
      assert.equal(res.body.name, "Labo Sciences");
    });

    it("GET /api/students retourne les élèves actifs", async () => {
      const res = await request(app).get("/api/students").set(auth(adminToken)).expect(200);
      assert.ok(res.body.some((s) => s.matricule === "MAT001"));
    });

    it("POST /api/students inscrit un élève", async () => {
      const res = await request(app)
        .post("/api/students")
        .set(auth(adminToken))
        .send({
          matricule: "MAT002",
          fullName: "Marie Martin",
          gender: "F",
          classId: 1
        })
        .expect(201);
      assert.equal(res.body.fullName, "Marie Martin");
    });

    it("GET /api/dashboard pour le chef d'établissement", async () => {
      const res = await request(app)
        .get("/api/dashboard")
        .set(auth(principalToken))
        .expect(200);
      assert.ok(res.body.totalStudents >= 1);
      assert.equal(res.body.role, "principal");
    });
  });

  describe("Notes et RBAC enseignant", () => {
    it("enseignant peut saisir une note sur sa matière", async () => {
      const res = await request(app)
        .post("/api/grades")
        .set(auth(teacherToken))
        .send({
          studentId: 1,
          subject: "Maths",
          value: 14,
          coefficient: 2,
          term: "T1"
        })
        .expect(201);
      assert.equal(res.body.subject, "Maths");
    });

    it("enseignant ne peut pas saisir une matière non assignée", async () => {
      const res = await request(app)
        .post("/api/grades")
        .set(auth(teacherToken))
        .send({
          studentId: 1,
          subject: "Francais",
          value: 12,
          coefficient: 1,
          term: "T1"
        })
        .expect(403);
      assert.match(res.body.message, /Francais|saisir/i);
    });

    it("staff ne peut pas créer de classe", async () => {
      await request(app)
        .post("/api/classes")
        .set(auth(teacherToken))
        .send({ name: "Interdit", level: "X", capacity: 10 })
        .expect(403);
    });
  });

  describe("Routes étendues — profil, personnel, bulletins", () => {
    it("GET /api/me retourne le profil enseignant avec matières", async () => {
      const res = await request(app).get("/api/me").set(auth(teacherToken)).expect(200);
      assert.equal(res.body.role, "teacher");
      assert.ok(res.body.subjects.includes("Maths"));
    });

    it("POST /api/staff exige une matière pour un enseignant", async () => {
      await request(app)
        .post("/api/staff")
        .set(auth(adminToken))
        .send({
          username: "nouveau.prof",
          name: "Nouveau Prof",
          password: "secret123",
          role: "teacher"
        })
        .expect(400);
    });

    it("POST /api/staff crée un enseignant avec matière", async () => {
      const res = await request(app)
        .post("/api/staff")
        .set(auth(adminToken))
        .send({
          username: "prof.math2",
          name: "Prof Maths 2",
          password: "secret123",
          role: "teacher",
          subjectId: 1,
          classId: 1
        })
        .expect(201);
      assert.ok(res.body.id);
    });

    it("GET /api/subjects liste les matières", async () => {
      const res = await request(app).get("/api/subjects").set(auth(adminToken)).expect(200);
      assert.ok(res.body.some((s) => s.name === "Maths"));
    });

    it("GET /api/bulletins/:id/summary calcule la moyenne", async () => {
      const res = await request(app)
        .get("/api/bulletins/1/summary?term=T1")
        .set(auth(adminToken))
        .expect(200);
      assert.equal(res.body.student.matricule, "MAT001");
      assert.ok(res.body.average > 0);
      assert.ok(res.body.gradesBySubject.length >= 1);
    });

    it("GET /api/bulletins/:id/pdf génère un PDF", async () => {
      const res = await request(app)
        .get("/api/bulletins/1/pdf?term=T1")
        .set(auth(adminToken))
        .expect(200);
      assert.match(res.headers["content-type"], /pdf/);
      assert.ok(res.body.length > 100);
    });
  });

  describe("Absences et emploi du temps", () => {
    it("POST /api/absences enregistre une absence", async () => {
      const res = await request(app)
        .post("/api/absences")
        .set(auth(teacherToken))
        .send({
          studentId: 1,
          absenceDate: "2026-05-20",
          motif: "Maladie",
          justified: true
        })
        .expect(201);
      assert.ok(res.body.id);
    });

    it("GET /api/absences liste les absences", async () => {
      const res = await request(app).get("/api/absences").set(auth(adminToken)).expect(200);
      assert.ok(Array.isArray(res.body));
    });

    it("POST /api/timetables crée un créneau brouillon", async () => {
      const res = await request(app)
        .post("/api/timetables")
        .set(auth(adminToken))
        .send({
          classId: 1,
          subjectId: 1,
          teacherId: 2,
          roomId: 1,
          dayOfWeek: "Lundi",
          startTime: "08:00",
          endTime: "09:00"
        })
        .expect(201);
      assert.ok(res.body.id);

      await request(app)
        .patch(`/api/timetables/${res.body.id}/validate`)
        .set(auth(adminToken))
        .expect(200);
    });
  });
});
