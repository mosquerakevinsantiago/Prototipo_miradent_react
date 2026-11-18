import test from 'node:test'
import assert from 'node:assert/strict'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

process.env.JWT_SECRET = 'test-secret-with-more-than-thirty-two-characters'

const { createAuthService } = await import('../src/business/services/auth.service.js')

test('rejects a weak password without creating an account', async () => {
	let repositoryCalled = false
	const authService = createAuthService({
		findByEmail: async () => {
			repositoryCalled = true
			return null
		},
	})

	await assert.rejects(
		authService.register({
			name: 'Paciente de prueba',
			email: 'paciente@example.com',
			password: 'weak',
		}),
		{
			message:
				'La contraseña debe tener entre 8 y 72 caracteres e incluir mayúscula, minúscula y número.',
		},
	)
	assert.equal(repositoryCalled, false)
})

test('stores a password hash and returns a signed patient session', async () => {
	let savedAccount
	const authService = createAuthService({
		findByEmail: async () => null,
		createPatient: async (account) => {
			savedAccount = account
			return {
				id_usuario: 12,
				nombre: account.name,
				correo: account.email,
				rol: 'Paciente',
			}
		},
	})

	const session = await authService.register({
		name: 'Paciente de prueba',
		email: 'PACIENTE@example.com',
		phone: ' 300 123 4567 ',
		password: 'StrongPass123',
	})

	assert.equal(savedAccount.email, 'paciente@example.com')
	assert.equal(savedAccount.phone, '300 123 4567')
	assert.notEqual(savedAccount.passwordHash, 'StrongPass123')
	assert.equal(await bcrypt.compare('StrongPass123', savedAccount.passwordHash), true)
	assert.equal(session.user.role, 'Paciente')
	assert.equal(jwt.verify(session.token, process.env.JWT_SECRET).sub, '12')
})
