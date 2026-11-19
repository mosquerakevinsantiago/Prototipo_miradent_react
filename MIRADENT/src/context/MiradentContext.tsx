import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type User = {
	id: string
	name: string
	email: string
	phone: string
	role: 'admin' | 'patient'
}

type Account = User & { password: string }

export type AppointmentStatus = 'Pendiente' | 'Confirmada' | 'Completada' | 'Cancelada'

export type Appointment = {
	id: string
	userId: string
	patientName: string
	email: string
	phone: string
	service: string
	dentistId: string
	dentistName: string
	date: string
	time: string
	endTime: string
	durationMinutes: number
	chairId: string
	notes: string
	status: AppointmentStatus
}

export type Service = {
	name: string
	durationMinutes: number
	specialty: string
}

export type Dentist = {
	id: string
	name: string
	specialties: string[]
	startTime: string
	endTime: string
}

export type AvailabilitySlot = {
	id: string
	date: string
	time: string
	dentistId: string
}

export type AvailabilityBlock = {
	id: string
	date: string
	startTime: string
	endTime: string
	dentistId: string | null
	reason: string
}

export type AdminNotification = {
	id: string
	appointmentId: string
	message: string
	createdAt: string
	read: boolean
}

type StoredData = {
	accounts: Account[]
	appointments: Appointment[]
	currentUserId: string | null
	serviceCatalogVersion: number
	dentistCatalogVersion: number
	services: Service[]
	availability: AvailabilitySlot[]
	availabilityBlocks: AvailabilityBlock[]
	dentists: Dentist[]
	specialties: string[]
	notifications: AdminNotification[]
}

type ProfileDetails = {
	name: string
	email: string
	phone: string
	password?: string
}

type AppointmentDetails = Omit<
	Appointment,
	'id' | 'userId' | 'status' | 'endTime' | 'durationMinutes' | 'chairId'
>

type MiradentContextValue = {
	currentUser: User | null
	appointments: Appointment[]
	services: Service[]
	availability: AvailabilitySlot[]
	availabilityBlocks: AvailabilityBlock[]
	dentists: Dentist[]
	specialties: string[]
	notifications: AdminNotification[]
	login: (email: string, password: string) => User | null
	register: (name: string, email: string, phone: string, password: string) => void
	logout: () => void
	updateProfile: (details: ProfileDetails) => void
	addAppointment: (details: AppointmentDetails) => void
	updateAppointmentStatus: (id: string, status: AppointmentStatus) => void
	markNotificationRead: (id: string) => void
	availableSlotsForService: (serviceName: string) => AvailabilitySlot[]
	addService: (service: string, durationMinutes: number, specialty: string) => void
	renameService: (
		oldService: string,
		newService: string,
		durationMinutes: number,
		specialty: string,
	) => void
	removeService: (service: string) => void
	generateMonthlyAvailability: (month: string, dentistId: string, weekdays: number[]) => number
	addAvailabilitySlot: (date: string, time: string, dentistId: string) => void
	removeAvailabilitySlot: (id: string) => void
	addAvailabilityBlock: (
		date: string,
		startTime: string,
		endTime: string,
		dentistId: string | null,
		reason: string,
	) => void
	removeAvailabilityBlock: (id: string) => void
	addDentist: (dentist: Omit<Dentist, 'id'>) => void
	updateDentist: (id: string, dentist: Omit<Dentist, 'id'>) => void
	removeDentist: (id: string) => void
}

