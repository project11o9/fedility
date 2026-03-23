const app = require("./app");
const config = require("./config/env");
const { initializeDatabase } = require("./config/db");

async function startServer() {
  try {
    await initializeDatabase();

    app.listen(config.PORT, () => {
      console.log("=================================");
      console.log("🚀 Fidelity Backend Started");
      console.log(`🌐 Server running on http://localhost:${config.PORT}`);
      console.log("=================================");
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
