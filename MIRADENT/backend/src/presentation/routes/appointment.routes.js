import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'

export function createAppointmentRoutes(controller) {
	const router = Router()
	router.post('/', authenticate, controller.book)
	return router
}
