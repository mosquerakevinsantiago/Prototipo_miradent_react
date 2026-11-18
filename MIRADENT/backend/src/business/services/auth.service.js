import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { config } from '../../config/env.js'
import { AppError } from '../errors/app-error.js'

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,72}$/

export function createAuthService(authRepository) {
	return {
		async register({ name, email, phone = '', password }) {
			const normalizedName = String(name ?? '').trim()
			const normalizedEmail = String(email ?? '')
				.trim()
				.toLowerCase()

			if (normalizedName.length < 2 || normalizedName.length > 100) {
				throw new AppError('El nombre debe tener entre 2 y 100 caracteres.')
			}
			if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
				throw new AppError('Escribe un correo electrónico válido.')
			}
			if (!passwordPattern.test(String(password ?? ''))) {
				throw new AppError(
					'La contraseña debe tener entre 8 y 72 caracteres e incluir mayúscula, minúscula y número.',
				)
			}
			if (await authRepository.findByEmail(normalizedEmail)) {
				throw new AppError('Ya existe una cuenta con ese correo.', 409)
			}

			const passwordHash = await bcrypt.hash(password, 12)
			const user = await authRepository.createPatient({
				name: normalizedName,
				email: normalizedEmail,
				phone: String(phone).trim().slice(0, 20),
				passwordHash,
			})

			return this.createSession(user)
		},

		async login({ email, password }) {
			const normalizedEmail = String(email ?? '')
				.trim()
				.toLowerCase()
			const user = await authRepository.findByEmail(normalizedEmail)

			if (
				!user ||
				!user.contrasena_hash ||
				!(await bcrypt.compare(String(password ?? ''), user.contrasena_hash))
			) {
				throw new AppError('El correo o la contraseña no son correctos.', 401)
			}

			return this.createSession(user)
		},

		createSession(user) {
			const token = jwt.sign({ role: user.rol, name: user.nombre }, config.jwtSecret, {
				subject: String(user.id_usuario),
				expiresIn: '8h',
			})

			return {
				token,
				user: {
					id: user.id_usuario,
					name: user.nombre,
					email: user.correo,
					role: user.rol,
				},
			}
		},
	}
}
