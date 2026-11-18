export function createCatalogRepository(pool) {
	return {
		async listServices() {
			const [rows] = await pool.execute(
				`SELECT s.id_servicio, s.nombre, s.duracion_minutos,
					e.id_especialidad, e.nombre AS especialidad
				FROM servicios s
				INNER JOIN especialidades e ON e.id_especialidad = s.id_especialidad
				ORDER BY s.nombre`,
			)
			return rows
		},

		async listSpecialties() {
			const [rows] = await pool.execute(
				'SELECT id_especialidad, nombre FROM especialidades ORDER BY nombre',
			)
			return rows
		},

		async listDentists(specialtyId) {
			const query = `SELECT o.id_odontologo, u.nombre, e.id_especialidad,
					e.nombre AS especialidad, o.hora_inicio, o.hora_fin
				FROM odontologos o
				INNER JOIN usuarios u ON u.id_usuario = o.id_usuario
				INNER JOIN roles r ON r.id_rol = u.id_rol
				INNER JOIN especialidades e ON e.id_especialidad = o.id_especialidad
				WHERE r.nombre = 'Odontólogo'
					AND (? IS NULL OR e.id_especialidad = ?)
				ORDER BY u.nombre`
			const [rows] = await pool.execute(query, [specialtyId ?? null, specialtyId ?? null])
			return rows
		},
	}
}
