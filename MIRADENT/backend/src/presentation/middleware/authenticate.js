import jwt from 'jsonwebtoken'
import { config } from '../../config/env.js'

export function authenticate(request, response, next) {
	const authorization = request.get('authorization') ?? ''
	const [scheme, token] = authorization.split(' ')

	if (scheme !== 'Bearer' || !token) {
		return response.status(401).json({ error: 'Inicia sesión para continuar.' })
	}

	try {
		const payload = jwt.verify(token, config.jwtSecret)
		request.user = {
			id: Number(payload.sub),
			role: payload.role,
		}
		return next()
	} catch {
		return response.status(401).json({ error: 'La sesión no es válida o ha expirado.' })
	}
}
