const bcrypt = require("bcryptjs");

function clone(rows) {
  return rows.map((r) => ({ ...r }));
}

function createMockPool() {
  const state = {
    users: [
      {
        id: 1,
        username: "admin",
        name: "Administrateur",
        role: "admin",
        password_hash: bcrypt.hashSync("admin123", 10)
      },
      {
        id: 2,
        username: "enseignant",
        name: "Prof Demo",
        role: "teacher",
        password_hash: bcrypt.hashSync("teacher123", 10)
      },
      {
        id: 3,
        username: "chef",
        name: "Chef Etablissement",
        role: "principal",
        password_hash: bcrypt.hashSync("principal123", 10)
      }
    ],
    classes: [{ id: 1, name: "3eme A", level: "College", capacity: 40 }],
    subjects: [
      { id: 1, name: "Maths", code: "MATH" },
      { id: 2, name: "Francais", code: "FR" }
    ],
    students: [
      {
        id: 1,
        matricule: "MAT001",
        full_name: "Jean Dupont",
        gender: "M",
        class_id: 1,
        status: "active"
      }
    ],
    grades: [
      {
        id: 1,
        student_id: 1,
        subject: "Maths",
        value: 15,
        coefficient: 2,
        teacher_id: 2,
        term: "T1"
      }
    ],
    teacher_assignments: [{ id: 1, user_id: 2, subject_id: 1, class_id: 1 }],
    rooms: [{ id: 1, name: "Salle 101", building: "A", capacity: 40 }],
    transfers: [],
    absences: [],
    behavior_notes: [],
    course_progress: [],
    messages: [],
    timetables: [],
    _nextId: 100
  };

  const usernames = new Set(state.users.map((u) => u.username));
  const matricules = new Set(state.students.map((s) => s.matricule));

  function nextId() {
    return state._nextId++;
  }

  function norm(sql) {
    return sql.replace(/\s+/g, " ").trim().toLowerCase();
  }

  function studentWithClass(st) {
    const cls = state.classes.find((c) => c.id === st.class_id);
    return { ...st, class_name: cls ? cls.name : null };
  }

  async function query(sql, params = []) {
    const s = norm(sql);

    if (s === "select 1") return [[{ ok: 1 }], []];

    if (s.includes("count(*) as totalstudents")) {
      const c = state.students.filter((x) => x.status === "active").length;
      return [[{ totalStudents: c }], []];
    }
    if (s.includes("count(*) as totalgrades")) {
      return [[{ totalGrades: state.grades.length }], []];
    }
    if (s.includes("count(*) as totalclasses")) {
      return [[{ totalClasses: state.classes.length }], []];
    }
    if (s.includes("count(*) as totalrooms")) {
      return [[{ totalRooms: state.rooms.length }], []];
    }

    if (s.includes("from users where username")) {
      return [state.users.filter((u) => u.username === params[0]), []];
    }
    if (s.includes("from users where id = ?") && s.includes("username, name, role")) {
      return [
        state.users
          .filter((u) => u.id === params[0])
          .map(({ password_hash: _p, ...u }) => u),
        []
      ];
    }
    if (s.includes("role in ('teacher', 'staff')")) {
      return [
        state.users
          .filter((u) => u.role === "teacher" || u.role === "staff")
          .map(({ password_hash: _p, ...u }) => u),
        []
      ];
    }
    if (s.includes("from users where id != ?")) {
      return [
        state.users
          .filter((u) => u.id !== params[0])
          .map(({ id, name, role }) => ({ id, name, role })),
        []
      ];
    }

    if (s.includes("from teacher_assignments ta") && s.includes("s.id, s.name")) {
      const rows = state.teacher_assignments
        .filter((ta) => ta.user_id === params[0])
        .map((ta) => {
          const sub = state.subjects.find((x) => x.id === ta.subject_id);
          const cls = state.classes.find((c) => c.id === ta.class_id);
          return {
            id: sub.id,
            name: sub.name,
            code: sub.code,
            class_name: cls ? cls.name : null,
            class_id: ta.class_id
          };
        });
      return [rows, []];
    }
    if (s.includes("from teacher_assignments ta") && s.includes("subject_name")) {
      const rows = state.teacher_assignments
        .filter((ta) => ta.user_id === params[0])
        .map((ta) => {
          const sub = state.subjects.find((x) => x.id === ta.subject_id);
          const cls = state.classes.find((c) => c.id === ta.class_id);
          return {
            subject_id: sub.id,
            subject_name: sub.name,
            class_id: ta.class_id,
            class_name: cls ? cls.name : null
          };
        });
      return [rows, []];
    }
    if (s.includes("from teacher_assignments ta") && s.includes("s.name")) {
      const rows = state.teacher_assignments
        .filter((ta) => ta.user_id === params[0])
        .map((ta) => {
          const sub = state.subjects.find((x) => x.id === ta.subject_id);
          return { name: sub.name };
        });
      return [rows, []];
    }
    if (s.includes("select id from teacher_assignments where user_id")) {
      const [userId, subjectId, classId] = params;
      const existing = state.teacher_assignments.filter(
        (ta) =>
          ta.user_id === userId &&
          ta.subject_id === subjectId &&
          ((ta.class_id == null && classId == null) || ta.class_id === classId)
      );
      return [existing, []];
    }
    if (s.startsWith("insert into teacher_assignments")) {
      const row = {
        id: nextId(),
        user_id: params[0],
        subject_id: params[1],
        class_id: params[2]
      };
      state.teacher_assignments.push(row);
      return [{ insertId: row.id, affectedRows: 1 }, []];
    }
    if (s.startsWith("insert into users")) {
      if (usernames.has(params[0])) {
        const err = new Error("Duplicate username");
        err.code = "ER_DUP_ENTRY";
        throw err;
      }
      usernames.add(params[0]);
      const row = {
        id: nextId(),
        username: params[0],
        name: params[1],
        role: params[2],
        password_hash: params[3]
      };
      state.users.push(row);
      return [{ insertId: row.id, affectedRows: 1 }, []];
    }

    if (s.includes("from subjects order by name")) {
      return [clone(state.subjects).sort((a, b) => a.name.localeCompare(b.name)), []];
    }
    if (s.startsWith("insert into subjects")) {
      const row = { id: nextId(), name: params[0], code: params[1] };
      state.subjects.push(row);
      return [{ insertId: row.id }, []];
    }
    if (s.includes("select name from subjects where id")) {
      const sub = state.subjects.find((x) => x.id === params[0]);
      return [sub ? [{ name: sub.name }] : [], []];
    }

    if (s.includes("from classes order by name")) {
      return [clone(state.classes).sort((a, b) => a.name.localeCompare(b.name)), []];
    }
    if (s.startsWith("insert into classes")) {
      const row = {
        id: nextId(),
        name: params[0],
        level: params[1],
        capacity: params[2]
      };
      state.classes.push(row);
      return [{ insertId: row.id }, []];
    }

    if (s.includes("from rooms order by name")) {
      return [clone(state.rooms).sort((a, b) => a.name.localeCompare(b.name)), []];
    }
    if (s.startsWith("insert into rooms")) {
      const row = {
        id: nextId(),
        name: params[0],
        building: params[1],
        capacity: params[2]
      };
      state.rooms.push(row);
      return [{ insertId: row.id }, []];
    }

    if (s.includes("from students s") && s.includes("where s.status")) {
      return [
        state.students
          .filter((st) => st.status === params[0])
          .map(studentWithClass)
          .sort((a, b) => a.full_name.localeCompare(b.full_name)),
        []
      ];
    }
    if (s.includes("from students s") && s.includes("where s.id = ?")) {
      const st = state.students.find((x) => x.id === params[0]);
      return [st ? [studentWithClass(st)] : [], []];
    }
    if (s.includes("select id from students where id") && s.includes("status = 'active'")) {
      const st = state.students.find((x) => x.id === params[0] && x.status === "active");
      return [st ? [{ id: st.id }] : [], []];
    }
    if (s.includes("select * from students where id") && s.includes("status = 'active'")) {
      const st = state.students.find((x) => x.id === params[0] && x.status === "active");
      return [st ? [st] : [], []];
    }
    if (s.includes("select id from students where status")) {
      return [
        state.students.filter((x) => x.status === "active").map((x) => ({ id: x.id })),
        []
      ];
    }
    if (s.startsWith("insert into students")) {
      if (matricules.has(params[0])) {
        const err = new Error("Duplicate matricule");
        err.code = "ER_DUP_ENTRY";
        throw err;
      }
      if (!state.classes.find((c) => c.id === params[3])) {
        const err = new Error("Invalid class");
        err.code = "ER_NO_REFERENCED_ROW_2";
        throw err;
      }
      matricules.add(params[0]);
      const row = {
        id: nextId(),
        matricule: params[0],
        full_name: params[1],
        gender: params[2],
        class_id: params[3],
        status: "active"
      };
      state.students.push(row);
      return [{ insertId: row.id }, []];
    }
    if (s.includes("update students set class_id")) {
      const st = state.students.find((x) => x.id === params[1]);
      if (st) st.class_id = params[0];
      return [{ affectedRows: st ? 1 : 0 }, []];
    }
    if (s.includes("update students set status = 'radiated'")) {
      const st = state.students.find((x) => x.id === params[0] && x.status === "active");
      if (st) st.status = "radiated";
      return [{ affectedRows: st ? 1 : 0 }, []];
    }

    if (s.startsWith("insert into transfers")) {
      const row = {
        id: nextId(),
        student_id: params[0],
        from_class_id: params[1],
        to_class_id: params[2],
        reason: params[3],
        transferred_by: params[4],
        created_at: new Date().toISOString()
      };
      state.transfers.push(row);
      return [{ insertId: row.id }, []];
    }
    if (s.includes("from transfers t")) {
      return [
        state.transfers.map((t) => {
          const st = state.students.find((x) => x.id === t.student_id);
          const fc = state.classes.find((c) => c.id === t.from_class_id);
          const tc = state.classes.find((c) => c.id === t.to_class_id);
          return {
            id: t.id,
            created_at: t.created_at,
            reason: t.reason,
            student_name: st ? st.full_name : null,
            matricule: st ? st.matricule : null,
            from_class: fc ? fc.name : null,
            to_class: tc ? tc.name : null
          };
        }),
        []
      ];
    }

    if (s.includes("from grades g") && s.includes("g.student_id = ?")) {
      return [
        state.grades
          .filter((g) => g.student_id === params[0] && g.term === params[1])
          .map((g) => {
            const teacher = state.users.find((u) => u.id === g.teacher_id);
            return { ...g, teacher_name: teacher ? teacher.name : null };
          }),
        []
      ];
    }
    if (s.includes("select value, coefficient from grades")) {
      return [
        state.grades.filter((g) => g.student_id === params[0] && g.term === params[1]),
        []
      ];
    }
    if (s.startsWith("select * from grades")) {
      let rows = [...state.grades];
      if (params.length) rows = rows.filter((g) => g.student_id === params[0]);
      return [rows.sort((a, b) => b.id - a.id), []];
    }
    if (s.startsWith("insert into grades")) {
      const row = {
        id: nextId(),
        student_id: params[0],
        subject: params[1],
        value: params[2],
        coefficient: params[3],
        teacher_id: params[4],
        term: params[5]
      };
      state.grades.push(row);
      return [{ insertId: row.id }, []];
    }

    if (s.includes("from absences a") && s.includes("join students")) {
      return [
        state.absences.map((a) => {
          const st = state.students.find((x) => x.id === a.student_id);
          const teacher = state.users.find((u) => u.id === a.teacher_id);
          return {
            ...a,
            student_name: st ? st.full_name : null,
            matricule: st ? st.matricule : null,
            teacher_name: teacher ? teacher.name : null
          };
        }),
        []
      ];
    }
    if (s.includes("from absences where student_id")) {
      return [state.absences.filter((a) => a.student_id === params[0]), []];
    }
    if (s.startsWith("insert into absences")) {
      const row = {
        id: nextId(),
        student_id: params[0],
        absence_date: params[1],
        motif: params[2],
        justified: params[3],
        teacher_id: params[4]
      };
      state.absences.push(row);
      return [{ insertId: row.id }, []];
    }

    if (s.includes("from behavior_notes b") && s.includes("limit 100")) {
      return [
        state.behavior_notes.map((b) => {
          const st = state.students.find((x) => x.id === b.student_id);
          const teacher = state.users.find((u) => u.id === b.teacher_id);
          return {
            ...b,
            student_name: st ? st.full_name : null,
            teacher_name: teacher ? teacher.name : null
          };
        }),
        []
      ];
    }
    if (s.includes("from behavior_notes b") && s.includes("where b.student_id")) {
      return [
        state.behavior_notes
          .filter((b) => b.student_id === params[0])
          .map((b) => {
            const teacher = state.users.find((u) => u.id === b.teacher_id);
            return { ...b, teacher_name: teacher ? teacher.name : null };
          }),
        []
      ];
    }
    if (s.includes("select content, note_date from behavior_notes")) {
      return [
        state.behavior_notes
          .filter((b) => b.student_id === params[0])
          .map((b) => ({ content: b.content, note_date: b.note_date })),
        []
      ];
    }
    if (s.startsWith("insert into behavior_notes")) {
      const row = {
        id: nextId(),
        student_id: params[0],
        teacher_id: params[1],
        content: params[2],
        note_date: params[3]
      };
      state.behavior_notes.push(row);
      return [{ insertId: row.id }, []];
    }

    if (s.includes("from course_progress cp")) {
      let rows = state.course_progress.map((cp) => {
        const cls = state.classes.find((c) => c.id === cp.class_id);
        const sub = state.subjects.find((x) => x.id === cp.subject_id);
        const teacher = state.users.find((u) => u.id === cp.teacher_id);
        return {
          ...cp,
          class_name: cls ? cls.name : null,
          subject_name: sub ? sub.name : null,
          teacher_name: teacher ? teacher.name : null
        };
      });
      if (params.length) rows = rows.filter((r) => r.teacher_id === params[0]);
      return [rows, []];
    }
    if (s.startsWith("insert into course_progress")) {
      const row = {
        id: nextId(),
        class_id: params[0],
        subject_id: params[1],
        teacher_id: params[2],
        title: params[3],
        content: params[4],
        progress_percent: params[5],
        updated_at: new Date().toISOString()
      };
      state.course_progress.push(row);
      return [{ insertId: row.id }, []];
    }

    if (s.includes("from messages m") && s.includes("to_user_id")) {
      return [
        state.messages
          .filter((m) => m.to_user_id === params[0])
          .map((m) => {
            const from = state.users.find((u) => u.id === m.from_user_id);
            return { ...m, from_name: from ? from.name : null };
          }),
        []
      ];
    }
    if (s.startsWith("insert into messages")) {
      const row = {
        id: nextId(),
        from_user_id: params[0],
        to_user_id: params[1],
        subject: params[2],
        body: params[3],
        created_at: new Date().toISOString()
      };
      state.messages.push(row);
      return [{ insertId: row.id }, []];
    }

    if (s.includes("from timetables t")) {
      return [
        state.timetables.map((t) => {
          const cls = state.classes.find((c) => c.id === t.class_id);
          const sub = state.subjects.find((x) => x.id === t.subject_id);
          const teacher = state.users.find((u) => u.id === t.teacher_id);
          const room = state.rooms.find((r) => r.id === t.room_id);
          return {
            ...t,
            class_name: cls ? cls.name : null,
            subject_name: sub ? sub.name : null,
            teacher_name: teacher ? teacher.name : null,
            room_name: room ? room.name : null
          };
        }),
        []
      ];
    }
    if (s.startsWith("insert into timetables")) {
      const row = {
        id: nextId(),
        class_id: params[0],
        subject_id: params[1],
        teacher_id: params[2],
        room_id: params[3],
        day_of_week: params[4],
        start_time: params[5],
        end_time: params[6],
        status: "draft"
      };
      state.timetables.push(row);
      return [{ insertId: row.id }, []];
    }
    if (s.includes("update timetables set status = 'validated'")) {
      const t = state.timetables.find((x) => x.id === params[0]);
      if (t) t.status = "validated";
      return [{ affectedRows: t ? 1 : 0 }, []];
    }

    throw new Error(`SQL non pris en charge dans les tests: ${sql}`);
  }

  return { query };
}

function createMockGetPool() {
  const pool = createMockPool();
  return async () => pool;
}

module.exports = { createMockPool, createMockGetPool };
