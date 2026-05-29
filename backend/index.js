require("dotenv").config({ path: require('path').join(__dirname, '.env') });
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

require('fs').writeFileSync(__dirname + '/passenger-info.log', 'Started Passenger load at ' + new Date() + '\n');
start().catch((err) => {
  require('fs').writeFileSync(__dirname + '/passenger-error.log', err.message + '\n' + err.stack);
  console.error("Demarrage impossible:", err.message);
  process.exit(1);
});

module.exports = { app, createApp, start };