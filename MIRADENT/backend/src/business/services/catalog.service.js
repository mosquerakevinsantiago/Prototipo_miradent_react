import { AppError } from '../errors/app-error.js'

export function createCatalogService(catalogRepository) {
	return {
		listServices: () => catalogRepository.listServices(),
		listSpecialties: () => catalogRepository.listSpecialties(),
		listDentists: async (specialtyId) => {
			if (specialtyId === undefined) return catalogRepository.listDentists()
			const id = Number(specialtyId)
			if (!Number.isInteger(id) || id < 1) {
				throw new AppError('La especialidad seleccionada no es válida.')
			}
			return catalogRepository.listDentists(id)
		},
	}
}
