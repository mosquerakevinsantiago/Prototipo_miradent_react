import { AppError } from '../../business/errors/app-error.js'

export function errorHandler(error, request, response, next) {
	if (response.headersSent) return next(error)

	const statusCode = error instanceof AppError ? error.statusCode : (error.statusCode ?? 500)
	if (statusCode >= 500) console.error(error)

	return response.status(statusCode).json({
		error: statusCode >= 500 ? 'Ocurrió un error interno.' : error.message,
	})
}
