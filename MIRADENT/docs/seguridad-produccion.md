# Seguridad y preparación para producción

## Protección configurada para Vercel

`vercel.json` establece una política CSP, evita el enmarcado de la aplicación, activa
HSTS, impide la interpretación MIME, limita el envío de referentes y deshabilita
permisos del navegador que Miradent no necesita. La CSP permite recursos de imagen
locales, `data:` para el cursor accesible y `images.unsplash.com`, que usa la página
de inicio. El estilo en línea se permite porque el ajuste de tamaño de texto lo usa.

Estos encabezados se aplican al desplegar en Vercel; no los proporciona el servidor
de desarrollo de Vite. Hay que comprobarlos en una URL de preview/producción y
revisar la CSP si se agregan nuevos dominios o integraciones.

## Límite actual: prototipo cliente, no autenticación de producción

La aplicación todavía es React/Vite y utiliza `localStorage` como fuente de datos.
En consecuencia, el navegador controla la identidad y los roles; los datos locales
se pueden leer o modificar desde las herramientas del navegador. La contraseña del
prototipo se persiste sin hash y existe una cuenta administrativa de demostración
en el código. Los encabezados HTTP no corrigen esos problemas.

No usar este prototipo para cuentas reales, historiales clínicos ni datos personales
de pacientes. No está implementado todavía: hash Argon2id/bcrypt, sesiones de
servidor y cierre/inactividad, recuperación de contraseñas, limitación de intentos
o CAPTCHA, autorización RBAC confiable en backend, protección CSRF de mutaciones,
auditoría con IP del servidor, notificaciones seguras, carga de archivos, copias de
seguridad o API conectada a MySQL. La protección XSS del cliente tampoco reemplaza
validación y autorización del servidor.

## Base de datos e integración pendientes

La base de datos se entrega y administra por separado; este repositorio no incluye
un script para crearla ni migraciones SQL. No ejecutar `CREATE DATABASE`, crear
tablas, cambiar columnas ni conectarse a una instancia sin autorización explícita.
El DDL compartido describe el esquema de referencia, pero debe confirmarse contra la
instalación entregada antes de adaptar consultas preparadas, transacciones, índices
o restricciones. La aplicación actual todavía no está conectada a esa base.

Las credenciales de conexión deben guardarse como variables de entorno de Vercel
para funciones/API, nunca en el bundle React, Git o `localStorage`. Los respaldos,
retención, copias externas y pruebas de restauración deben configurarse en el
proveedor de MySQL y el almacenamiento independiente conforme a una estrategia
3-2-1; no están configurados por este proyecto.

## Criterios antes de producción

1. Implementar la API conectada a la base entregada y autenticar con Argon2id o bcrypt en el servidor; eliminar
   la autenticación local y el usuario de demostración antes de migrar cuentas.
2. Autorizar cada operación en el backend según usuario/rol, validar entradas y
   aplicar consultas preparadas y transacciones en las reservas.
3. Añadir sesiones seguras con cookies `HttpOnly`, `Secure`, `SameSite`, rotación
   al iniciar sesión, expiración e invalidación al cerrar sesión.
4. Configurar recuperación de cuenta, límites de acceso, CAPTCHA basado en riesgo,
   logs y alertas sin registrar contraseñas, tokens ni datos clínicos innecesarios.
5. Configurar y probar backups cifrados, retención, monitoreo y restauración.
6. Verificar encabezados, CSP, HTTPS, permisos, dependencias y flujos de fallo en
   un despliegue de preview antes de producción.
