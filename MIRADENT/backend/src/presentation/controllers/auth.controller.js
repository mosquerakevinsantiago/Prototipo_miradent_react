export function createAuthController(authService) {
	return {
		register: async (request, response) => {
			const session = await authService.register(request.body ?? {})
			response.status(201).json(session)
		},
		login: async (request, response) => {
			const session = await authService.login(request.body ?? {})
			response.json(session)
		},
	}
}
