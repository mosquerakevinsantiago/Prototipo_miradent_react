export function createAppointmentRepository(pool) {
	return {
		async withTransaction(operation) {
			const connection = await pool.getConnection()

			try {
				await connection.beginTransaction()
				const result = await operation(createTransactionQueries(connection))
				await connection.commit()
				return result
			} catch (error) {
				try {
					await connection.rollback()
				} catch (rollbackError) {
					error.rollbackError = rollbackError
				}
				throw error
			} finally {
				connection.release()
			}
		},
	}
}

function createTransactionQueries(connection) {
	return {
		async lockClinicSchedule(weekday, time) {
			const [rows] = await connection.execute(
				`SELECT id_horario
				FROM horario_clinica
				WHERE dia_semana = ?
					AND hora_inicio <= ?
					AND hora_fin > ?
				LIMIT 1
				FOR UPDATE`,
				[weekday, time, time],
			)
			return rows[0] ?? null
		},

		async findPatient(patientId) {
			const [rows] = await connection.execute(
				`SELECT u.id_usuario
				FROM usuarios u
				INNER JOIN roles r ON r.id_rol = u.id_rol
				WHERE u.id_usuario = ? AND r.nombre = 'Paciente'
				LIMIT 1`,
				[patientId],
			)
			return rows[0] ?? null
		},

		async findDentist(dentistId) {
			const [rows] = await connection.execute(
				`SELECT o.id_odontologo, o.id_especialidad, o.hora_inicio, o.hora_fin
				FROM odontologos o
				INNER JOIN usuarios u ON u.id_usuario = o.id_usuario
				INNER JOIN roles r ON r.id_rol = u.id_rol
				WHERE o.id_odontologo = ? AND r.nombre = 'Odontólogo'
				LIMIT 1`,
				[dentistId],
			)
			return rows[0] ?? null
		},

		async findService(serviceId) {
			const [rows] = await connection.execute(
				`SELECT id_servicio, id_especialidad, nombre, duracion_minutos
				FROM servicios
				WHERE id_servicio = ?
				LIMIT 1`,
				[serviceId],
			)
			return rows[0] ?? null
		},

		async getAppointmentEndTime(time, durationMinutes, date) {
			const [rows] = await connection.execute(
				'SELECT ADDTIME(?, SEC_TO_TIME(? * 60)) AS hora_fin, TIMESTAMP(?, ?) > NOW() AS es_futura',
				[time, durationMinutes, date, time],
			)
			return rows[0]
		},

		async findClinicBlock(weekday, startTime, endTime) {
			const [rows] = await connection.execute(
				`SELECT id_horario
				FROM horario_clinica
				WHERE dia_semana = ?
					AND hora_inicio <= ?
					AND hora_fin >= ?
				LIMIT 1`,
				[weekday, startTime, endTime],
			)
			return rows[0] ?? null
		},

		async findClinicClosure(date) {
			const [rows] = await connection.execute(
				'SELECT id_cierre FROM cierres_clinica WHERE fecha = ? LIMIT 1',
				[date],
			)
			return rows[0] ?? null
		},

		async lockAvailabilitySlot(dentistId, date, time) {
			const [rows] = await connection.execute(
				`SELECT id_disponibilidad
				FROM disponibilidad
				WHERE id_odontologo = ? AND fecha = ? AND hora = ?
				LIMIT 1
				FOR UPDATE`,
				[dentistId, date, time],
			)
			return rows[0] ?? null
		},

		async findDentistConflict(dentistId, date, startTime, endTime) {
			const [rows] = await connection.execute(
				`SELECT id_cita
				FROM citas
				WHERE id_odontologo = ?
					AND fecha = ?
					AND estado <> 'Cancelada'
					AND hora_inicio < ?
					AND hora_fin > ?
				LIMIT 1`,
				[dentistId, date, endTime, startTime],
			)
			return rows[0] ?? null
		},

		async findFreeChair(date, startTime, endTime) {
			const [rows] = await connection.execute(
				`SELECT s.id_silla
				FROM sillas s
				WHERE NOT EXISTS (
					SELECT 1
					FROM citas c
					WHERE c.id_silla = s.id_silla
						AND c.fecha = ?
						AND c.estado <> 'Cancelada'
						AND c.hora_inicio < ?
						AND c.hora_fin > ?
				)
				ORDER BY s.id_silla
				LIMIT 1
				FOR UPDATE`,
				[date, endTime, startTime],
			)
			return rows[0] ?? null
		},

		async createAppointment({
			patientId,
			dentistId,
			serviceId,
			chairId,
			slotId,
			date,
			startTime,
			endTime,
			durationMinutes,
			notes,
		}) {
			const [result] = await connection.execute(
				`INSERT INTO citas (
					id_paciente, id_odontologo, id_servicio, id_silla, id_disponibilidad,
					fecha, hora_inicio, hora_fin, duracion_minutos, estado, notas
				)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pendiente', ?)`,
				[
					patientId,
					dentistId,
					serviceId,
					chairId,
					slotId,
					date,
					startTime,
					endTime,
					durationMinutes,
					notes,
				],
			)
			return result.insertId
		},

		async createNotification(appointmentId, serviceName) {
			await connection.execute(
				`INSERT INTO notificaciones (id_cita, mensaje, fecha_creacion)
				VALUES (?, ?, NOW())`,
				[appointmentId, `Nueva solicitud para ${serviceName}.`],
			)
		},
	}
}
