import test from 'node:test'
import assert from 'node:assert/strict'
import { createAppointmentRepository } from '../src/data/repositories/appointment.repository.js'
import { createAppointmentService } from '../src/business/services/appointment.service.js'

test('rolls back and releases the connection when booking validation fails', async () => {
	const calls = []
	const connection = {
		beginTransaction: async () => calls.push('begin'),
		execute: async () => {
			calls.push('query')
			return [[], []]
		},
		rollback: async () => calls.push('rollback'),
		commit: async () => calls.push('commit'),
		release: () => calls.push('release'),
	}
	const appointmentRepository = createAppointmentRepository({
		getConnection: async () => connection,
	})
	const appointmentService = createAppointmentService(appointmentRepository)

	await assert.rejects(
		appointmentService.book({
			patientId: 7,
			dentistId: 2,
			serviceId: 3,
			date: '2027-01-04',
			time: '09:00',
			notes: '',
		}),
		{ message: 'La hora elegida está fuera del horario de la clínica.' },
	)

	assert.deepEqual(calls, ['begin', 'query', 'rollback', 'release'])
})
