/** Database setup for ig_clone */

const { Client } = require('pg');
const { getDatabaseUri } = require('./config');

let db;

/**
 * Sets database connection in Postgres
 *
 * getDatabaseUri --> provides 2 possible database URLs depending on main app or testing 
 * getDatabaseUri() is a function defined in config.js
   depending on specified node environment, the database will connect to the test or production
 * */
if (process.env.NODE_ENV === 'production') {
	db = new Client({
		connectionString: getDatabaseUri(),
		ssl: {
			rejectUnauthorized: false,
		},
	});
} else {
	db = new Client({
		connectionString: getDatabaseUri(),
	});
}

// once URI is set, start the database connection.
db.connect();

// import on other files to make SQL query to our database (db.query)
module.exports = db;
