import { AppError } from '../errors/app-error.js'

function isValidDate(value) {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
	const date = new Date(`${value}T00:00:00Z`)
	return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

function isValidTime(value) {
	return /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(value)
}

export function createAppointmentService(appointmentRepository) {
	return {
		async book({ patientId, dentistId, serviceId, date, time, notes = '' }) {
			const parsedPatientId = Number(patientId)
			const parsedDentistId = Number(dentistId)
			const parsedServiceId = Number(serviceId)

			if (
				![parsedPatientId, parsedDentistId, parsedServiceId].every(
					(id) => Number.isInteger(id) && id > 0,
				)
			) {
				throw new AppError('El paciente, odontólogo o servicio no es válido.')
			}
			if (!isValidDate(date) || !isValidTime(time)) {
				throw new AppError('Selecciona una fecha y una hora válidas.')
			}
			if (typeof notes !== 'string' || notes.length > 2000) {
				throw new AppError('Las notas no pueden superar 2000 caracteres.')
			}

			const startTime = time.length === 5 ? `${time}:00` : time
			const appointment = await appointmentRepository.withTransaction(async (database) => {
				const weekday = new Date(`${date}T00:00:00Z`).getUTCDay()
				if (weekday === 0 || weekday === 6) {
					throw new AppError('La clínica atiende de lunes a viernes.')
				}

				const schedule = await database.lockClinicSchedule(weekday, startTime)
				if (!schedule) {
					throw new AppError('La hora elegida está fuera del horario de la clínica.')
				}

				const patient = await database.findPatient(parsedPatientId)
				if (!patient) throw new AppError('La cuenta no corresponde a un paciente.', 403)

				const dentist = await database.findDentist(parsedDentistId)
				if (!dentist) throw new AppError('No se encontró el odontólogo seleccionado.', 404)

				const service = await database.findService(parsedServiceId)
				if (!service) throw new AppError('No se encontró el servicio seleccionado.', 404)
				if (dentist.id_especialidad !== service.id_especialidad) {
					throw new AppError('La especialidad del odontólogo no corresponde al servicio.')
				}

				const appointmentTime = await database.getAppointmentEndTime(
					startTime,
					service.duracion_minutos,
					date,
				)
				if (!appointmentTime.es_futura) throw new AppError('Selecciona una fecha y hora futuras.')
				if (startTime < dentist.hora_inicio || appointmentTime.hora_fin > dentist.hora_fin) {
					throw new AppError('El servicio no cabe en el horario del odontólogo.')
				}

				const clinicBlock = await database.findClinicBlock(
					weekday,
					startTime,
					appointmentTime.hora_fin,
				)
				if (!clinicBlock) {
					throw new AppError(
						'La cita debe terminar dentro del horario y no puede cruzar el almuerzo.',
					)
				}

				if (await database.findClinicClosure(date)) {
					throw new AppError('La clínica está cerrada en la fecha seleccionada.')
				}

				const slot = await database.lockAvailabilitySlot(parsedDentistId, date, startTime)
				if (!slot) throw new AppError('El odontólogo no tiene ese horario disponible.')

				if (
					await database.findDentistConflict(
						parsedDentistId,
						date,
						startTime,
						appointmentTime.hora_fin,
					)
				) {
					throw new AppError('El odontólogo ya tiene una cita que se cruza con ese horario.', 409)
				}

				const chair = await database.findFreeChair(date, startTime, appointmentTime.hora_fin)
				if (!chair) throw new AppError('Las dos sillas están ocupadas en ese horario.', 409)

				const appointmentId = await database.createAppointment({
					patientId: parsedPatientId,
					dentistId: parsedDentistId,
					serviceId: parsedServiceId,
					chairId: chair.id_silla,
					slotId: slot.id_disponibilidad,
					date,
					startTime,
					endTime: appointmentTime.hora_fin,
					durationMinutes: service.duracion_minutos,
					notes: notes.trim(),
				})
				await database.createNotification(appointmentId, service.nombre)

				return {
					id: appointmentId,
					date,
					startTime,
					endTime: appointmentTime.hora_fin,
					chairId: chair.id_silla,
					status: 'Pendiente',
				}
			})

			return appointment
		},
	}
}
