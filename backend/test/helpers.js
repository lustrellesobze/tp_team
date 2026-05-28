const request = require("supertest");

async function login(app, username, password) {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ username, password })
    .expect(200);
  return { token: res.body.token, user: res.body.user };
}

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

module.exports = { login, auth };
