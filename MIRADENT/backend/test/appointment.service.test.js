import test from 'node:test'
import assert from 'node:assert/strict'
import { createAppointmentService } from '../src/business/services/appointment.service.js'

test('rejects invalid date before accessing the repository', async () => {
	let repositoryCalled = false
	const service = createAppointmentService({
		withTransaction: async () => {
			repositoryCalled = true
		},
	})

	await assert.rejects(
		service.book({
			patientId: 1,
			dentistId: 1,
			serviceId: 1,
			date: '2026-02-31',
			time: '10:00',
		}),
		{ message: 'Selecciona una fecha y una hora válidas.' },
	)
	assert.equal(repositoryCalled, false)
})

test('normalizes identifiers, time, and notes before booking', async () => {
	let received
	const service = createAppointmentService({
		withTransaction: async (callback) => {
			const operations = {
				lockClinicSchedule: async () => ({ id_horario: 1 }),
				findPatient: async () => ({ id_usuario: 4 }),
				findDentist: async () => ({
					id_odontologo: 2,
					id_especialidad: 1,
					hora_inicio: '08:00:00',
					hora_fin: '18:00:00',
				}),
				findService: async () => ({
					id_servicio: 3,
					id_especialidad: 1,
					nombre: 'Limpieza dental',
					duracion_minutos: 30,
				}),
				getAppointmentEndTime: async () => ({
					hora_fin: '10:00:00',
					es_futura: 1,
				}),
				findClinicBlock: async () => ({ id_horario: 1 }),
				findClinicClosure: async () => null,
				lockAvailabilitySlot: async () => ({ id_disponibilidad: 9 }),
				findDentistConflict: async () => null,
				findFreeChair: async () => ({ id_silla: 1 }),
				createAppointment: async (details) => {
					received = details
					return 5
				},
				createNotification: async () => {},
			}
			return callback(operations)
		},
	})

	const result = await service.book({
		patientId: '4',
		dentistId: '2',
		serviceId: '3',
		date: '2027-01-04',
		time: '09:30',
		notes: '  Control  ',
	})

	assert.deepEqual(received, {
		patientId: 4,
		dentistId: 2,
		serviceId: 3,
		chairId: 1,
		slotId: 9,
		date: '2027-01-04',
		startTime: '09:30:00',
		endTime: '10:00:00',
		durationMinutes: 30,
		notes: 'Control',
	})
	assert.deepEqual(result, {
		id: 5,
		date: '2027-01-04',
		startTime: '09:30:00',
		endTime: '10:00:00',
		chairId: 1,
		status: 'Pendiente',
	})
})
