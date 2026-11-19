import { useEffect, useRef, useState, type FormEvent } from 'react'
import { AgendarCita, PanelAdmin, RegistroUsuario } from '../componentes'
import { useMiradent } from '../context'
import '../App.css'

type View = 'inicio' | 'login' | 'registro' | 'citas' | 'admin' | 'accesibilidad'
const ACCESSIBLE_TEXT_SELECTOR =
	'h1,h2,h3,h4,p,button,a,label,input,select,textarea,li,th,td,small,strong,span,legend,.eyebrow,.user-greeting,.nav-link,.form-note,.form-intro,.status'

export default function AppContent() {
	const { currentUser, login, logout } = useMiradent()
	const [view, setView] = useState<View>('inicio')
	const [loginError, setLoginError] = useState('')
	const [textSize, setTextSize] = useState<100 | 110 | 125>(100)
	const [highContrast, setHighContrast] = useState(false)
	const [reducedMotion, setReducedMotion] = useState(false)
	const sectionToScroll = useRef<string | null>(null)
	const accessibilityShell = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (view !== 'inicio' || !sectionToScroll.current) return
		document.getElementById(sectionToScroll.current)?.scrollIntoView({ behavior: 'smooth' })
		sectionToScroll.current = null
	}, [view])

	useEffect(() => {
		const elements = Array.from(
			accessibilityShell.current?.querySelectorAll<HTMLElement>(ACCESSIBLE_TEXT_SELECTOR) ?? [],
		)
		for (const element of elements) {
			if (element.hasAttribute('data-a11y-font-size')) {
				element.style.removeProperty('font-size')
				element.removeAttribute('data-a11y-font-size')
			}
		}
		if (textSize === 100) return

		const baseSizes = elements.map((element) => getComputedStyle(element).fontSize)
		elements.forEach((element, index) => {
			const baseSize = Number.parseFloat(baseSizes[index])
			if (!Number.isFinite(baseSize)) return
			element.setAttribute('data-a11y-font-size', 'true')
			element.style.setProperty('font-size', `${(baseSize * textSize) / 100}px`, 'important')
		})
	})

	function handleLogin(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		const form = new FormData(event.currentTarget)
		const user = login(String(form.get('email')), String(form.get('password')))
		if (!user) {
			setLoginError('El correo o la contraseña no son correctos.')
			return
		}
		setLoginError('')
		setView(user.role === 'admin' ? 'admin' : 'citas')
	}

	function navigate(nextView: View) {
		setLoginError('')
		if (nextView === 'admin' && currentUser?.role !== 'admin') {
			setView('login')
			return
		}
		if (nextView === 'citas' && !currentUser) {
			setView('login')
			return
		}
		setView(nextView)
	}

	function handleLogout() {
		logout()
		setView('inicio')
	}

	function goToSection(section: string) {
		setLoginError('')
		if (view === 'inicio') {
			document.getElementById(section)?.scrollIntoView({ behavior: 'smooth' })
			return
		}
		sectionToScroll.current = section
		setView('inicio')
	}

	function goToAppointment() {
		if (currentUser?.role === 'admin') {
			navigate('admin')
			return
		}
		navigate(currentUser ? 'citas' : 'registro')
	}

	return (
		<div
			ref={accessibilityShell}
			className={`site-shell${highContrast ? ' accessibility-high-contrast' : ''}${reducedMotion ? ' accessibility-reduced-motion' : ''}`}
		>
			<header className="site-header">
				<button
					type="button"
					className="brand"
					onClick={() => goToSection('inicio')}
					aria-label="Miradent, inicio"
				>
					<span className="brand-mark" aria-hidden="true">
						M
					</span>
					<span>
						MIRADENT<small>CLÍNICA DENTAL</small>
					</span>
				</button>
				<nav className="main-nav" aria-label="Navegación principal">
					<button type="button" className="nav-link" onClick={() => goToSection('inicio')}>
						Inicio
					</button>
					<button type="button" className="nav-link" onClick={() => goToSection('nosotros')}>
						Nosotros
					</button>
					<button type="button" className="nav-link" onClick={() => goToSection('servicios')}>
						Servicios
					</button>
					<button type="button" className="nav-link" onClick={goToAppointment}>
						Agenda tu cita
					</button>
					<button type="button" className="nav-link" onClick={() => goToSection('contacto')}>
						Contáctanos
					</button>
					<button
						type="button"
						className={view === 'accesibilidad' ? 'nav-link active' : 'nav-link'}
						onClick={() => navigate('accesibilidad')}
						aria-current={view === 'accesibilidad' ? 'page' : undefined}
					>
						Accesibilidad
					</button>
					{!currentUser && (
						<button type="button" className="nav-link" onClick={() => navigate('admin')}>
							Administración
						</button>
					)}
					{currentUser?.role === 'patient' && (
						<button
							type="button"
							className={view === 'citas' ? 'nav-link active' : 'nav-link'}
							onClick={() => navigate('citas')}
						>
							Mis citas
						</button>
					)}
				</nav>
				<div className="header-actions">
					{!currentUser && (
						<button
							type="button"
							className="button button-outline"
							onClick={() => navigate('login')}
						>
							Iniciar sesión
						</button>
					)}
					{currentUser ? (
						<>
							<span className="user-greeting">
								Hola, {currentUser.name.split(' ')[0]}{' '}
								{currentUser.role === 'admin' ? 'ADMIN' : 'usuario'}
							</span>
							{currentUser.role === 'admin' && (
								<button
									type="button"
									className={view === 'admin' ? 'button button-primary' : 'button button-outline'}
									onClick={() => navigate('admin')}
								>
									Administración
								</button>
							)}
							<button type="button" className="button button-outline" onClick={handleLogout}>
								Cerrar sesión
							</button>
						</>
					) : (
						<button
							type="button"
							className="button button-primary"
							onClick={() => navigate('registro')}
						>
							Crear cuenta
						</button>
					)}
				</div>
			</header>

			<main>
				{view === 'inicio' && (
					<>
						<section className="home-hero" id="inicio">
							<div className="hero-copy">
								<p className="eyebrow">Cuidamos de tu sonrisa</p>
								<h1>
									Una sonrisa sana
									<br />
									empieza aquí.
								</h1>
								<p className="hero-description">
									Atención dental cercana, información clara y un equipo que te acompaña para cuidar
									tu salud bucal.
								</p>
								<div className="hero-actions">
									<button type="button" className="button button-primary" onClick={goToAppointment}>
										Agenda tu cita <span aria-hidden="true">↗</span>
									</button>
									<button
										type="button"
										className="button button-quiet"
										onClick={() => navigate('login')}
									>
										Acceso de pacientes
									</button>
								</div>
								<div className="hero-trust">
									<span aria-hidden="true">✳</span> Cuidado dental para toda la familia
								</div>
							</div>
							<div className="hero-photo">
								<img
									src="https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=1100&q=85"
									alt="Profesional de odontología atendiendo a una paciente"
									fetchPriority="high"
								/>
							</div>
						</section>

						<section className="info-section about-section" id="nosotros">
							<div className="section-photo">
								<img
									src="https://images.unsplash.com/photo-1609840114035-3c981b782dfe?auto=format&fit=crop&w=1000&q=85"
									alt="Atención dental en un consultorio"
									loading="lazy"
								/>
							</div>
							<div className="section-copy">
								<p className="eyebrow">Nosotros</p>
								<h2>Tu salud bucal, con atención cercana.</h2>
								<p>
									En Miradent creemos que una buena atención comienza escuchándote. Queremos que
									comprendas tus opciones y participes en las decisiones sobre tu cuidado dental.
								</p>
								<p>
									La prevención y las revisiones periódicas ayudan a detectar problemas a tiempo.
									Cada plan de tratamiento debe adaptarse a las necesidades de cada persona y ser
									evaluado por un profesional.
								</p>
								<a
									className="source-link"
									href="https://www.who.int/news-room/fact-sheets/detail/oral-health"
									target="_blank"
									rel="noreferrer"
								>
									Fuente de salud: Organización Mundial de la Salud ↗
								</a>
							</div>
						</section>

						<section className="services-section" id="servicios">
							<div className="services-intro">
								<p className="eyebrow">Servicios</p>
								<h2>Atención para cada etapa de tu sonrisa.</h2>
								<p>
									Conoce algunas áreas habituales de la atención odontológica. La valoración
									profesional determina qué cuidado es adecuado en cada caso.
								</p>
							</div>
							<div className="service-feature">
								<img
									src="https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=1200&q=85"
									alt="Odontóloga conversando con una paciente durante una consulta"
									loading="lazy"
								/>
								<div className="service-list">
									<article>
										<span>01</span>
										<div>
											<h3>Revisión y prevención</h3>
											<p>
												Evaluación de la salud bucal, orientación de higiene y seguimiento
												preventivo.
											</p>
										</div>
									</article>
									<article>
										<span>02</span>
										<div>
											<h3>Limpieza dental</h3>
											<p>
												Atención profesional para ayudar a mantener dientes y encías saludables.
											</p>
										</div>
									</article>
									<article>
										<span>03</span>
										<div>
											<h3>Odontología restauradora</h3>
											<p>Valoración y opciones para tratar caries o reparar piezas dentales.</p>
										</div>
									</article>
									<article>
										<span>04</span>
										<div>
											<h3>Estética dental</h3>
											<p>Consulta sobre alternativas estéticas según tu salud y tus objetivos.</p>
										</div>
									</article>
								</div>
							</div>
							<p className="medical-note">
								Los tratamientos y resultados dependen de una evaluación individual. Esta
								información es general y no sustituye una consulta odontológica.
							</p>
						</section>

						<section className="appointment-band" id="agenda">
							<img
								src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1100&q=85"
								alt="Consultorio dental preparado para recibir pacientes"
								loading="lazy"
							/>
							<div className="appointment-copy">
								<p className="eyebrow">Agenda tu cita</p>
								<h2>El siguiente paso empieza con una conversación.</h2>
								<p>
									Solicita una cita para conocer tus necesidades y conversar con un profesional
									sobre las opciones de cuidado.
								</p>
								<button type="button" className="button button-primary" onClick={goToAppointment}>
									Solicitar cita <span aria-hidden="true">↗</span>
								</button>
							</div>
						</section>

						<section className="contact-section" id="contacto">
							<div>
								<p className="eyebrow">Contáctanos</p>
								<h2>Estamos para orientarte.</h2>
								<p>
									Inicia sesión para revisar tus citas o crea una cuenta para solicitar una primera
									atención. La disponibilidad se confirma durante el proceso de agenda.
								</p>
								<div className="hero-actions">
									<button type="button" className="button button-primary" onClick={goToAppointment}>
										Solicitar cita
									</button>
									<button
										type="button"
										className="button button-outline"
										onClick={() => navigate('login')}
									>
										Acceso de pacientes
									</button>
								</div>
								<p className="source-note">
									Información preventiva consultada en{' '}
									<a
										href="https://www.nhs.uk/live-well/healthy-teeth-and-gums/take-care-of-your-teeth-and-gums/"
										target="_blank"
										rel="noreferrer"
									>
										NHS: cuidado de dientes y encías ↗
									</a>{' '}
									y{' '}
									<a
										href="https://www.who.int/news-room/fact-sheets/detail/oral-health"
										target="_blank"
										rel="noreferrer"
									>
										OMS: salud bucodental ↗
									</a>
									.
								</p>
							</div>
							<img
								src="https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=900&q=85"
								alt="Atención amable en una clínica dental"
								loading="lazy"
							/>
						</section>
					</>
				)}

				{view === 'login' && (
					<section className="form-panel">
						<p className="eyebrow">Acceso MIRADENT</p>
						<h1>Iniciar sesión</h1>
						<p className="form-intro">
							Pacientes y administradores ingresan desde este mismo acceso. El sistema abrirá el
							espacio correspondiente a tu cuenta.
						</p>
						<form className="form-grid" onSubmit={handleLogin}>
							<label>
								Correo electrónico
								<input type="email" name="email" autoComplete="username" required />
							</label>
							<label>
								Contraseña
								<input type="password" name="password" autoComplete="current-password" required />
							</label>
							{loginError && (
								<p className="form-error" role="alert">
									{loginError}
								</p>
							)}
							<button className="button button-primary" type="submit">
								Iniciar sesión
							</button>
						</form>
						<p className="form-switch">
							¿Aún no tienes cuenta?{' '}
							<button type="button" className="text-button" onClick={() => navigate('registro')}>
								Regístrate
							</button>
						</p>
					</section>
				)}

				{view === 'registro' && (
					<RegistroUsuario
						onRegistered={() => setView('citas')}
						onLogin={() => navigate('login')}
					/>
				)}
				{view === 'citas' && currentUser?.role === 'patient' && <AgendarCita />}
				{view === 'admin' && currentUser?.role === 'admin' && <PanelAdmin />}
				{view === 'accesibilidad' && (
					<section
						className="content-section accessibility-page"
						aria-labelledby="accessibility-title"
					>
						<p className="eyebrow">Preferencias de visualización</p>
						<h1 id="accessibility-title">Accesibilidad</h1>
						<p className="form-intro">
							Ajusta la presentación de MIRADENT para que te resulte más cómoda. Los cambios se
							aplican al instante mientras navegas.
						</p>
						<div className="accessibility-controls">
							<section className="accessibility-control-card" aria-labelledby="text-size-title">
								<div>
									<h2 id="text-size-title">Tamaño del contenido</h2>
									<p>Aumenta el tamaño de textos y controles de toda la página.</p>
								</div>
								<div
									className="accessibility-button-group"
									role="group"
									aria-label="Tamaño del contenido"
								>
									{([100, 110, 125] as const).map((size) => (
										<button
											key={size}
											type="button"
											className={
												textSize === size ? 'button button-primary' : 'button button-outline'
											}
											aria-pressed={textSize === size}
											onClick={() => setTextSize(size)}
										>
											{size === 100 ? 'Normal' : `${size}%`}
										</button>
									))}
								</div>
							</section>
							<section className="accessibility-control-card" aria-labelledby="contrast-title">
								<div>
									<h2 id="contrast-title">Alto contraste</h2>
									<p>
										Refuerza la diferencia entre el texto, los fondos y los elementos interactivos.
									</p>
								</div>
								<button
									type="button"
									className={highContrast ? 'button button-primary' : 'button button-outline'}
									aria-pressed={highContrast}
									onClick={() => setHighContrast((enabled) => !enabled)}
								>
									{highContrast ? 'Activado' : 'Activar contraste'}
								</button>
							</section>
							<section className="accessibility-control-card" aria-labelledby="motion-title">
								<div>
									<h2 id="motion-title">Reducir movimiento</h2>
									<p>Desactiva animaciones y transiciones decorativas de la página.</p>
								</div>
								<button
									type="button"
									className={reducedMotion ? 'button button-primary' : 'button button-outline'}
									aria-pressed={reducedMotion}
									onClick={() => setReducedMotion((enabled) => !enabled)}
								>
									{reducedMotion ? 'Activado' : 'Reducir movimiento'}
								</button>
							</section>
						</div>
						<button
							type="button"
							className="button button-quiet accessibility-reset"
							onClick={() => {
								setTextSize(100)
								setHighContrast(false)
								setReducedMotion(false)
							}}
						>
							Restablecer preferencias
						</button>
					</section>
				)}
			</main>
			<footer className="site-footer">
				<span>© {new Date().getFullYear()} Miradent Clínica Dental</span>
				<span>Atención cercana, sonrisas duraderas.</span>
			</footer>
		</div>
	)
}