const STORAGE_KEY = 'miradent-data-v1'
const SERVICE_CATALOG_VERSION = 1
const DENTIST_CATALOG_VERSION = 1
const DEFAULT_SPECIALTIES = [
	'Odontología general',
	'Ortodoncia',
	'Endodoncia',
	'Periodoncia',
	'Odontopediatría',
	'Rehabilitación oral',
]
const DEFAULT_DENTISTS: Dentist[] = [
	{
		id: '2',
		name: 'Dra. María',
		specialties: ['Odontología general', 'Endodoncia'],
		startTime: '08:00',
		endTime: '18:00',
	},
	{
		id: '3',
		name: 'Dr. Andrés',
		specialties: ['Odontología general'],
		startTime: '08:00',
		endTime: '18:00',
	},
	{
		id: '4',
		name: 'Dr. Daniel',
		specialties: ['Periodoncia', 'Odontopediatría'],
		startTime: '08:00',
		endTime: '18:00',
	},
	{
		id: '6',
		name: 'Dr. Felipe',
		specialties: ['Rehabilitación oral'],
		startTime: '08:00',
		endTime: '18:00',
	},
	{
		id: '28',
		name: 'Odontólogo',
		specialties: ['Odontología general'],
		startTime: '08:00',
		endTime: '18:00',
	},
	{
		id: '29',
		name: 'Odontólogo',
		specialties: ['Ortodoncia'],
		startTime: '08:00',
		endTime: '18:00',
	},
	{
		id: '30',
		name: 'Odontólogo',
		specialties: ['Endodoncia'],
		startTime: '08:00',
		endTime: '18:00',
	},
	{
		id: '31',
		name: 'Odontólogo',
		specialties: ['Periodoncia'],
		startTime: '08:00',
		endTime: '18:00',
	},
	{
		id: '32',
		name: 'Odontólogo',
		specialties: ['Rehabilitación oral'],
		startTime: '08:00',
		endTime: '18:00',
	},
]
const DEFAULT_SERVICES: Service[] = [
	{ name: 'Revisión general', durationMinutes: 30, specialty: 'Odontología general' },
	{ name: 'Limpieza dental', durationMinutes: 30, specialty: 'Odontología general' },
	{ name: 'Blanqueamiento', durationMinutes: 30, specialty: 'Odontología general' },
	{ name: 'Ortodoncia', durationMinutes: 30, specialty: 'Ortodoncia' },
	{ name: 'Consulta de urgencia', durationMinutes: 30, specialty: 'Odontología general' },
	{ name: 'Otro tratamiento', durationMinutes: 30, specialty: 'Odontología general' },
	{ name: 'Endodoncia', durationMinutes: 90, specialty: 'Endodoncia' },
	{ name: 'Extracción simple', durationMinutes: 30, specialty: 'Odontología general' },
	{ name: 'Blanqueamiento dental', durationMinutes: 30, specialty: 'Odontología general' },
	{ name: 'Resina compuesta', durationMinutes: 30, specialty: 'Odontología general' },
	{ name: 'Consulta de valoración', durationMinutes: 30, specialty: 'Odontología general' },
	{ name: 'Aplicación de flúor', durationMinutes: 30, specialty: 'Odontología general' },
	{ name: 'Sellantes dentales', durationMinutes: 30, specialty: 'Odontología general' },
	{ name: 'Control de ortodoncia', durationMinutes: 30, specialty: 'Ortodoncia' },
	{ name: 'Radiografía periapical', durationMinutes: 30, specialty: 'Odontología general' },
	{ name: 'Profilaxis avanzada', durationMinutes: 30, specialty: 'Odontología general' },
	{ name: 'Sellado de restauración', durationMinutes: 30, specialty: 'Odontología general' },
	{ name: 'Retiro de brackets', durationMinutes: 30, specialty: 'Ortodoncia' },
]
const CHAIRS = ['chair-1', 'chair-2']

function toMinutes(time: string) {
	const [hours, minutes] = time.split(':').map(Number)
	return hours * 60 + minutes
}

