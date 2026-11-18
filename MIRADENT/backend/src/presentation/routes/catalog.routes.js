import { Router } from 'express'

export function createCatalogRoutes(controller) {
	const router = Router()
	router.get('/services', controller.listServices)
	router.get('/specialties', controller.listSpecialties)
	router.get('/dentists', controller.listDentists)
	return router
}
