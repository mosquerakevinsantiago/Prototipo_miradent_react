# Backend de MIRADENT

API Node.js y MySQL organizada en tres capas:

1. `src/presentation`: rutas HTTP, controladores y autenticación.
2. `src/business`: validación y reglas de negocio.
3. `src/data`: consultas y transacciones de MySQL.

## Preparación

1. Instala MySQL y ejecuta `../database/schema.sql` una sola vez.
2. Copia `.env.example` como `.env`.
3. Edita `.env` con el usuario y la contraseña de tu servidor MySQL.
4. Cambia `JWT_SECRET` por una cadena aleatoria secreta de 32 caracteres o más.
5. Instala las dependencias e inicia la API:

```bash
npm install
npm run dev
```

La API escucha en `http://localhost:3001`. La configuración de ejemplo acepta la interfaz en `http://localhost:5173` y `http://127.0.0.1:5173`.

## Rutas disponibles

- `GET /api/health`: comprueba que la API puede consultar MySQL.
- `POST /api/auth/register`: crea una cuenta de paciente y devuelve un token.
- `POST /api/auth/login`: inicia sesión y devuelve un token.
- `GET /api/services`: lista los servicios.
- `GET /api/specialties`: lista las especialidades.
- `GET /api/dentists`: lista los odontólogos.
- `POST /api/appointments`: crea una cita; requiere token de paciente.

Las rutas de cita esperan un encabezado `Authorization: Bearer <token>` y un cuerpo JSON como:

```json
{
	"dentistId": 1,
	"serviceId": 2,
	"date": "2027-01-04",
	"time": "09:00",
	"notes": ""
}
```

El backend busca una silla libre y guarda la cita y su notificación en una transacción. Si una validación o consulta falla, ejecuta `ROLLBACK` y devuelve un error; no deja una cita a medias.

## Comprobaciones

```bash
npm test
npm run check
```

La aplicación React todavía no consume esta API y continúa usando `localStorage`. El backend es una capa separada lista para probar y conectar en un cambio posterior.
