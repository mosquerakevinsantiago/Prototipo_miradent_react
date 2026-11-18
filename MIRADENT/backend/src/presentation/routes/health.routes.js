import { Router } from 'express'

export function createHealthRoutes(pool) {
	const router = Router()
	router.get('/', async (request, response) => {
		await pool.query('SELECT 1')
		response.json({ status: 'ok', database: 'connected' })
	})
	return router
}
