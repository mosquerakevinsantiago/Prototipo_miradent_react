# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.


## Requisitos incorporados para la entrega

- Roles diferenciados: paciente y administrador.
- Menú de paciente con acceso a «Mis citas» y módulo «Administración» protegido para administradores.
- Gestión de odontólogos con especialidad y jornada de atención.
- Jornada general de la clínica: 08:00–12:00 y 13:30–18:00.
- Capacidad de dos sillas y asignación automática de una silla libre en las citas.
- Servicios con duración y especialidad; la cita guarda hora de finalización y duración usada.
- Validación de cruces por intervalo para odontólogo y silla, excluyendo citas canceladas.
- Filtrado de odontólogos por especialidad y validación de jornada, almuerzo y cierre.
- Acceso de pacientes y administración desde el mismo formulario de inicio de sesión; el rol de la cuenta dirige a su espacio.
- Administración de la agenda en vista de calendario mensual filtrada por especialidad y odontólogo, con detalle diario para revisar o retirar turnos.
- Publicación de disponibilidad mensual por especialidad, odontólogo y días de atención, con turnos cada 30 minutos y bloqueo automático del almuerzo.
- Reserva por tratamiento y mes, con estado real de agenda por odontólogo, próximo día con cupos, cantidad de horarios, fechas y horas disponibles.
- Apartado de accesibilidad con aumento de texto, alto contraste, reducción de movimiento y restablecimiento de preferencias.
- Se conserva el almacenamiento local del navegador y se adapta la lectura de datos anteriores.

### Acceso inicial de administración
- Correo: `admin@miradent.com`
- Contraseña: `admin123`

### Ejecución
```bash
npm install
npm run dev
```

Para comprobar la compilación:
```bash
npm run build
```

### Base de datos MySQL

En `database/schema.sql` está el esquema inicial de MySQL con comandos básicos: `CREATE DATABASE`, `USE`, `CREATE TABLE` e `INSERT`. Incluye usuarios y roles, odontólogos y especialidades, servicios, horario de la clínica, cierres, disponibilidad, las dos sillas, citas y notificaciones.

Para ejecutarlo en un servidor MySQL 8.0.16 o posterior:

```bash
mysql -u TU_USUARIO -p < database/schema.sql
```

En `horario_clinica`, los días son números del 1 (lunes) al 5 (viernes). El horario está dividido en mañana y tarde para dejar libre el almuerzo. Las duraciones de los servicios son valores de ejemplo; Endodoncia está configurada en 90 minutos.

**Importante:** esta es una base para comenzar a practicar, no una versión lista para producción. El script no incluye automatizaciones avanzadas para evitar dos reservas simultáneas. La interfaz actual todavía guarda y consulta los datos en `localStorage`; conectarla con MySQL requiere un backend. Guarda las contraseñas como hash desde el backend, nunca como texto normal.

**Nota académica:** la aplicación sigue utilizando `localStorage` como almacenamiento del navegador; no equivale todavía a una base de datos centralizada con backend y los cambios no se comparten entre dispositivos. Las validaciones del navegador son para demostración y no protegen contra reservas simultáneas en diferentes dispositivos. Para producción, se requiere implementar y conectar un backend.

Los odontólogos A y K son registros de referencia y deben reemplazarse por los nombres reales. La disponibilidad mensual se guarda como turnos fechados y debe publicarse por cada odontólogo y especialidad desde Administración > Horarios.

Las duraciones de ejemplo de los servicios —excepto Endodoncia, configurada en 90 minutos según el requisito— son provisionales y deben verificarse con la clínica.

### Benchmarking
En `docs/benchmarking.md` queda organizada la lista de referencias escrita en los apuntes y una matriz para comparar disponibilidad, selección del profesional, reserva, confirmación y administración. Las observaciones específicas de cada plataforma deben completarse después de revisarlas.