function toTimeString(minutes: number) {
	return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

function getLocalDateString(date: Date) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

function isValidDateString(date: string) {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false
	const parsedDate = new Date(`${date}T00:00:00`)
	return !Number.isNaN(parsedDate.getTime()) && getLocalDateString(parsedDate) === date
}

function overlaps(start: number, end: number, otherStart: number, otherEnd: number) {
	return start < otherEnd && end > otherStart
}

function fitsClinicHours(start: number, end: number) {
	return (start >= 8 * 60 && end <= 12 * 60) || (start >= 13 * 60 + 30 && end <= 18 * 60)
}

function getServiceDuration(services: Service[], name: string) {
	return services.find((service) => service.name === name)?.durationMinutes ?? 30
}

function dentistHasSpecialty(dentist: Dentist, specialty: string) {
	return dentist.specialties.includes(specialty)
}

function hasFreeChair(appointments: Appointment[], date: string, start: number, end: number) {
	return CHAIRS.some(
		(chairId) =>
			!appointments.some(
				(appointment) =>
					appointment.date === date &&
					appointment.chairId === chairId &&
					appointment.status !== 'Cancelada' &&
					overlaps(start, end, toMinutes(appointment.time), toMinutes(appointment.endTime)),
			),
	)
}
const ADMIN_ACCOUNT: Account = {
	id: 'miradent-admin',
	name: 'Administración Miradent',
	email: 'admin@miradent.com',
	phone: '',
	password: 'admin123',
	role: 'admin',
}

function loadData(): StoredData {
	try {
		const saved = localStorage.getItem(STORAGE_KEY)
		if (saved) {
			const data = JSON.parse(saved) as Partial<StoredData>
			if (Array.isArray(data.accounts) && Array.isArray(data.appointments)) {
				if (!data.accounts.some((account) => account.role === 'admin')) {
					data.accounts.push(ADMIN_ACCOUNT)
				}
				const savedServices = Array.isArray(data.services)
					? data.services.map((service) =>
							typeof service === 'string'
								? (DEFAULT_SERVICES.find((defaultService) => defaultService.name === service) ?? {
										name: service,
										durationMinutes: 30,
										specialty: DEFAULT_SPECIALTIES[0],
									})
								: { ...service, specialty: service.specialty ?? DEFAULT_SPECIALTIES[0] },
						)
					: []
				const needsServiceCatalogMigration = data.serviceCatalogVersion !== SERVICE_CATALOG_VERSION
				const savedServiceNames = new Set(savedServices.map((service) => service.name))
				const services = needsServiceCatalogMigration
					? [
							...savedServices,
							...DEFAULT_SERVICES.filter((service) => !savedServiceNames.has(service.name)),
						]
					: savedServices
				const dentistIdMigration = new Map([
					['dentist-a', '2'],
					['dentist-k', '3'],
				])
				const savedDentists = Array.isArray(data.dentists)
					? data.dentists.map((dentist) => {
							const legacyDentist = dentist as Dentist & { specialty?: string }
							const id = dentistIdMigration.get(legacyDentist.id) ?? legacyDentist.id
							const defaultDentist = DEFAULT_DENTISTS.find((item) => item.id === id)
							return defaultDentist
								? defaultDentist
								: {
										...legacyDentist,
										id,
										specialties:
											legacyDentist.specialties ??
											(legacyDentist.specialty
												? [legacyDentist.specialty]
												: [DEFAULT_SPECIALTIES[0]]),
									}
						})
					: []
				const needsDentistCatalogMigration = data.dentistCatalogVersion !== DENTIST_CATALOG_VERSION
				const dentists = needsDentistCatalogMigration
					? [
							...savedDentists.filter(
								(dentist) =>
									!DEFAULT_DENTISTS.some((defaultDentist) => defaultDentist.id === dentist.id),
							),
							...DEFAULT_DENTISTS,
						]
					: savedDentists.length > 0
						? savedDentists
						: DEFAULT_DENTISTS
				const migratedDentistId = (id: string) => dentistIdMigration.get(id) ?? id
				return {
					accounts: data.accounts,
					currentUserId: typeof data.currentUserId === 'string' ? data.currentUserId : null,
					serviceCatalogVersion: SERVICE_CATALOG_VERSION,
					dentistCatalogVersion: DENTIST_CATALOG_VERSION,
					services,
					availability: Array.isArray(data.availability)
						? data.availability.map((slot) => ({
								...slot,
								dentistId: migratedDentistId(slot.dentistId ?? DEFAULT_DENTISTS[0].id),
							}))
						: [],
					availabilityBlocks: Array.isArray(data.availabilityBlocks)
						? data.availabilityBlocks.map((block) => ({
								...block,
								dentistId: block.dentistId ? migratedDentistId(block.dentistId) : null,
							}))
						: [],
					dentists,
					specialties: [
						...new Set([
							...DEFAULT_SPECIALTIES,
							...(Array.isArray(data.specialties) ? data.specialties : []),
						]),
					],
					appointments: data.appointments.map((appointment, index) => {
						const durationMinutes =
							appointment.durationMinutes ?? getServiceDuration(services, appointment.service)
						return {
							...appointment,
							dentistId: migratedDentistId(appointment.dentistId ?? DEFAULT_DENTISTS[0].id),
							dentistName:
								dentists.find(
									(dentist) =>
										dentist.id ===
										migratedDentistId(appointment.dentistId ?? DEFAULT_DENTISTS[0].id),
								)?.name ??
								appointment.dentistName ??
								DEFAULT_DENTISTS[0].name,
							durationMinutes,
							endTime:
								appointment.endTime ?? toTimeString(toMinutes(appointment.time) + durationMinutes),
							chairId: appointment.chairId ?? CHAIRS[index % CHAIRS.length],
						}
					}),
					notifications: Array.isArray(data.notifications) ? data.notifications : [],
				}
			}
		}
	} catch {
		localStorage.removeItem(STORAGE_KEY)
	}
	return {
		accounts: [ADMIN_ACCOUNT],
		appointments: [],
		currentUserId: null,
		serviceCatalogVersion: SERVICE_CATALOG_VERSION,
		dentistCatalogVersion: DENTIST_CATALOG_VERSION,
		services: DEFAULT_SERVICES,
		availability: [],
		availabilityBlocks: [],
		dentists: DEFAULT_DENTISTS,
		specialties: DEFAULT_SPECIALTIES,
		notifications: [],
	}
}

const MiradentContext = createContext<MiradentContextValue | null>(null)

export function MiradentProvider({ children }: { children: ReactNode }) {
	const [data, setData] = useState<StoredData>(loadData)
	const currentUser = data.accounts.find((account) => account.id === data.currentUserId) ?? null
	const publicUser = currentUser
		? {
				id: currentUser.id,
				name: currentUser.name,
				email: currentUser.email,
				phone: currentUser.phone,
				role: currentUser.role,
			}
		: null

	useEffect(() => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
	}, [data])

	function login(email: string, password: string) {
		const account = data.accounts.find(
			(candidate) =>
				candidate.email.toLowerCase() === email.trim().toLowerCase() &&
				candidate.password === password,
		)
		if (!account) return null
		setData((current) => ({ ...current, currentUserId: account.id }))
		return {
			id: account.id,
			name: account.name,
			email: account.email,
			phone: account.phone,
			role: account.role,
		}
	}

	function register(name: string, email: string, phone: string, password: string) {
		if (
			data.accounts.some((account) => account.email.toLowerCase() === email.trim().toLowerCase())
		) {
			throw new Error('Ya existe una cuenta con ese correo electrónico.')
		}
		const account: Account = {
			id: crypto.randomUUID(),
			name: name.trim(),
			email: email.trim().toLowerCase(),
			phone: phone.trim(),
			password,
			role: 'patient',
		}
		setData((current) => ({
			...current,
			accounts: [...current.accounts, account],
			currentUserId: account.id,
		}))
	}

	function logout() {
		setData((current) => ({ ...current, currentUserId: null }))
	}

	function updateProfile(details: ProfileDetails) {
		if (!currentUser) throw new Error('Inicia sesión para editar tu perfil.')
		const name = details.name.trim()
		const email = details.email.trim().toLowerCase()
		if (!name || !email) throw new Error('El nombre y el correo son obligatorios.')
		if (details.password && details.password.length < 6)
			throw new Error('La contraseña debe tener al menos 6 caracteres.')
		if (
			data.accounts.some(
				(account) => account.id !== currentUser.id && account.email.toLowerCase() === email,
			)
		) {
			throw new Error('Ya existe una cuenta con ese correo electrónico.')
		}
		setData((current) => ({
			...current,
			accounts: current.accounts.map((account) =>
				account.id === currentUser.id
					? {
							...account,
							name,
							email,
							phone: details.phone.trim(),
							...(details.password ? { password: details.password } : {}),
						}
					: account,
			),
		}))
	}

	function addAppointment(details: AppointmentDetails) {
		if (!currentUser || currentUser.role !== 'patient')
			throw new Error('Inicia sesión como paciente para solicitar una cita.')
		const scheduledAt = new Date(`${details.date}T${details.time}:00`)
		if (
			!details.date ||
			!details.time ||
			Number.isNaN(scheduledAt.getTime()) ||
			scheduledAt <= new Date()
		) {
			throw new Error('Selecciona una fecha y una hora futuras.')
		}
		const dentist = data.dentists.find((item) => item.id === details.dentistId)
		if (!dentist) throw new Error('Selecciona un odontólogo válido.')
		const service = data.services.find((item) => item.name === details.service)
		if (!service) throw new Error('Ese servicio ya no está disponible. Selecciona otro.')
		if (!dentistHasSpecialty(dentist, service.specialty))
			throw new Error(
				'El odontólogo seleccionado no tiene la especialidad requerida para este servicio.',
			)
		const start = toMinutes(details.time)
		const end = start + service.durationMinutes
		const slotExists = data.availability.some(
			(slot) =>
				slot.date === details.date &&
				slot.time === details.time &&
				slot.dentistId === details.dentistId,
		)
		if (
			!slotExists ||
			!fitsClinicHours(start, end) ||
			details.time < dentist.startTime ||
			end > toMinutes(dentist.endTime)
		) {
			throw new Error(
				'La duración de este servicio no cabe en el horario de trabajo ni en el horario de atención (08:00–12:00 y 13:30–18:00).',
			)
		}
		if (
			data.availabilityBlocks.some(
				(block) =>
					block.date === details.date &&
					(!block.dentistId || block.dentistId === details.dentistId) &&
					overlaps(start, end, toMinutes(block.startTime), toMinutes(block.endTime)),
			)
		)
			throw new Error('Ese horario está bloqueado. Selecciona otro horario disponible.')
		const conflictingAppointments = data.appointments.filter(
			(appointment) => appointment.date === details.date && appointment.status !== 'Cancelada',
		)
		if (
			conflictingAppointments.some(
				(appointment) =>
					appointment.dentistId === details.dentistId &&
					overlaps(start, end, toMinutes(appointment.time), toMinutes(appointment.endTime)),
			)
		) {
			throw new Error('Ese odontólogo ya tiene una cita que se cruza con ese horario.')
		}
		const chairId = CHAIRS.find(
			(chair) =>
				!conflictingAppointments.some(
					(appointment) =>
						appointment.chairId === chair &&
						overlaps(start, end, toMinutes(appointment.time), toMinutes(appointment.endTime)),
				),
		)
		if (!chairId)
			throw new Error('Las dos sillas ya están ocupadas en ese horario. Selecciona otro.')

		const appointment: Appointment = {
			...details,
			id: crypto.randomUUID(),
			userId: currentUser.id,
			endTime: toTimeString(end),
			durationMinutes: service.durationMinutes,
			chairId,
			status: 'Pendiente',
		}
		const notification: AdminNotification = {
			id: crypto.randomUUID(),
			appointmentId: appointment.id,
			message: `Nueva solicitud de ${appointment.patientName} para ${appointment.service}.`,
			createdAt: new Date().toISOString(),
			read: false,
		}
		setData((current) => ({
			...current,
			appointments: [...current.appointments, appointment],
			notifications: [...current.notifications, notification],
		}))
	}

	function updateAppointmentStatus(id: string, status: AppointmentStatus) {
		setData((current) => ({
			...current,
			appointments: current.appointments.map((appointment) =>
				appointment.id === id ? { ...appointment, status } : appointment,
			),
		}))
	}

	function markNotificationRead(id: string) {
		setData((current) => ({
			...current,
			notifications: current.notifications.map((notification) =>
				notification.id === id ? { ...notification, read: true } : notification,
			),
		}))
	}

	function availableSlotsForService(serviceName: string) {
		const service = data.services.find((item) => item.name === serviceName)
		if (!service) return []
		return data.availability.filter((slot) => {
			if (new Date(`${slot.date}T${slot.time}:00`) <= new Date()) return false
			const dentist = data.dentists.find((item) => item.id === slot.dentistId)
			if (!dentist || !dentistHasSpecialty(dentist, service.specialty)) return false
			const start = toMinutes(slot.time)
			const end = start + service.durationMinutes
			if (
				!fitsClinicHours(start, end) ||
				slot.time < dentist.startTime ||
				end > toMinutes(dentist.endTime)
			)
				return false
			const appointments = data.appointments.filter(
				(appointment) => appointment.date === slot.date && appointment.status !== 'Cancelada',
			)
			if (
				data.availabilityBlocks.some(
					(block) =>
						block.date === slot.date &&
						(!block.dentistId || block.dentistId === slot.dentistId) &&
						overlaps(start, end, toMinutes(block.startTime), toMinutes(block.endTime)),
				)
			)
				return false
			if (
				appointments.some(
					(appointment) =>
						appointment.dentistId === slot.dentistId &&
						overlaps(start, end, toMinutes(appointment.time), toMinutes(appointment.endTime)),
				)
			)
				return false
			return hasFreeChair(appointments, slot.date, start, end)
		})
	}

	function addService(service: string, durationMinutes: number, specialty: string) {
		const normalized = service.trim()
		if (!normalized) throw new Error('Escribe el nombre del servicio.')
		if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 480)
			throw new Error('La duración debe ser de 1 a 480 minutos.')
		if (!data.specialties.includes(specialty))
			throw new Error('Selecciona una especialidad válida.')
		if (data.services.some((item) => item.name.toLowerCase() === normalized.toLowerCase())) {
			throw new Error('Ese servicio ya existe.')
		}
		setData((current) => ({
			...current,
			services: [...current.services, { name: normalized, durationMinutes, specialty }],
		}))
	}

	function renameService(
		oldService: string,
		newService: string,
		durationMinutes: number,
		specialty: string,
	) {
		const normalized = newService.trim()
		if (!normalized) throw new Error('Escribe el nombre del servicio.')
		if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 480)
			throw new Error('La duración debe ser de 1 a 480 minutos.')
		if (!data.specialties.includes(specialty))
			throw new Error('Selecciona una especialidad válida.')
		if (
			data.services.some(
				(item) => item.name !== oldService && item.name.toLowerCase() === normalized.toLowerCase(),
			)
		) {
			throw new Error('Ya existe un servicio con ese nombre.')
		}
		setData((current) => ({
			...current,
			services: current.services.map((item) =>
				item.name === oldService ? { name: normalized, durationMinutes, specialty } : item,
			),
		}))
	}

	function removeService(service: string) {
		setData((current) => ({
			...current,
			services: current.services.filter((item) => item.name !== service),
		}))
	}

	function generateMonthlyAvailability(month: string, dentistId: string, weekdays: number[]) {
		if (!/^\d{4}-\d{2}$/.test(month)) throw new Error('Selecciona un mes válido.')
		if (
			weekdays.length === 0 ||
			weekdays.some((weekday) => !Number.isInteger(weekday) || weekday < 1 || weekday > 7)
		) {
			throw new Error('Selecciona al menos un día de la semana.')
		}
		const dentist = data.dentists.find((item) => item.id === dentistId)
		if (!dentist) throw new Error('Selecciona un odontólogo válido.')

		const [year, monthNumber] = month.split('-').map(Number)
		const firstDay = new Date(year, monthNumber - 1, 1)
		if (firstDay.getFullYear() !== year || firstDay.getMonth() !== monthNumber - 1)
			throw new Error('Selecciona un mes válido.')
		const daysInMonth = new Date(year, monthNumber, 0).getDate()
		const selectedWeekdays = new Set(weekdays)
		const existingSlots = new Set(
			data.availability.map((slot) => `${slot.date}|${slot.time}|${slot.dentistId}`),
		)
		const newSlots: AvailabilitySlot[] = []
		const today = getLocalDateString(new Date())
		const clinicBlocks = [
			[8 * 60, 12 * 60],
			[13 * 60 + 30, 18 * 60],
		]

		for (let day = 1; day <= daysInMonth; day += 1) {
			const date = new Date(year, monthNumber - 1, day)
			const weekday = ((date.getDay() + 6) % 7) + 1
			const dateString = getLocalDateString(date)
			if (!selectedWeekdays.has(weekday) || dateString < today) continue

			for (const [blockStart, blockEnd] of clinicBlocks) {
				for (let start = blockStart; start + 30 <= blockEnd; start += 30) {
					if (start < toMinutes(dentist.startTime) || start >= toMinutes(dentist.endTime)) continue
					const time = toTimeString(start)
					if (dateString === today && new Date(`${dateString}T${time}:00`) <= new Date()) continue
					if (
						data.availabilityBlocks.some(
							(block) =>
								block.date === dateString &&
								(!block.dentistId || block.dentistId === dentist.id) &&
								overlaps(start, start + 30, toMinutes(block.startTime), toMinutes(block.endTime)),
						)
					)
						continue
					const slotKey = `${dateString}|${time}|${dentist.id}`
					if (existingSlots.has(slotKey)) continue
					existingSlots.add(slotKey)
					newSlots.push({ id: crypto.randomUUID(), date: dateString, time, dentistId: dentist.id })
				}
			}
		}
		if (newSlots.length === 0)
			throw new Error(
				'No hay nuevos horarios para publicar en ese mes. Revisa el mes, los días y la jornada del odontólogo.',
			)
		setData((current) => ({ ...current, availability: [...current.availability, ...newSlots] }))
		return newSlots.length
	}

	function addAvailabilitySlot(date: string, time: string, dentistId: string) {
		const scheduledAt = new Date(`${date}T${time}:00`)
		if (!date || !time || Number.isNaN(scheduledAt.getTime()) || scheduledAt <= new Date()) {
			throw new Error('Selecciona una fecha y una hora futuras.')
		}
		const dentist = data.dentists.find((item) => item.id === dentistId)
		if (!dentist) throw new Error('Selecciona un odontólogo válido.')
		if (
			time < dentist.startTime ||
			time >= dentist.endTime ||
			!fitsClinicHours(toMinutes(time), toMinutes(time) + 1)
		)
			throw new Error(
				`El horario debe estar dentro de la jornada del odontólogo y de la clínica (08:00–12:00 y 13:30–18:00).`,
			)
		if (
			data.availability.some(
				(slot) => slot.date === date && slot.time === time && slot.dentistId === dentistId,
			)
		) {
			throw new Error('Ese horario ya está en la agenda.')
		}
		if (
			data.availabilityBlocks.some(
				(block) =>
					block.date === date &&
					(!block.dentistId || block.dentistId === dentistId) &&
					overlaps(
						toMinutes(time),
						toMinutes(time) + 30,
						toMinutes(block.startTime),
						toMinutes(block.endTime),
					),
			)
		)
			throw new Error('Ese horario está dentro de un bloqueo.')
		if (
			data.appointments.some(
				(appointment) =>
					appointment.date === date &&
					appointment.time === time &&
					appointment.dentistId === dentistId &&
					appointment.status !== 'Cancelada',
			)
		) {
			throw new Error('Ya existe una cita activa en ese horario.')
		}
		setData((current) => ({
			...current,
			availability: [...current.availability, { id: crypto.randomUUID(), date, time, dentistId }],
		}))
	}

	function removeAvailabilitySlot(id: string) {
		const slot = data.availability.find((item) => item.id === id)
		if (
			slot &&
			data.appointments.some(
				(appointment) =>
					appointment.date === slot.date &&
					appointment.time === slot.time &&
					appointment.dentistId === slot.dentistId &&
					appointment.status !== 'Cancelada',
			)
		) {
			throw new Error('No se puede quitar un horario con una cita activa o completada.')
		}
		setData((current) => ({
			...current,
			availability: current.availability.filter((item) => item.id !== id),
		}))
	}

	function addAvailabilityBlock(
		date: string,
		startTime: string,
		endTime: string,
		dentistId: string | null,
		reason: string,
	) {
		const today = getLocalDateString(new Date())
		const validTime = (time: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(time)
		if (!isValidDateString(date) || date < today)
			throw new Error('Selecciona una fecha válida de hoy en adelante.')
		if (
			!validTime(startTime) ||
			!validTime(endTime) ||
			startTime < '08:00' ||
			endTime > '18:00' ||
			startTime >= endTime
		) {
			throw new Error('El bloqueo debe ser un rango válido entre las 08:00 y las 18:00.')
		}
		if (dentistId && !data.dentists.some((dentist) => dentist.id === dentistId))
			throw new Error('Selecciona un odontólogo válido o toda la clínica.')
		const normalizedReason = reason.trim()
		if (!normalizedReason) throw new Error('Escribe el motivo del bloqueo.')

		const start = toMinutes(startTime)
		const end = toMinutes(endTime)
		if (
			data.appointments.some(
				(appointment) =>
					appointment.date === date &&
					appointment.status !== 'Cancelada' &&
					(!dentistId || appointment.dentistId === dentistId) &&
					overlaps(start, end, toMinutes(appointment.time), toMinutes(appointment.endTime)),
			)
		) {
			throw new Error('No se puede bloquear ese rango porque ya tiene una cita reservada.')
		}
		if (
			data.availabilityBlocks.some(
				(block) =>
					block.date === date &&
					(!block.dentistId || !dentistId || block.dentistId === dentistId) &&
					overlaps(start, end, toMinutes(block.startTime), toMinutes(block.endTime)),
			)
		) {
			throw new Error('Ese rango ya está incluido en otro bloqueo.')
		}

		setData((current) => ({
			...current,
			availabilityBlocks: [
				...current.availabilityBlocks,
				{
					id: crypto.randomUUID(),
					date,
					startTime,
					endTime,
					dentistId,
					reason: normalizedReason,
				},
			],
		}))
	}

	function removeAvailabilityBlock(id: string) {
		setData((current) => ({
			...current,
			availabilityBlocks: current.availabilityBlocks.filter((block) => block.id !== id),
		}))
	}

	function addDentist(details: Omit<Dentist, 'id'>) {
		const name = details.name.trim()
		if (!name) throw new Error('Escribe el nombre del odontólogo.')
		if (
			details.specialties.length === 0 ||
			details.specialties.some((specialty) => !data.specialties.includes(specialty))
		)
			throw new Error('Selecciona al menos una especialidad válida.')
		if (
			details.startTime < '08:00' ||
			details.endTime > '18:00' ||
			details.startTime >= details.endTime
		)
			throw new Error('El horario del odontólogo debe estar dentro de 08:00 a 18:00.')
		if (data.dentists.some((item) => item.name.toLowerCase() === name.toLowerCase()))
			throw new Error('Ya existe un odontólogo con ese nombre.')
		setData((current) => ({
			...current,
			dentists: [...current.dentists, { ...details, name, id: crypto.randomUUID() }],
		}))
	}

	function updateDentist(id: string, details: Omit<Dentist, 'id'>) {
		const name = details.name.trim()
		if (!name) throw new Error('Escribe el nombre del odontólogo.')
		if (
			details.specialties.length === 0 ||
			details.specialties.some((specialty) => !data.specialties.includes(specialty))
		)
			throw new Error('Selecciona al menos una especialidad válida.')
		if (
			details.startTime < '08:00' ||
			details.endTime > '18:00' ||
			details.startTime >= details.endTime
		)
			throw new Error('El horario debe estar dentro de 08:00 a 18:00.')
		setData((current) => ({
			...current,
			dentists: current.dentists.map((item) => (item.id === id ? { ...details, name, id } : item)),
		}))
	}

	function removeDentist(id: string) {
		if (
			data.availability.some((slot) => slot.dentistId === id) ||
			data.appointments.some(
				(appointment) => appointment.dentistId === id && appointment.status !== 'Cancelada',
			)
		)
			throw new Error('No se puede eliminar: el odontólogo tiene horarios o citas activas.')
		setData((current) => ({
			...current,
			dentists: current.dentists.filter((item) => item.id !== id),
		}))
	}

	return (
		<MiradentContext.Provider
			value={{
				currentUser: publicUser,
				appointments: data.appointments,
				services: data.services,
				availability: data.availability,
				availabilityBlocks: data.availabilityBlocks,
				dentists: data.dentists,
				specialties: data.specialties,
				notifications: data.notifications,
				login,
				register,
				logout,
				updateProfile,
				addAppointment,
				updateAppointmentStatus,
				markNotificationRead,
				availableSlotsForService,
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
			}}
		>
			{children}
		</MiradentContext.Provider>
	)
}

export function useMiradent() {
	const context = useContext(MiradentContext)
	if (!context) throw new Error('useMiradent debe usarse dentro de MiradentProvider.')
	return context
}
