import { Router } from 'express'

export function createAuthRoutes(controller) {
	const router = Router()
	router.post('/register', controller.register)
	router.post('/login', controller.login)
	return router
}
