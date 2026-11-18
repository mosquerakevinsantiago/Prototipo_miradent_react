export function createAuthRepository(pool) {
	return {
		findByEmail(email) {
			return pool
				.execute(
					`SELECT u.id_usuario, u.nombre, u.correo, u.contrasena_hash, r.nombre AS rol
					FROM usuarios u
					INNER JOIN roles r ON r.id_rol = u.id_rol
					WHERE u.correo = ?
					LIMIT 1`,
					[email],
				)
				.then(([rows]) => rows[0] ?? null)
		},

		async createPatient({ name, email, phone, passwordHash }) {
			const connection = await pool.getConnection()

			try {
				await connection.beginTransaction()
				const [roles] = await connection.execute(
					'SELECT id_rol FROM roles WHERE nombre = ? LIMIT 1',
					['Paciente'],
				)
				if (!roles[0]) throw new Error('No existe el rol Paciente. Ejecuta database/schema.sql.')

				const [result] = await connection.execute(
					`INSERT INTO usuarios (id_rol, nombre, correo, telefono, contrasena_hash)
					VALUES (?, ?, ?, ?, ?)`,
					[roles[0].id_rol, name, email, phone, passwordHash],
				)

				await connection.commit()
				return {
					id_usuario: result.insertId,
					nombre: name,
					correo: email,
					rol: 'Paciente',
				}
			} catch (error) {
				await connection.rollback()
				if (error.code === 'ER_DUP_ENTRY') {
					error.statusCode = 409
					error.message = 'Ya existe una cuenta con ese correo.'
				}
				throw error
			} finally {
				connection.release()
			}
		},
	}
}
