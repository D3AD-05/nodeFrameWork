const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDatabase() {
  let connection;
  
  try {
    console.log('🔍 Checking database connection...');
    
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'nodeframe_db'
    });

    console.log('✅ Connected to database successfully');

    // Check if users table exists
    const [tables] = await connection.execute(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'",
      [process.env.DB_NAME || 'nodeframe_db']
    );

    if (tables.length > 0) {
      console.log('✅ Users table exists');
      
      // Check user count
      const [userCount] = await connection.execute('SELECT COUNT(*) as count FROM users');
      console.log(`👥 Total users: ${userCount[0].count}`);
      
      // Show table structure
      const [structure] = await connection.execute('DESCRIBE users');
      console.log('📋 Table structure:');
      structure.forEach(column => {
        console.log(`   ${column.Field}: ${column.Type} ${column.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${column.Key ? `(${column.Key})` : ''}`);
      });
    } else {
      console.log('❌ Users table does not exist. Please run migration first.');
    }

  } catch (error) {
    console.error('❌ Database check failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure MySQL server is running');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 Check your database credentials in .env file');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('💡 Database does not exist. Run migration to create it.');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run database check
checkDatabase();