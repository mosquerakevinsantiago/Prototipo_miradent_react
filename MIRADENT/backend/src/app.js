import cors from 'cors'
import express from 'express'
import { createAppointmentController } from './presentation/controllers/appointment.controller.js'
import { createAuthController } from './presentation/controllers/auth.controller.js'
import { createCatalogController } from './presentation/controllers/catalog.controller.js'
import { errorHandler } from './presentation/middleware/error-handler.js'
import { createAppointmentRoutes } from './presentation/routes/appointment.routes.js'
import { createAuthRoutes } from './presentation/routes/auth.routes.js'
import { createCatalogRoutes } from './presentation/routes/catalog.routes.js'
import { createHealthRoutes } from './presentation/routes/health.routes.js'
import { createAppointmentRepository } from './data/repositories/appointment.repository.js'
import { createAuthRepository } from './data/repositories/auth.repository.js'
import { createCatalogRepository } from './data/repositories/catalog.repository.js'
import { createAppointmentService } from './business/services/appointment.service.js'
import { createAuthService } from './business/services/auth.service.js'
import { createCatalogService } from './business/services/catalog.service.js'
import { config } from './config/env.js'

export function createApp(pool) {
	const app = express()
	const authRepository = createAuthRepository(pool)
	const catalogRepository = createCatalogRepository(pool)
	const appointmentRepository = createAppointmentRepository(pool)

	const authController = createAuthController(createAuthService(authRepository))
	const catalogController = createCatalogController(createCatalogService(catalogRepository))
	const appointmentController = createAppointmentController(
		createAppointmentService(appointmentRepository),
	)

	app.use(cors({ origin: config.frontendUrls }))
	app.use(express.json({ limit: '20kb' }))
	app.use('/api/health', createHealthRoutes(pool))
	app.use('/api/auth', createAuthRoutes(authController))
	app.use('/api', createCatalogRoutes(catalogController))
	app.use('/api/appointments', createAppointmentRoutes(appointmentController))
	app.use((request, response) => response.status(404).json({ error: 'Ruta no encontrada.' }))
	app.use(errorHandler)

	return app
}
