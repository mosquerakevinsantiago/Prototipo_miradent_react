import { useState, type FormEvent } from 'react'
import { useMiradent } from '../../context'

function getLocalDateString(date: Date) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

export default function AgendarCita() {
	const {
		currentUser,
		appointments,
		services,
		dentists,
		availableSlotsForService,
		addAppointment,
		updateAppointmentStatus,
	} = useMiradent()
	const [message, setMessage] = useState('')
	const [selectedService, setSelectedService] = useState('')
	const [selectedDate, setSelectedDate] = useState('')
	const [selectedTime, setSelectedTime] = useState('')
	const [selectedDentist, setSelectedDentist] = useState('')
	const today = getLocalDateString(new Date())
	const [selectedMonth, setSelectedMonth] = useState(today.slice(0, 7))
	const selectedServiceDetails = services.find((service) => service.name === selectedService)
	const dentistsForService = selectedServiceDetails
		? dentists.filter((dentist) => dentist.specialties.includes(selectedServiceDetails.specialty))
		: dentists
	const availableSlots = availableSlotsForService(selectedService).sort((first, second) =>
		`${first.date}${first.time}`.localeCompare(`${second.date}${second.time}`),
	)
	const slotsForMonth = availableSlots.filter((slot) => slot.date.startsWith(selectedMonth))
	const availableDates = [...new Set(slotsForMonth.map((slot) => slot.date))]
	const dentistAvailability = dentistsForService.map((dentist) => {
		const slots = slotsForMonth.filter((slot) => slot.dentistId === dentist.id)
		return { dentist, slots, nextDate: slots[0]?.date }
	})
	const slotsForSelectedDentist = slotsForMonth.filter((slot) => slot.dentistId === selectedDentist)
	const datesForSelectedDentist = [...new Set(slotsForSelectedDentist.map((slot) => slot.date))]
	const timesForSelectedDate = slotsForSelectedDentist.filter((slot) => slot.date === selectedDate)
	const calendarMonth = /^\d{4}-\d{2}$/.test(selectedMonth) ? selectedMonth : today.slice(0, 7)
	const [calendarYear, calendarMonthNumber] = calendarMonth.split('-').map(Number)
	const calendarOffset = (new Date(calendarYear, calendarMonthNumber - 1, 1).getDay() + 6) % 7
	const calendarDays: (string | null)[] = [
		...Array.from({ length: calendarOffset }, () => null),
		...Array.from(
			{ length: new Date(calendarYear, calendarMonthNumber, 0).getDate() },
			(_, index) => getLocalDateString(new Date(calendarYear, calendarMonthNumber - 1, index + 1)),
		),
	]
	const calendarWeeks = Array.from({ length: Math.ceil(calendarDays.length / 7) }, (_, week) =>
		calendarDays.slice(week * 7, week * 7 + 7),
	)
	const myAppointments = appointments
		.filter((appointment) => appointment.userId === currentUser?.id)
		.sort((first, second) =>
			`${first.date}${first.time}`.localeCompare(`${second.date}${second.time}`),
		)

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		if (!currentUser) return
		const form = new FormData(event.currentTarget)
		try {
			addAppointment({
				patientName: currentUser.name,
				email: currentUser.email,
				phone: currentUser.phone,
				service: selectedService,
				dentistId: selectedDentist,
				dentistName: dentists.find((dentist) => dentist.id === selectedDentist)?.name ?? '',
				date: selectedDate,
				time: selectedTime,
				notes: String(form.get('notes') ?? '').trim(),
			})
			event.currentTarget.reset()
			setSelectedService('')
			setSelectedDate('')
			setSelectedTime('')
			setSelectedDentist('')
			setMessage('Tu solicitud de cita se ha guardado. Te contactaremos para confirmarla.')
		} catch (reason) {
			setMessage(reason instanceof Error ? reason.message : 'No se pudo solicitar la cita.')
		}
	}

	return (
		<section className="content-section">
			<p className="eyebrow">Atención personalizada</p>
			<h1>Agenda tu cita</h1>
			<p className="form-intro">
				Elige el tratamiento y el mes para consultar qué odontólogos tienen agenda disponible.
				Después selecciona el día y la hora.
			</p>
			<form className="form-grid appointment-form" onSubmit={handleSubmit}>
				<label>
					Tratamiento
					<select
						name="service"
						required
						value={selectedService}
						disabled={services.length === 0}
						onChange={(event) => {
							setSelectedService(event.target.value)
							setSelectedDentist('')
							setSelectedDate('')
							setSelectedTime('')
							setMessage('')
						}}
					>
						<option value="" disabled>
							Selecciona un tratamiento
						</option>
						{services.map((service) => (
							<option key={service.name} value={service.name}>
								{service.name} · {service.durationMinutes} min
							</option>
						))}
					</select>
				</label>
				<label>
					Mes disponible
					<input
						type="month"
						min={today.slice(0, 7)}
						value={selectedMonth}
						disabled={!selectedService}
						onChange={(event) => {
							setSelectedMonth(event.target.value)
							setSelectedDentist('')
							setSelectedDate('')
							setSelectedTime('')
							setMessage('')
						}}
					/>
				</label>
				<fieldset className="booking-provider-picker" disabled={!selectedService}>
					<legend>Odontólogos con agenda para este tratamiento</legend>
					{!selectedService ? (
						<p className="booking-empty">
							Selecciona un tratamiento para consultar qué odontólogos tienen disponibilidad.
						</p>
					) : dentistsForService.length === 0 ? (
						<p className="booking-empty">No hay odontólogos registrados para esta especialidad.</p>
					) : (
						<div className="booking-provider-list">
							{dentistAvailability.map(({ dentist, slots, nextDate }) => {
								const isAvailable = slots.length > 0
								const nextDateLabel = nextDate
									? new Date(`${nextDate}T00:00:00`).toLocaleDateString('es', {
											weekday: 'short',
											day: 'numeric',
											month: 'short',
										})
									: null
								return (
									<button
										key={dentist.id}
										type="button"
										className={`booking-provider-card${selectedDentist === dentist.id ? ' selected' : ''}${!isAvailable ? ' unavailable' : ''}`}
										disabled={!isAvailable}
										aria-pressed={selectedDentist === dentist.id}
										onClick={() => {
											setSelectedDentist(dentist.id)
											setSelectedDate('')
											setSelectedTime('')
											setMessage('')
										}}
									>
										<span className="booking-provider-avatar" aria-hidden="true">
											{dentist.name
												.split(' ')
												.map((part) => part[0])
												.slice(0, 2)
												.join('')
												.toUpperCase()}
										</span>
										<span className="booking-provider-info">
											<strong>{dentist.name}</strong>
											<small>
												ID {dentist.id} · {dentist.specialties.join(', ')} · {dentist.startTime}–
												{dentist.endTime}
											</small>
											<small>
												{isAvailable
													? `${slots.length} horarios · siguiente: ${nextDateLabel}`
													: 'Sin agenda disponible este mes'}
											</small>
										</span>
										<span
											className={
												isAvailable
													? 'booking-provider-status'
													: 'booking-provider-status unavailable'
											}
										>
											{isAvailable ? 'Disponible' : 'Sin cupos'}
										</span>
									</button>
								)
							})}
						</div>
					)}
					{selectedService && availableDates.length === 0 && (
						<p className="booking-empty booking-month-empty">
							No hay citas disponibles para este tratamiento en{' '}
							{new Date(`${selectedMonth}-01T00:00:00`).toLocaleDateString('es', {
								month: 'long',
								year: 'numeric',
							})}
							. Prueba otro mes o servicio.
						</p>
					)}
				</fieldset>
				<fieldset
					className="booking-date-picker"
					disabled={!selectedDentist || datesForSelectedDentist.length === 0}
				>
					<legend>Agenda del odontólogo — selecciona un día disponible</legend>
					{!selectedDentist ? (
						<p className="booking-empty">
							Selecciona un odontólogo disponible para consultar su agenda mensual.
						</p>
					) : datesForSelectedDentist.length === 0 ? (
						<p className="booking-empty">
							Este odontólogo no tiene horarios disponibles en el mes seleccionado.
						</p>
					) : (
						<>
							<div className="booking-calendar-heading">
								<strong>
									{new Date(`${calendarMonth}-01T00:00:00`).toLocaleDateString('es', {
										month: 'long',
										year: 'numeric',
									})}
								</strong>
								<span>Los días verdes tienen horarios disponibles</span>
							</div>
							<div className="booking-calendar-weekdays" aria-hidden="true">
								{['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
									<span key={day}>{day}</span>
								))}
							</div>
							<div className="booking-calendar-grid">
								{calendarWeeks.flatMap((week, weekIndex) =>
									week.map((date, dayIndex) => {
										if (!date)
											return (
												<span
													key={`empty-${weekIndex}-${dayIndex}`}
													className="booking-calendar-day empty"
													aria-hidden="true"
												/>
											)
										const dateSlots = slotsForSelectedDentist.filter((slot) => slot.date === date)
										const hasAvailability = dateSlots.length > 0
										return (
											<button
												key={date}
												type="button"
												className={`booking-calendar-day${hasAvailability ? ' available' : ''}${selectedDate === date ? ' selected' : ''}`}
												disabled={!hasAvailability}
												aria-pressed={selectedDate === date}
												aria-label={`${new Date(`${date}T00:00:00`).toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}${hasAvailability ? `, ${dateSlots.length} horarios disponibles` : ', sin horarios disponibles'}`}
												onClick={() => {
													setSelectedDate(date)
													setSelectedTime('')
													setMessage('')
												}}
											>
												<strong>{Number(date.slice(-2))}</strong>
												{hasAvailability && (
													<small>
														{dateSlots.length} {dateSlots.length === 1 ? 'hora' : 'horas'}
													</small>
												)}
											</button>
										)
									}),
								)}
							</div>
						</>
					)}
				</fieldset>
				<fieldset
					className="booking-time-picker"
					disabled={!selectedDate || timesForSelectedDate.length === 0}
				>
					<legend>Horas disponibles</legend>
					{timesForSelectedDate.length === 0 ? (
						<p className="booking-empty">Selecciona una fecha para ver sus horas.</p>
					) : (
						<div className="booking-time-options">
							{timesForSelectedDate.map((slot) => (
								<button
									key={slot.id}
									type="button"
									className={
										selectedTime === slot.time ? 'booking-option selected' : 'booking-option'
									}
									aria-pressed={selectedTime === slot.time}
									onClick={() => {
										setSelectedTime(slot.time)
										setMessage('')
									}}
								>
									{slot.time}
								</button>
							))}
						</div>
					)}
				</fieldset>
				<label className="wide-field">
					Comentarios
					<textarea
						name="notes"
						rows={3}
						maxLength={500}
						placeholder="Cuéntanos brevemente el motivo de tu visita"
					/>
				</label>
				{services.length === 0 && (
					<p className="form-note" role="status">
						No hay servicios disponibles por el momento.
					</p>
				)}
				{message && (
					<p className="form-note" role="status">
						{message}
					</p>
				)}
				<button
					className="button button-primary"
					type="submit"
					disabled={
						services.length === 0 ||
						!selectedService ||
						!selectedDentist ||
						!selectedDate ||
						!selectedTime
					}
				>
					Solicitar cita
				</button>
			</form>
			<div className="section-heading">
				<div>
					<p className="eyebrow">Seguimiento</p>
					<h2>Mis citas</h2>
				</div>
			</div>
			{myAppointments.length === 0 ? (
				<p className="empty-state">
					Todavía no tienes citas. Cuando solicites una, aparecerá aquí.
				</p>
			) : (
				<div className="appointment-list">
					{myAppointments.map((appointment) => (
						<article className="appointment-row" key={appointment.id}>
							<div>
								<strong>{appointment.service}</strong>
								<p>
									Odontólogo: {appointment.dentistName} ·{' '}
									{appointment.chairId.replace('chair-', 'Silla ')}
								</p>
								<p>
									{new Date(`${appointment.date}T00:00:00`).toLocaleDateString('es', {
										day: 'numeric',
										month: 'long',
										year: 'numeric',
									})}{' '}
									· {appointment.time}–{appointment.endTime}
								</p>
								{appointment.notes && <p>{appointment.notes}</p>}
							</div>
							<span className={`status status-${appointment.status.toLowerCase()}`}>
								{appointment.status}
							</span>
							{appointment.status === 'Pendiente' && (
								<button
									className="button button-quiet"
									type="button"
									onClick={() => updateAppointmentStatus(appointment.id, 'Cancelada')}
								>
									Cancelar
								</button>
							)}
						</article>
					))}
				</div>
			)}
		</section>
	)
}
