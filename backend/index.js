require("dotenv").config();
const { getPool, initDatabase } = require("./db");
const { createApp } = require("./createApp");

const PORT = process.env.PORT || 4000;
const app = createApp(getPool);

async function start() {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`EDUSMART-CM API: http://localhost:${PORT}`);
  });
}

if (require.main === module) {
  start().catch((err) => {
    console.error("Demarrage impossible:", err.message);
    process.exit(1);
  });
}

module.exports = { app, createApp, start };