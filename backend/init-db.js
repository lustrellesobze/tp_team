const { initDatabase } = require("./db");

initDatabase()
  .then(() => {
    console.log("Base initialisee avec succes");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Echec init base:", err.message);
    process.exit(1);
  });
