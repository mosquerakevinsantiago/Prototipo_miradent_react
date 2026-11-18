import test from 'node:test'
import assert from 'node:assert/strict'

process.env.JWT_SECRET = 'test-secret-with-more-than-thirty-two-characters'

const { createApp } = await import('../src/app.js')

test('serves a database health check and reports unknown routes', async (context) => {
	const pool = {
		query: async () => [[{ result: 1 }], []],
		execute: async () => [[], []],
	}
	const server = createApp(pool).listen(0, '127.0.0.1')
	context.after(() => new Promise((resolve) => server.close(resolve)))

	await new Promise((resolve) => server.once('listening', resolve))
	const address = server.address()
	const baseUrl = `http://127.0.0.1:${address.port}`

	const healthResponse = await fetch(`${baseUrl}/api/health`, {
		headers: { Origin: 'http://127.0.0.1:5173' },
	})
	assert.equal(healthResponse.status, 200)
	assert.deepEqual(await healthResponse.json(), { status: 'ok', database: 'connected' })
	assert.equal(healthResponse.headers.get('access-control-allow-origin'), 'http://127.0.0.1:5173')

	const missingRouteResponse = await fetch(`${baseUrl}/unknown`)
	assert.equal(missingRouteResponse.status, 404)
	assert.deepEqual(await missingRouteResponse.json(), { error: 'Ruta no encontrada.' })

	const unauthorizedResponse = await fetch(`${baseUrl}/api/appointments`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ dentistId: 1 }),
	})
	assert.equal(unauthorizedResponse.status, 401)
	assert.deepEqual(await unauthorizedResponse.json(), {
		error: 'Inicia sesión para continuar.',
	})
})
