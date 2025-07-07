const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function runMigration() {
  let connection;

  try {
    console.log("🔄 Starting database migration...");

    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "nodeframe_db", // 🧠 ADD THIS if not using USE in .sql
      multipleStatements: true,
    });

    console.log("✅ Connected to MySQL server");

    // Read and execute migration file
    const migrationPath = path.join(
      __dirname,
      "../migrations/create_users_table.sql"
    );
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");

    console.log("🔄 Executing migration...");
    await connection.query(migrationSQL); // ✅ FIXED

    console.log("✅ Migration completed successfully!");
    console.log("📋 Database and tables created");
    console.log("👤 Default admin user created:");
    console.log("   Email: admin@example.com");
    console.log("   Password: admin123");
    console.log(
      "⚠️  Please change the default admin password after first login"
    );
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log("🔌 Database connection closed");
    }
  }
}

// Run migration
runMigration();
