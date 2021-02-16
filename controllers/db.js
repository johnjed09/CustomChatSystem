/**
 * Require Modules */
const mysql = require("mysql")

// Database Configurations
const db = mysql.createConnection({
	host: process.env.HOST,
	user: process.env.USER,
	password: process.env.PASSWORD,
    database: process.env.DATABASE,
    // Stream multiple queries
	multipleStatements: true
})

module.exports = db