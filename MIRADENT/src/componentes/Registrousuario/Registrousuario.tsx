import { useState, type FormEvent } from 'react'
import { useMiradent } from '../../context'

type Props = { onRegistered: () => void; onLogin: () => void }

export default function RegistroUsuario({ onRegistered, onLogin }: Props) {
	const { register } = useMiradent()
	const [error, setError] = useState('')

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		const form = new FormData(event.currentTarget)
		const password = String(form.get('password'))
		if (password !== form.get('confirmPassword')) {
			setError('Las contraseñas no coinciden.')
			return
		}
		try {
			register(
				String(form.get('name')),
				String(form.get('email')),
				String(form.get('phone')),
				password,
			)
			onRegistered()
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : 'No se pudo crear la cuenta.')
		}
	}

	return (
		<section className="form-panel">
			<p className="eyebrow">Tu salud, en buenas manos</p>
			<h1>Crea tu cuenta</h1>
			<p className="form-intro">Regístrate para reservar y gestionar tus citas.</p>
			<form className="form-grid" onSubmit={handleSubmit}>
				<label>
					Nombre completo
					<input name="name" autoComplete="name" required minLength={2} />
				</label>
				<label>
					Correo electrónico
					<input name="email" type="email" autoComplete="email" required />
				</label>
				<label>
					Teléfono
					<input name="phone" type="tel" autoComplete="tel" required />
				</label>
				<label>
					Contraseña
					<input
						name="password"
						type="password"
						autoComplete="new-password"
						required
						minLength={6}
					/>
				</label>
				<label>
					Confirma la contraseña
					<input
						name="confirmPassword"
						type="password"
						autoComplete="new-password"
						required
						minLength={6}
					/>
				</label>
				{error && (
					<p className="form-error" role="alert">
						{error}
					</p>
				)}
				<button className="button button-primary" type="submit">
					Crear cuenta
				</button>
			</form>
			<p className="form-switch">
				¿Ya tienes cuenta?{' '}
				<button className="text-button" type="button" onClick={onLogin}>
					Inicia sesión
				</button>
			</p>
		</section>
	)
}
