export function createAppointmentController(appointmentService) {
	return {
		book: async (request, response) => {
			const appointment = await appointmentService.book({
				...(request.body ?? {}),
				patientId: request.user.id,
			})
			response.status(201).json(appointment)
		},
	}
}
