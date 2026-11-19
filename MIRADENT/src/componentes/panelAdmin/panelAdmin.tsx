import { useState, type FormEvent } from 'react'
import { useMiradent, type AppointmentStatus, type Dentist, type UserRole } from '../../context'

type AdminPage =
	| 'resumen'
	| 'citas'
	| 'notificaciones'
	| 'servicios'
	| 'especialidades'
	| 'odontologos'
	| 'usuarios'
	| 'horarios'
	| 'perfil'
type AppointmentFilter = 'Todas' | 'Activas' | AppointmentStatus

function isUserRole(value: string): value is UserRole {
	return value === 'patient' || value === 'dentist' || value === 'admin'
}

const appointmentStatuses: AppointmentStatus[] = [
	'Pendiente',
	'Confirmada',
	'Completada',
	'Cancelada',
]

function getLocalDateString(date: Date) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

function toMinutes(time: string) {
	const [hours, minutes] = time.split(':').map(Number)
	return hours * 60 + minutes
}

export default function PanelAdmin() {
	const {
		currentUser,
		users,
		appointments,
		services,
		availability,
		availabilityBlocks,
		dentists,
		specialties,
		notifications,
		updateAppointmentStatus,
		markNotificationRead,
		addService,
		renameService,
		removeService,
		generateMonthlyAvailability,
		addAvailabilitySlot,
		removeAvailabilitySlot,
		addAvailabilityBlock,
		removeAvailabilityBlock,
		addDentist,
		updateDentist,
		removeDentist,
		addSpecialty,
		renameSpecialty,
		removeSpecialty,
		updateAccountRole,
		updateProfile,
	} = useMiradent()
	const initialScheduleSpecialty = specialties[0] ?? ''
	const [page, setPage] = useState<AdminPage>('resumen')
	const [filter, setFilter] = useState<AppointmentFilter>('Todas')
	const [serviceName, setServiceName] = useState('')
	const [serviceDuration, setServiceDuration] = useState(30)
	const [serviceSpecialty, setServiceSpecialty] = useState(specialties[0] ?? 'Odontología general')
	const [serviceMessage, setServiceMessage] = useState('')
	const [editingService, setEditingService] = useState<string | null>(null)
	const [editedServiceName, setEditedServiceName] = useState('')
	const [editedServiceDuration, setEditedServiceDuration] = useState(30)
	const [editedServiceSpecialty, setEditedServiceSpecialty] = useState(
		specialties[0] ?? 'Odontología general',
	)
	const [scheduleMessage, setScheduleMessage] = useState('')
	const [scheduleMonth, setScheduleMonth] = useState(() =>
		getLocalDateString(new Date()).slice(0, 7),
	)
	const [scheduleSpecialty, setScheduleSpecialty] = useState(initialScheduleSpecialty)
	const [scheduleDentistId, setScheduleDentistId] = useState(
		dentists.find((dentist) => dentist.specialties.includes(initialScheduleSpecialty))?.id ?? '',
	)
	const [scheduleWeekdays, setScheduleWeekdays] = useState([1, 2, 3, 4, 5])
	const [selectedScheduleDate, setSelectedScheduleDate] = useState(() =>
		getLocalDateString(new Date()),
	)
	const [dentistMessage, setDentistMessage] = useState('')
	const [editingDentistId, setEditingDentistId] = useState<string | null>(null)
	const [dentistForm, setDentistForm] = useState({
		name: '',
		specialties: [specialties[0] ?? 'Odontología general'],
		startTime: '08:00',
		endTime: '18:00',
	})
	const [specialtyMessage, setSpecialtyMessage] = useState('')
	const [specialtyName, setSpecialtyName] = useState('')
	const [editingSpecialty, setEditingSpecialty] = useState<string | null>(null)
	const [editedSpecialtyName, setEditedSpecialtyName] = useState('')
	const [userMessage, setUserMessage] = useState('')
	const [profileMessage, setProfileMessage] = useState('')
	const [profile, setProfile] = useState({
		name: currentUser?.name ?? '',
		email: currentUser?.email ?? '',
		phone: currentUser?.phone ?? '',
		password: '',
	})
	const today = getLocalDateString(new Date())
	const activeAppointments = appointments.filter(
		(appointment) => appointment.status === 'Pendiente' || appointment.status === 'Confirmada',
	)
	const completedAppointments = appointments.filter(
		(appointment) => appointment.status === 'Completada',
	)
	const cancelledAppointments = appointments.filter(
		(appointment) => appointment.status === 'Cancelada',
	)
	const unreadCount = notifications.filter((notification) => !notification.read).length
	const sortedAppointments = [...appointments]
		.filter((appointment) => {
			if (filter === 'Activas')
				return appointment.status === 'Pendiente' || appointment.status === 'Confirmada'
			return filter === 'Todas' || appointment.status === filter
		})
		.sort((first, second) =>
			`${second.date}${second.time}`.localeCompare(`${first.date}${first.time}`),
		)
	const sortedNotifications = [...notifications].sort((first, second) =>
		second.createdAt.localeCompare(first.createdAt),
	)
	const sortedAvailability = [...availability].sort((first, second) =>
		`${first.date}${first.time}`.localeCompare(`${second.date}${second.time}`),
	)
	const scheduleDentists = dentists.filter((dentist) =>
		dentist.specialties.includes(scheduleSpecialty),
	)
	const availabilityForMonth = sortedAvailability.filter(
		(slot) => slot.date.startsWith(scheduleMonth) && slot.dentistId === scheduleDentistId,
	)
	const availabilityForSelectedDate = availabilityForMonth.filter(
		(slot) => slot.date === selectedScheduleDate,
	)
	const blocksForSelectedDate = availabilityBlocks
		.filter(
			(block) =>
				block.date === selectedScheduleDate &&
				(!block.dentistId || block.dentistId === scheduleDentistId),
		)
		.sort((first, second) => first.startTime.localeCompare(second.startTime))
	const calendarMonth = /^\d{4}-\d{2}$/.test(scheduleMonth) ? scheduleMonth : today.slice(0, 7)
	const [scheduleYear, scheduleMonthNumber] = calendarMonth.split('-').map(Number)
	const firstWeekday = (new Date(scheduleYear, scheduleMonthNumber - 1, 1).getDay() + 6) % 7
	const daysInScheduleMonth = new Date(scheduleYear, scheduleMonthNumber, 0).getDate()
	const calendarDays: (string | null)[] = [
		...Array.from({ length: firstWeekday }, () => null),
		...Array.from({ length: daysInScheduleMonth }, (_, index) =>
			getLocalDateString(new Date(scheduleYear, scheduleMonthNumber - 1, index + 1)),
		),
	]
	const calendarWeeks = Array.from({ length: Math.ceil(calendarDays.length / 7) }, (_, week) =>
		calendarDays.slice(week * 7, week * 7 + 7),
	)

	function hasActiveAppointmentAtSlot(slot: (typeof availability)[number]) {
		const slotStart = toMinutes(slot.time)
		return appointments.some(
			(appointment) =>
				appointment.date === slot.date &&
				appointment.dentistId === slot.dentistId &&
				appointment.status !== 'Cancelada' &&
				slotStart < toMinutes(appointment.endTime) &&
				slotStart + 30 > toMinutes(appointment.time),
		)
	}

	function getAvailabilityBlock(slot: (typeof availability)[number]) {
		const slotStart = toMinutes(slot.time)
		return availabilityBlocks.find(
			(block) =>
				block.date === slot.date &&
				(!block.dentistId || block.dentistId === slot.dentistId) &&
				slotStart < toMinutes(block.endTime) &&
				slotStart + 30 > toMinutes(block.startTime),
		)
	}

	function shiftScheduleMonth(offset: number) {
		const nextMonth = new Date(scheduleYear, scheduleMonthNumber - 1 + offset, 1)
		const nextMonthString = getLocalDateString(nextMonth).slice(0, 7)
		setScheduleMonth(nextMonthString)
		setSelectedScheduleDate(`${nextMonthString}-01`)
	}

	function handleAddService(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		try {
			addService(serviceName, serviceDuration, serviceSpecialty)
			setServiceName('')
			setServiceDuration(30)
			setServiceMessage('Servicio agregado correctamente.')
		} catch (reason) {
			setServiceMessage(
				reason instanceof Error ? reason.message : 'No se pudo agregar el servicio.',
			)
		}
	}

	function handleAddAvailability(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		const form = new FormData(event.currentTarget)
		try {
			addAvailabilitySlot(
				String(form.get('date')),
				String(form.get('time')),
				String(form.get('dentistId')),
			)
			event.currentTarget.reset()
			setScheduleMessage('Horario agregado a la agenda.')
		} catch (reason) {
			setScheduleMessage(
				reason instanceof Error ? reason.message : 'No se pudo agregar el horario.',
			)
		}
	}

	function handleAddAvailabilityBlock(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		const form = new FormData(event.currentTarget)
		try {
			addAvailabilityBlock(
				String(form.get('date')),
				String(form.get('startTime')),
				String(form.get('endTime')),
				String(form.get('dentistId') ?? '') || null,
				String(form.get('reason')),
			)
			event.currentTarget.reset()
			setScheduleMessage('Bloqueo guardado. Los pacientes ya no verán esos horarios.')
		} catch (reason) {
			setScheduleMessage(
				reason instanceof Error ? reason.message : 'No se pudo guardar el bloqueo.',
			)
		}
	}

	function handleRemoveAvailabilityBlock(id: string) {
		removeAvailabilityBlock(id)
		setScheduleMessage('Bloqueo eliminado; los horarios vuelven a estar disponibles.')
	}

	function handleGenerateMonthlyAvailability(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		try {
			const count = generateMonthlyAvailability(scheduleMonth, scheduleDentistId, scheduleWeekdays)
			setScheduleMessage(
				`${count} horarios publicados para ${dentists.find((dentist) => dentist.id === scheduleDentistId)?.name ?? 'el odontólogo'} en ${new Date(`${scheduleMonth}-01T00:00:00`).toLocaleDateString('es', { month: 'long', year: 'numeric' })}.`,
			)
		} catch (reason) {
			setScheduleMessage(
				reason instanceof Error ? reason.message : 'No se pudieron publicar los horarios.',
			)
		}
	}

	function handleAddDentist(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		try {
			if (editingDentistId) {
				updateDentist(editingDentistId, dentistForm)
				setDentistMessage('Ficha de odontólogo actualizada correctamente.')
			} else {
				addDentist(dentistForm)
				setDentistMessage('Odontólogo agregado correctamente.')
			}
			setEditingDentistId(null)
			setDentistForm({
				name: '',
				specialties: [specialties[0] ?? 'Odontología general'],
				startTime: '08:00',
				endTime: '18:00',
			})
		} catch (reason) {
			setDentistMessage(
				reason instanceof Error ? reason.message : 'No se pudo agregar el odontólogo.',
			)
		}
	}

	function handleEditDentist(dentist: Dentist) {
		setEditingDentistId(dentist.id)
		setDentistForm({
			name: dentist.name,
			specialties: dentist.specialties,
			startTime: dentist.startTime,
			endTime: dentist.endTime,
		})
		setDentistMessage('')
	}

	function handleRemoveDentist(id: string) {
		try {
			removeDentist(id)
			setDentistMessage('Odontólogo eliminado.')
		} catch (reason) {
			setDentistMessage(
				reason instanceof Error ? reason.message : 'No se pudo eliminar el odontólogo.',
			)
		}
	}

	function handleAddSpecialty(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		try {
			addSpecialty(specialtyName)
			setSpecialtyName('')
			setSpecialtyMessage('Especialidad agregada correctamente.')
		} catch (reason) {
			setSpecialtyMessage(
				reason instanceof Error ? reason.message : 'No se pudo agregar la especialidad.',
			)
		}
	}

	function handleRenameSpecialty(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		if (!editingSpecialty) return
		try {
			renameSpecialty(editingSpecialty, editedSpecialtyName)
			setServiceSpecialty((value) =>
				value === editingSpecialty ? editedSpecialtyName.trim() : value,
			)
			setEditedServiceSpecialty((value) =>
				value === editingSpecialty ? editedSpecialtyName.trim() : value,
			)
			setScheduleSpecialty((value) =>
				value === editingSpecialty ? editedSpecialtyName.trim() : value,
			)
			setDentistForm((current) => ({
				...current,
				specialties: current.specialties.map((value) =>
					value === editingSpecialty ? editedSpecialtyName.trim() : value,
				),
			}))
			setEditingSpecialty(null)
			setSpecialtyMessage('Especialidad actualizada y vinculaciones conservadas.')
		} catch (reason) {
			setSpecialtyMessage(
				reason instanceof Error ? reason.message : 'No se pudo actualizar la especialidad.',
			)
		}
	}

	function handleRemoveSpecialty(specialty: string) {
		try {
			removeSpecialty(specialty)
			setSpecialtyMessage('Especialidad eliminada.')
		} catch (reason) {
			setSpecialtyMessage(
				reason instanceof Error ? reason.message : 'No se pudo eliminar la especialidad.',
			)
		}
	}

	function handleUpdateAccountRole(event: FormEvent<HTMLFormElement>, userId: string) {
		event.preventDefault()
		const form = new FormData(event.currentTarget)
		const role = String(form.get('role'))
		if (!isUserRole(role)) {
			setUserMessage('Selecciona un rol válido.')
			return
		}
		try {
			updateAccountRole(userId, role, String(form.get('dentistId') ?? '') || undefined)
			setUserMessage('Rol de cuenta actualizado correctamente.')
		} catch (reason) {
			setUserMessage(
				reason instanceof Error ? reason.message : 'No se pudo actualizar el rol de la cuenta.',
			)
		}
	}

	function handleUpdateProfile(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		try {
			updateProfile({
				name: profile.name,
				email: profile.email,
				phone: profile.phone,
				...(profile.password ? { password: profile.password } : {}),
			})
			setProfile((current) => ({ ...current, password: '' }))
			setProfileMessage('Perfil actualizado correctamente.')
		} catch (reason) {
			setProfileMessage(
				reason instanceof Error ? reason.message : 'No se pudo actualizar el perfil.',
			)
		}
	}

	function removeManagedService(service: string) {
		if (
			!window.confirm(
				`¿Quieres eliminar el servicio «${service}»? Las citas anteriores conservarán su historial.`,
			)
		)
			return
		removeService(service)
		setServiceMessage('Servicio eliminado. El historial de citas se conserva.')
	}

	function handleRenameService(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		if (!editingService) return
		try {
			renameService(
				editingService,
				editedServiceName,
				editedServiceDuration,
				editedServiceSpecialty,
			)
			setEditingService(null)
			setEditedServiceName('')
			setServiceMessage('Servicio actualizado correctamente.')
		} catch (reason) {
			setServiceMessage(
				reason instanceof Error ? reason.message : 'No se pudo actualizar el servicio.',
			)
		}
	}

	function handleRemoveAvailability(id: string) {
		try {
			removeAvailabilitySlot(id)
			setScheduleMessage('Horario eliminado.')
		} catch (reason) {
			setScheduleMessage(
				reason instanceof Error ? reason.message : 'No se pudo eliminar el horario.',
			)
		}
	}

	function showAppointments(nextFilter: AppointmentFilter) {
		setFilter(nextFilter)
		setPage('citas')
	}

	return (
		<section className="content-section admin-section">
			<p className="eyebrow">Gestión de clínica</p>
			<h1>¡Bienvenido, {currentUser?.name ?? 'administrador'}!</h1>
			<p className="form-intro">
				Desde aquí puedes organizar las citas, servicios y horarios de Miradent.
			</p>

			<nav className="admin-tabs" aria-label="Secciones de administración">
				{(
					[
						['resumen', 'Resumen'],
						['citas', 'Citas'],
						['notificaciones', `Notificaciones${unreadCount ? ` (${unreadCount})` : ''}`],
						['servicios', 'Servicios'],
						['especialidades', 'Especialidades'],
						['odontologos', 'Odontólogos'],
						['usuarios', 'Cuentas y roles'],
						['horarios', 'Horarios'],
						['perfil', 'Mi perfil'],
					] as [AdminPage, string][]
				).map(([id, label]) => (
					<button
						key={id}
						type="button"
						className={page === id ? 'admin-tab active' : 'admin-tab'}
						onClick={() => setPage(id)}
						aria-current={page === id ? 'page' : undefined}
					>
						{label}
					</button>
				))}
			</nav>

			{page === 'resumen' && (
				<>
					<div className="admin-dashboard-cards">
						<button
							type="button"
							className="admin-metric"
							onClick={() => showAppointments('Activas')}
						>
							<span>Citas activas</span>
							<strong>{activeAppointments.length}</strong>
							<small>Pendientes o confirmadas</small>
						</button>
						<button
							type="button"
							className="admin-metric"
							onClick={() => showAppointments('Completada')}
						>
							<span>Citas completadas</span>
							<strong>{completedAppointments.length}</strong>
							<small>Atenciones finalizadas</small>
						</button>
						<button
							type="button"
							className="admin-metric"
							onClick={() => showAppointments('Cancelada')}
						>
							<span>Citas canceladas</span>
							<strong>{cancelledAppointments.length}</strong>
							<small>Solicitudes canceladas</small>
						</button>
					</div>
					<div className="admin-overview-grid">
						<article className="admin-overview-card">
							<p className="eyebrow">Atención</p>
							<h2>Próximas citas activas</h2>
							{activeAppointments.length === 0 ? (
								<p className="empty-state">No tienes citas activas por el momento.</p>
							) : (
								<div className="admin-mini-list">
									{[...activeAppointments]
										.sort((first, second) =>
											`${first.date}${first.time}`.localeCompare(`${second.date}${second.time}`),
										)
										.slice(0, 5)
										.map((appointment) => (
											<div className="admin-mini-row" key={appointment.id}>
												<div>
													<strong>{appointment.patientName}</strong>
													<span>{appointment.service}</span>
												</div>
												<span>
													{new Date(`${appointment.date}T00:00:00`).toLocaleDateString('es')} ·{' '}
													{appointment.time}–{appointment.endTime}
												</span>
											</div>
										))}
								</div>
							)}
							<button
								type="button"
								className="button button-quiet"
								onClick={() => showAppointments('Activas')}
							>
								Ver citas activas
							</button>
						</article>
						<article className="admin-overview-card">
							<p className="eyebrow">Avisos</p>
							<h2>Notificaciones nuevas</h2>
							<p className="admin-notification-count">
								{unreadCount} {unreadCount === 1 ? 'aviso sin leer' : 'avisos sin leer'}
							</p>
							<p>Revisa las solicitudes nuevas para dar seguimiento a tus pacientes.</p>
							<button
								type="button"
								className="button button-outline"
								onClick={() => setPage('notificaciones')}
							>
								Ver notificaciones
							</button>
						</article>
					</div>
				</>
			)}

			{page === 'citas' && (
				<>
					<div className="section-heading admin-heading">
						<div>
							<p className="eyebrow">Agenda</p>
							<h2>Gestión de citas</h2>
						</div>
						<label className="filter-control">
							Estado
							<select
								value={filter}
								onChange={(event) => setFilter(event.target.value as AppointmentFilter)}
							>
								<option value="Todas">Todas</option>
								<option value="Activas">Activas</option>
								{appointmentStatuses.map((status) => (
									<option key={status} value={status}>
										{status}
									</option>
								))}
							</select>
						</label>
					</div>
					{sortedAppointments.length === 0 ? (
						<p className="empty-state">
							No hay citas{' '}
							{filter === 'Todas' ? 'registradas' : `con estado «${filter.toLowerCase()}»`}.
						</p>
					) : (
						<div className="admin-table-wrap">
							<table className="admin-table">
								<thead>
									<tr>
										<th>Paciente</th>
										<th>Tratamiento</th>
										<th>Odontólogo</th>
										<th>Fecha y hora</th>
										<th>Contacto</th>
										<th>Estado</th>
									</tr>
								</thead>
								<tbody>
									{sortedAppointments.map((appointment) => (
										<tr key={appointment.id}>
											<td>
												<strong>{appointment.patientName}</strong>
												{appointment.notes && <small>{appointment.notes}</small>}
											</td>
											<td>{appointment.service}</td>
											<td>{appointment.dentistName}</td>
											<td>
												{new Date(`${appointment.date}T00:00:00`).toLocaleDateString('es')}
												<br />
												{appointment.time}–{appointment.endTime} ·{' '}
												{appointment.chairId.replace('chair-', 'Silla ')}
											</td>
											<td>
												<a href={`mailto:${appointment.email}`}>{appointment.email}</a>
												<br />
												{appointment.phone && (
													<a href={`tel:${appointment.phone}`}>{appointment.phone}</a>
												)}
											</td>
											<td>
												<select
													className={`status-select status-${appointment.status.toLowerCase()}`}
													aria-label={`Estado de la cita de ${appointment.patientName}`}
													value={appointment.status}
													onChange={(event) =>
														updateAppointmentStatus(
															appointment.id,
															event.target.value as AppointmentStatus,
														)
													}
												>
													{appointmentStatuses.map((status) => (
														<option key={status}>{status}</option>
													))}
												</select>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</>
			)}

			{page === 'notificaciones' && (
				<section className="admin-management">
					<div className="section-heading admin-heading">
						<div>
							<p className="eyebrow">Seguimiento</p>
							<h2>Notificaciones</h2>
						</div>
						<span className="admin-notification-count">{unreadCount} sin leer</span>
					</div>
					{sortedNotifications.length === 0 ? (
						<p className="empty-state">
							Todavía no hay notificaciones. Las nuevas solicitudes de cita aparecerán aquí.
						</p>
					) : (
						<div className="admin-notification-list">
							{sortedNotifications.map((notification) => (
								<article
									className={notification.read ? 'admin-notification read' : 'admin-notification'}
									key={notification.id}
								>
									<div>
										<strong>{notification.message}</strong>
										<span>{new Date(notification.createdAt).toLocaleString('es')}</span>
									</div>
									{!notification.read && (
										<button
											type="button"
											className="button button-outline"
											onClick={() => markNotificationRead(notification.id)}
										>
											Marcar como leída
										</button>
									)}
								</article>
							))}
						</div>
					)}
				</section>
			)}

			{page === 'servicios' && (
				<section className="admin-management">
					<div className="section-heading admin-heading">
						<div>
							<p className="eyebrow">Catálogo</p>
							<h2>Gestión de servicios</h2>
						</div>
					</div>
					<p className="admin-help">
						Configura la duración real de cada servicio. Esta duración determina la hora de
						finalización y la disponibilidad de odontólogo y silla.
					</p>
					<form className="admin-inline-form" onSubmit={handleAddService}>
						<label>
							Nuevo servicio
							<input
								value={serviceName}
								onChange={(event) => setServiceName(event.target.value)}
								maxLength={80}
								required
								placeholder="Ej. Consulta de evaluación"
							/>
						</label>
						<label>
							Duración (minutos)
							<input
								type="number"
								min="1"
								max="480"
								value={serviceDuration}
								onChange={(event) => setServiceDuration(Number(event.target.value))}
								required
							/>
						</label>
						<label>
							Especialidad
							<select
								value={serviceSpecialty}
								onChange={(event) => setServiceSpecialty(event.target.value)}
								required
							>
								{specialties.map((specialty) => (
									<option key={specialty}>{specialty}</option>
								))}
							</select>
						</label>
						<button className="button button-primary" type="submit">
							Agregar servicio
						</button>
					</form>
					{serviceMessage && (
						<p className="form-note" role="status">
							{serviceMessage}
						</p>
					)}
					{services.length === 0 ? (
						<p className="empty-state">
							No hay servicios activos. Agrega uno para que los pacientes puedan solicitar citas.
						</p>
					) : (
						<ul className="admin-manage-list">
							{services.map((service) => (
								<li key={service.name}>
									{editingService === service.name ? (
										<form className="admin-edit-service" onSubmit={handleRenameService}>
											<input
												aria-label="Nombre del servicio"
												value={editedServiceName}
												onChange={(event) => setEditedServiceName(event.target.value)}
												maxLength={80}
												required
												autoFocus
											/>
											<label>
												Duración (minutos)
												<input
													type="number"
													min="1"
													max="480"
													value={editedServiceDuration}
													onChange={(event) => setEditedServiceDuration(Number(event.target.value))}
													required
												/>
											</label>
											<label>
												Especialidad
												<select
													value={editedServiceSpecialty}
													onChange={(event) => setEditedServiceSpecialty(event.target.value)}
													required
												>
													{specialties.map((specialty) => (
														<option key={specialty}>{specialty}</option>
													))}
												</select>
											</label>
											<button type="submit" className="button button-primary">
												Guardar
											</button>
											<button
												type="button"
												className="button button-quiet"
												onClick={() => {
													setEditingService(null)
													setEditedServiceName('')
												}}
											>
												Cancelar
											</button>
										</form>
									) : (
										<>
											<span>
												{service.name} · {service.durationMinutes} min · {service.specialty}
											</span>
											<div className="admin-list-actions">
												<button
													type="button"
													className="button button-quiet"
													onClick={() => {
														setEditingService(service.name)
														setEditedServiceName(service.name)
														setEditedServiceDuration(service.durationMinutes)
														setEditedServiceSpecialty(service.specialty)
													}}
												>
													Editar
												</button>
												<button
													type="button"
													className="button button-quiet"
													onClick={() => removeManagedService(service.name)}
												>
													Eliminar
												</button>
											</div>
										</>
									)}
								</li>
							))}
						</ul>
					)}
				</section>
			)}

			{page === 'odontologos' && (
				<section className="admin-management">
					<div className="section-heading admin-heading">
						<div>
							<p className="eyebrow">Equipo clínico</p>
							<h2>Gestión de odontólogos</h2>
						</div>
					</div>
					<p className="admin-help">
						Registra los odontólogos, sus especialidades y su jornada. La clínica atiende de 08:00 a
						12:00 y de 13:30 a 18:00.
					</p>
					<form className="admin-inline-form dentist-form" onSubmit={handleAddDentist}>
						<label>
							Nombre
							<input
								value={dentistForm.name}
								onChange={(event) =>
									setDentistForm((current) => ({ ...current, name: event.target.value }))
								}
								required
								placeholder="Nombre del odontólogo"
							/>
						</label>
						<label>
							Especialidades
							<select
								multiple
								size={specialties.length}
								value={dentistForm.specialties}
								onChange={(event) => {
									const selectedSpecialties = Array.from(
										event.currentTarget.selectedOptions,
										(option) => option.value,
									)
									setDentistForm((current) => ({
										...current,
										specialties: selectedSpecialties,
									}))
								}}
							>
								{specialties.map((specialty) => (
									<option key={specialty} value={specialty}>
										{specialty}
									</option>
								))}
							</select>
							<small>Usa Ctrl (Windows) para seleccionar más de una.</small>
						</label>
						<label>
							Desde
							<input
								type="time"
								min="08:00"
								max="17:59"
								value={dentistForm.startTime}
								onChange={(event) =>
									setDentistForm((current) => ({ ...current, startTime: event.target.value }))
								}
								required
							/>
						</label>
						<label>
							Hasta
							<input
								type="time"
								min="08:01"
								max="18:00"
								value={dentistForm.endTime}
								onChange={(event) =>
									setDentistForm((current) => ({ ...current, endTime: event.target.value }))
								}
								required
							/>
						</label>
						<button
							className="button button-primary"
							type="submit"
							disabled={specialties.length === 0}
						>
							{editingDentistId ? 'Guardar cambios' : 'Agregar odontólogo'}
						</button>
						{editingDentistId && (
							<button
								className="button button-quiet"
								type="button"
								onClick={() => {
									setEditingDentistId(null)
									setDentistForm({
										name: '',
										specialties: [specialties[0] ?? 'Odontología general'],
										startTime: '08:00',
										endTime: '18:00',
									})
								}}
							>
								Cancelar edición
							</button>
						)}
					</form>
					{dentistMessage && (
						<p className="form-note" role="status">
							{dentistMessage}
						</p>
					)}
					<ul className="admin-manage-list">
						{dentists.map((dentist) => (
							<li key={dentist.id}>
								<span>
									<strong>
										{dentist.name} · ID {dentist.id}
									</strong>
									<small>
										{dentist.specialties.join(', ')} · {dentist.startTime} a {dentist.endTime}
									</small>
								</span>
								<div className="admin-list-actions">
									<button
										type="button"
										className="button button-quiet"
										onClick={() => handleEditDentist(dentist)}
									>
										Editar
									</button>
									<button
										type="button"
										className="button button-quiet"
										onClick={() => handleRemoveDentist(dentist.id)}
									>
										Eliminar
									</button>
								</div>
							</li>
						))}
					</ul>
					{dentists.length === 0 && (
						<p className="empty-state">Todavía no hay odontólogos registrados.</p>
					)}
				</section>
			)}

			{page === 'especialidades' && (
				<section className="admin-management">
					<div className="section-heading admin-heading">
						<div>
							<p className="eyebrow">Catálogo clínico</p>
							<h2>Especialidades</h2>
						</div>
					</div>
					<p className="admin-help">
						Administra las áreas disponibles. Al renombrar una especialidad, los odontólogos y
						servicios vinculados se actualizan automáticamente. Para eliminarla primero quítala de
						los odontólogos y servicios que la utilizan.
					</p>
					<form className="admin-inline-form" onSubmit={handleAddSpecialty}>
						<label>
							Nueva especialidad
							<input
								value={specialtyName}
								onChange={(event) => setSpecialtyName(event.target.value)}
								maxLength={80}
								required
								placeholder="Ej. Cirugía oral"
							/>
						</label>
						<button className="button button-primary" type="submit">
							Agregar especialidad
						</button>
					</form>
					{specialtyMessage && (
						<p className="form-note" role="status">
							{specialtyMessage}
						</p>
					)}
					<ul className="admin-manage-list">
						{specialties.map((specialty) => (
							<li key={specialty}>
								{editingSpecialty === specialty ? (
									<form className="admin-edit-service" onSubmit={handleRenameSpecialty}>
										<input
											aria-label="Nombre de la especialidad"
											value={editedSpecialtyName}
											onChange={(event) => setEditedSpecialtyName(event.target.value)}
											maxLength={80}
											required
											autoFocus
										/>
										<button type="submit" className="button button-primary">
											Guardar
										</button>
										<button
											type="button"
											className="button button-quiet"
											onClick={() => setEditingSpecialty(null)}
										>
											Cancelar
										</button>
									</form>
								) : (
									<>
										<span>
											<strong>{specialty}</strong>
											<small>
												{
													dentists.filter((dentist) => dentist.specialties.includes(specialty))
														.length
												}{' '}
												odontólogos ·{' '}
												{services.filter((service) => service.specialty === specialty).length}{' '}
												servicios
											</small>
										</span>
										<div className="admin-list-actions">
											<button
												type="button"
												className="button button-quiet"
												onClick={() => {
													setEditingSpecialty(specialty)
													setEditedSpecialtyName(specialty)
												}}
											>
												Editar
											</button>
											<button
												type="button"
												className="button button-quiet"
												onClick={() => handleRemoveSpecialty(specialty)}
											>
												Eliminar
											</button>
										</div>
									</>
								)}
							</li>
						))}
					</ul>
				</section>
			)}

			{page === 'usuarios' && (
				<section className="admin-management">
					<div className="section-heading admin-heading">
						<div>
							<p className="eyebrow">Acceso al sistema</p>
							<h2>Cuentas y roles</h2>
						</div>
					</div>
					<p className="admin-help">
						El registro público crea cuentas de paciente. Desde aquí puedes cambiar el rol y
						vincular una cuenta de odontólogo con su ficha clínica. Las contraseñas no se muestran.
						Para proteger el acceso, no puedes cambiar tu propio rol ni quitar el último
						administrador.
					</p>
					{userMessage && (
						<p className="form-note" role="status">
							{userMessage}
						</p>
					)}
					<ul className="admin-manage-list account-manage-list">
						{users.map((user) => {
							const isCurrentUser = user.id === currentUser?.id
							const linkedDentistIds = new Set(
								users
									.filter((account) => account.id !== user.id && account.role === 'dentist')
									.map((account) => account.dentistId),
							)
							return (
								<li key={user.id}>
									<span>
										<strong>{user.name}</strong>
										<small>
											{user.email} · {user.phone || 'Sin teléfono'}
										</small>
									</span>
									<form
										className="account-role-form"
										onSubmit={(event) => handleUpdateAccountRole(event, user.id)}
									>
										<label>
											Rol
											<select name="role" defaultValue={user.role} disabled={isCurrentUser}>
												<option value="patient">Paciente</option>
												<option value="dentist">Odontólogo</option>
												<option value="admin">Administrador</option>
											</select>
										</label>
										<label>
											Ficha de odontólogo
											<select
												name="dentistId"
												defaultValue={user.dentistId ?? ''}
												disabled={isCurrentUser || dentists.length === 0}
											>
												<option value="">Sin vincular</option>
												{dentists
													.filter(
														(dentist) =>
															!linkedDentistIds.has(dentist.id) || user.dentistId === dentist.id,
													)
													.map((dentist) => (
														<option key={dentist.id} value={dentist.id}>
															{dentist.name} · ID {dentist.id}
														</option>
													))}
											</select>
										</label>
										<button
											className="button button-primary"
											type="submit"
											disabled={isCurrentUser}
										>
											{isCurrentUser ? 'Cuenta actual' : 'Guardar rol'}
										</button>
									</form>
								</li>
							)
						})}
					</ul>
					{users.length === 0 && <p className="empty-state">No hay cuentas registradas.</p>}
				</section>
			)}

			{page === 'horarios' && (
				<section className="admin-management">
					<div className="section-heading admin-heading">
						<div>
							<p className="eyebrow">Agenda</p>
							<h2>Gestión de horarios</h2>
						</div>
					</div>
					<p className="admin-help">
						La clínica atiende de 08:00 a 12:00 y de 13:30 a 18:00; el almuerzo queda bloqueado
						automáticamente. Publica los turnos de cada odontólogo y especialidad por mes. Los
						pacientes solo verán las fechas y horas que caben según la duración de su tratamiento y
						las dos sillas.
					</p>
					<form
						className="admin-inline-form monthly-schedule-form"
						onSubmit={handleGenerateMonthlyAvailability}
					>
						<label>
							Área / especialidad
							<select
								value={scheduleSpecialty}
								onChange={(event) => {
									const specialty = event.target.value
									setScheduleSpecialty(specialty)
									setScheduleDentistId(
										dentists.find((dentist) => dentist.specialties.includes(specialty))?.id ?? '',
									)
								}}
								required
							>
								<option value="" disabled>
									Selecciona un área
								</option>
								{specialties.map((specialty) => (
									<option key={specialty}>{specialty}</option>
								))}
							</select>
						</label>
						<label>
							Odontólogo
							<select
								value={scheduleDentistId}
								onChange={(event) => setScheduleDentistId(event.target.value)}
								required
							>
								<option value="" disabled>
									Selecciona un odontólogo
								</option>
								{scheduleDentists.map((dentist) => (
									<option key={dentist.id} value={dentist.id}>
										{dentist.name} · ID {dentist.id} · {dentist.startTime}–{dentist.endTime}
									</option>
								))}
							</select>
						</label>
						<label>
							Mes de agenda
							<input
								type="month"
								min={today.slice(0, 7)}
								value={scheduleMonth}
								onChange={(event) => {
									const month = event.target.value
									setScheduleMonth(month)
									setSelectedScheduleDate(`${month}-01`)
								}}
								required
							/>
						</label>
						<fieldset className="weekday-picker">
							<legend>Días de atención</legend>
							{[
								['Lun', 1],
								['Mar', 2],
								['Mié', 3],
								['Jue', 4],
								['Vie', 5],
								['Sáb', 6],
								['Dom', 7],
							].map(([label, weekday]) => (
								<label key={weekday}>
									<input
										type="checkbox"
										checked={scheduleWeekdays.includes(Number(weekday))}
										onChange={(event) =>
											setScheduleWeekdays((current) =>
												event.target.checked
													? [...current, Number(weekday)].sort()
													: current.filter((day) => day !== Number(weekday)),
											)
										}
									/>
									{label}
								</label>
							))}
						</fieldset>
						<button
							className="button button-primary"
							type="submit"
							disabled={!scheduleDentistId || !scheduleMonth}
						>
							Publicar mes
						</button>
					</form>
					<p className="admin-help">
						Se crean turnos cada 30 minutos, de lunes a viernes por defecto. Puedes ajustar los días
						antes de publicar; los espacios de almuerzo no se generan.
					</p>
					<h3 className="schedule-subheading">Agregar un turno puntual</h3>
					<form className="admin-inline-form schedule-form" onSubmit={handleAddAvailability}>
						<label>
							Odontólogo
							<select name="dentistId" required defaultValue="">
								<option value="" disabled>
									Selecciona odontólogo
								</option>
								{dentists.map((dentist) => (
									<option key={dentist.id} value={dentist.id}>
										{dentist.name} · ID {dentist.id} ({dentist.startTime}–{dentist.endTime})
									</option>
								))}
							</select>
						</label>
						<label>
							Fecha
							<input type="date" name="date" min={today} required />
						</label>
						<label>
							Hora
							<input type="time" name="time" min="08:00" max="17:59" required />
						</label>
						<button className="button button-primary" type="submit">
							Agregar horario
						</button>
					</form>
					<h3 className="schedule-subheading">Bloquear un rango u horario festivo</h3>
					<p className="admin-help">
						Bloquea un odontólogo o toda la clínica. El bloqueo impide reservas que se crucen con
						ese rango y no se permite si ya hay una cita.
					</p>
					<form
						className="admin-inline-form schedule-block-form"
						onSubmit={handleAddAvailabilityBlock}
					>
						<label>
							A quién aplica
							<select name="dentistId" defaultValue="">
								<option value="">Toda la clínica</option>
								{dentists.map((dentist) => (
									<option key={dentist.id} value={dentist.id}>
										{dentist.name}
									</option>
								))}
							</select>
						</label>
						<label>
							Fecha
							<input type="date" name="date" min={today} defaultValue={today} required />
						</label>
						<label>
							Desde
							<input
								type="time"
								name="startTime"
								min="08:00"
								max="18:00"
								step="1800"
								defaultValue="08:00"
								required
							/>
						</label>
						<label>
							Hasta
							<input
								type="time"
								name="endTime"
								min="08:00"
								max="18:00"
								step="1800"
								defaultValue="18:00"
								required
							/>
						</label>
						<label>
							Motivo
							<input
								type="text"
								name="reason"
								maxLength={120}
								placeholder="Ej. Festivo, permiso o mantenimiento"
								required
							/>
						</label>
						<button className="button button-outline" type="submit">
							Bloquear disponibilidad
						</button>
					</form>
					{scheduleMessage && (
						<p className="form-note" role="status">
							{scheduleMessage}
						</p>
					)}
					<div className="admin-schedule-calendar">
						<div className="calendar-heading">
							<div>
								<p className="eyebrow">Agenda mensual</p>
								<h3>
									{scheduleDentists.find((dentist) => dentist.id === scheduleDentistId)?.name ??
										'Selecciona un odontólogo'}
								</h3>
								<span>{scheduleSpecialty}</span>
							</div>
							<div className="calendar-controls">
								<button
									type="button"
									className="button button-outline"
									onClick={() => shiftScheduleMonth(-1)}
									aria-label="Mes anterior"
								>
									‹
								</button>
								<strong>
									{new Date(`${calendarMonth}-01T00:00:00`).toLocaleDateString('es', {
										month: 'long',
										year: 'numeric',
									})}
								</strong>
								<button
									type="button"
									className="button button-outline"
									onClick={() => shiftScheduleMonth(1)}
									aria-label="Mes siguiente"
								>
									›
								</button>
							</div>
						</div>
						<div className="calendar-weekdays" aria-hidden="true">
							{['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
								<span key={day}>{day}</span>
							))}
						</div>
						<div className="calendar-month-grid">
							{calendarWeeks.flatMap((week, weekIndex) =>
								week.map((date, dayIndex) => {
									if (!date)
										return (
											<div
												key={`empty-${weekIndex}-${dayIndex}`}
												className="calendar-day calendar-day-empty"
												aria-hidden="true"
											/>
										)
									const daySlots = availabilityForMonth.filter((slot) => slot.date === date)
									const bookedSlots = daySlots.filter(hasActiveAppointmentAtSlot).length
									const blockedSlots = daySlots.filter(getAvailabilityBlock).length
									const openSlots = daySlots.filter(
										(slot) => !hasActiveAppointmentAtSlot(slot) && !getAvailabilityBlock(slot),
									).length
									const dayBlocks = availabilityBlocks.filter(
										(block) =>
											block.date === date &&
											(!block.dentistId || block.dentistId === scheduleDentistId),
									).length
									const dayState =
										daySlots.length === 0
											? dayBlocks > 0
												? 'Bloqueado'
												: 'Sin turnos'
											: `${openSlots} disponibles`
									return (
										<button
											key={date}
											type="button"
											className={`calendar-day${selectedScheduleDate === date ? ' calendar-day-selected' : ''}${daySlots.length ? ' calendar-day-open' : ''}`}
											onClick={() => setSelectedScheduleDate(date)}
											aria-pressed={selectedScheduleDate === date}
										>
											<strong>{Number(date.slice(-2))}</strong>
											<span>{dayState}</span>
											{bookedSlots > 0 && <small>{bookedSlots} ocupados</small>}
											{blockedSlots > 0 && <small>{blockedSlots} bloqueados</small>}
										</button>
									)
								}),
							)}
						</div>
						<section className="calendar-day-detail" aria-live="polite">
							<div className="calendar-detail-heading">
								<h4>
									{new Date(`${selectedScheduleDate}T00:00:00`).toLocaleDateString('es', {
										weekday: 'long',
										day: 'numeric',
										month: 'long',
									})}
								</h4>
								<span>
									{availabilityForSelectedDate.length} turnos · {blocksForSelectedDate.length}{' '}
									bloqueos
								</span>
							</div>
							{availabilityForSelectedDate.length === 0 ? (
								<p className="booking-empty">
									Este día no tiene turnos publicados para el odontólogo seleccionado.
								</p>
							) : (
								<ul className="calendar-slot-list">
									{availabilityForSelectedDate.map((slot) => {
										const booked = hasActiveAppointmentAtSlot(slot)
										const block = getAvailabilityBlock(slot)
										return (
											<li key={slot.id}>
												<span
													className={
														booked || block ? 'calendar-slot-status booked' : 'calendar-slot-status'
													}
												>
													{booked ? 'Ocupado' : block ? 'Bloqueado' : 'Disponible'}
												</span>
												<strong>{slot.time}</strong>
												<button
													type="button"
													className="button button-quiet"
													onClick={() => handleRemoveAvailability(slot.id)}
													disabled={booked}
													title={booked ? 'No se puede quitar un turno con cita activa' : undefined}
												>
													{booked ? 'Reservado' : 'Quitar turno'}
												</button>
											</li>
										)
									})}
								</ul>
							)}
							{blocksForSelectedDate.length > 0 && (
								<ul className="admin-manage-list schedule-block-list">
									{blocksForSelectedDate.map((block) => (
										<li key={block.id}>
											<span>
												<strong>
													{block.startTime}–{block.endTime} ·{' '}
													{block.dentistId
														? (dentists.find((dentist) => dentist.id === block.dentistId)?.name ??
															'Odontólogo')
														: 'Toda la clínica'}
												</strong>
												<small>{block.reason}</small>
											</span>
											<button
												type="button"
												className="button button-quiet"
												onClick={() => handleRemoveAvailabilityBlock(block.id)}
											>
												Quitar bloqueo
											</button>
										</li>
									))}
								</ul>
							)}
						</section>
					</div>
				</section>
			)}

			{page === 'perfil' && (
				<section className="admin-management">
					<div className="section-heading admin-heading">
						<div>
							<p className="eyebrow">Cuenta</p>
							<h2>Editar perfil</h2>
						</div>
					</div>
					<p className="admin-help">
						Actualiza los datos de acceso y contacto de tu cuenta de administración.
					</p>
					<form className="form-grid admin-profile-form" onSubmit={handleUpdateProfile}>
						<label>
							Nombre
							<input
								value={profile.name}
								onChange={(event) =>
									setProfile((current) => ({ ...current, name: event.target.value }))
								}
								autoComplete="name"
								required
							/>
						</label>
						<label>
							Correo electrónico
							<input
								type="email"
								value={profile.email}
								onChange={(event) =>
									setProfile((current) => ({ ...current, email: event.target.value }))
								}
								autoComplete="email"
								required
							/>
						</label>
						<label>
							Teléfono
							<input
								type="tel"
								value={profile.phone}
								onChange={(event) =>
									setProfile((current) => ({ ...current, phone: event.target.value }))
								}
								autoComplete="tel"
							/>
						</label>
						<label>
							Nueva contraseña <small>(déjala vacía para conservar la actual)</small>
							<input
								type="password"
								value={profile.password}
								onChange={(event) =>
									setProfile((current) => ({ ...current, password: event.target.value }))
								}
								autoComplete="new-password"
								minLength={6}
							/>
						</label>
						{profileMessage && (
							<p className="form-note" role="status">
								{profileMessage}
							</p>
						)}
						<button className="button button-primary" type="submit">
							Guardar perfil
						</button>
					</form>
				</section>
			)}
		</section>
	)
}
