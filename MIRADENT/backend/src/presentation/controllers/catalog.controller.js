export function createCatalogController(catalogService) {
	return {
		listServices: async (request, response) => {
			response.json(await catalogService.listServices())
		},
		listSpecialties: async (request, response) => {
			response.json(await catalogService.listSpecialties())
		},
		listDentists: async (request, response) => {
			response.json(await catalogService.listDentists(request.query.specialtyId))
		},
	}
}
