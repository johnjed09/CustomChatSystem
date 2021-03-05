/**
 * Require Modules */
const mysql = require("mysql")

// Database Configurations
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    // Stream multiple queries
	multipleStatements: true
})

module.exports = db