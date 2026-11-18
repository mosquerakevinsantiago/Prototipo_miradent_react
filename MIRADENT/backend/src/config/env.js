import 'dotenv/config'

function requiredSecret(value) {
	if (!value || value.length < 32 || value.startsWith('replace-this')) {
		throw new Error('Configura JWT_SECRET con al menos 32 caracteres en backend/.env.')
	}

	return value
}

export const config = {
	port: Number(process.env.PORT ?? 3001),
	frontendUrls: (process.env.FRONTEND_URLS ?? 'http://localhost:5173,http://127.0.0.1:5173')
		.split(',')
		.map((url) => url.trim())
		.filter(Boolean),
	jwtSecret: requiredSecret(process.env.JWT_SECRET),
	database: {
		host: process.env.DB_HOST ?? 'localhost',
		port: Number(process.env.DB_PORT ?? 3306),
		name: process.env.DB_NAME ?? 'miradent',
		user: process.env.DB_USER ?? 'root',
		password: process.env.DB_PASSWORD ?? '',
	},
}
