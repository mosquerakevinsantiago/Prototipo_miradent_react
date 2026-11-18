import { createApp } from './app.js'
import { config } from './config/env.js'
import { pool } from './config/database.js'

const app = createApp(pool)
const server = app.listen(config.port, () => {
	console.log(`MIRADENT API disponible en http://localhost:${config.port}`)
})

function closeServer() {
	server.close(async () => {
		await pool.end()
		process.exit(0)
	})
}

process.on('SIGINT', closeServer)
process.on('SIGTERM', closeServer)
