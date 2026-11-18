import mysql from 'mysql2/promise'
import { config } from './env.js'

export const pool = mysql.createPool({
	host: config.database.host,
	port: config.database.port,
	database: config.database.name,
	user: config.database.user,
	password: config.database.password,
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0,
})
