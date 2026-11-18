CREATE DATABASE IF NOT EXISTS miradent
	CHARACTER SET utf8mb4
	COLLATE utf8mb4_0900_ai_ci;

USE miradent;

CREATE TABLE IF NOT EXISTS roles (
	role_id TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	role_key VARCHAR(30) NOT NULL UNIQUE,
	name VARCHAR(60) NOT NULL UNIQUE
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS users (
	user_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	role_id TINYINT UNSIGNED NOT NULL,
	full_name VARCHAR(150) NOT NULL,
	email VARCHAR(254) NOT NULL UNIQUE,
	phone VARCHAR(30) NOT NULL DEFAULT '',
	password_hash VARCHAR(255) NOT NULL,
	is_active BOOLEAN NOT NULL DEFAULT TRUE,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles (role_id)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS specialties (
	specialty_id SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	name VARCHAR(100) NOT NULL UNIQUE,
	is_active BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS dentists (
	dentist_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	user_id BIGINT UNSIGNED NOT NULL UNIQUE,
	specialty_id SMALLINT UNSIGNED NOT NULL,
	work_start_time TIME NOT NULL DEFAULT '08:00:00',
	work_end_time TIME NOT NULL DEFAULT '18:00:00',
	is_active BOOLEAN NOT NULL DEFAULT TRUE,
	CONSTRAINT chk_dentists_work_hours CHECK (work_start_time < work_end_time),
	CONSTRAINT fk_dentists_user FOREIGN KEY (user_id) REFERENCES users (user_id),
	CONSTRAINT fk_dentists_specialty FOREIGN KEY (specialty_id) REFERENCES specialties (specialty_id)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS services (
	service_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	specialty_id SMALLINT UNSIGNED NOT NULL,
	name VARCHAR(120) NOT NULL UNIQUE,
	duration_minutes SMALLINT UNSIGNED NOT NULL,
	is_active BOOLEAN NOT NULL DEFAULT TRUE,
	CONSTRAINT chk_services_duration CHECK (duration_minutes BETWEEN 1 AND 480),
	CONSTRAINT fk_services_specialty FOREIGN KEY (specialty_id) REFERENCES specialties (specialty_id)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS clinic_settings (
	clinic_id TINYINT UNSIGNED PRIMARY KEY,
	name VARCHAR(120) NOT NULL,
	time_zone VARCHAR(64) NOT NULL DEFAULT 'America/Bogota',
	CONSTRAINT chk_single_clinic CHECK (clinic_id = 1)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS clinic_schedule (
	schedule_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	weekday TINYINT UNSIGNED NOT NULL COMMENT '1=lunes, 7=domingo',
	block_start TIME NOT NULL,
	block_end TIME NOT NULL,
	CONSTRAINT chk_clinic_weekday CHECK (weekday BETWEEN 1 AND 7),
	CONSTRAINT chk_clinic_block CHECK (block_start < block_end),
	UNIQUE KEY uq_clinic_schedule (weekday, block_start, block_end)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS clinic_closures (
	closure_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	closed_date DATE NOT NULL UNIQUE,
	reason VARCHAR(200) NOT NULL DEFAULT ''
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS chairs (
	chair_id TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	name VARCHAR(40) NOT NULL UNIQUE,
	is_active BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS availability_slots (
	slot_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	dentist_id BIGINT UNSIGNED NOT NULL,
	available_date DATE NOT NULL,
	start_time TIME NOT NULL,
	slot_status ENUM('OPEN', 'BLOCKED') NOT NULL DEFAULT 'OPEN',
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT uq_dentist_slot UNIQUE (dentist_id, available_date, start_time),
	CONSTRAINT fk_slots_dentist FOREIGN KEY (dentist_id) REFERENCES dentists (dentist_id),
	KEY idx_slots_date_time (available_date, start_time, slot_status)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS appointments (
	appointment_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	slot_id BIGINT UNSIGNED NOT NULL,
	patient_user_id BIGINT UNSIGNED NOT NULL,
	dentist_id BIGINT UNSIGNED NOT NULL,
	service_id BIGINT UNSIGNED NOT NULL,
	chair_id TINYINT UNSIGNED NOT NULL,
	appointment_date DATE NOT NULL,
	start_time TIME NOT NULL,
	end_time TIME NOT NULL,
	duration_minutes SMALLINT UNSIGNED NOT NULL,
	notes TEXT NOT NULL,
	status ENUM('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT chk_appointment_range CHECK (start_time < end_time),
	CONSTRAINT chk_appointment_duration CHECK (duration_minutes BETWEEN 1 AND 480),
	CONSTRAINT fk_appointments_slot FOREIGN KEY (slot_id) REFERENCES availability_slots (slot_id),
	CONSTRAINT fk_appointments_patient FOREIGN KEY (patient_user_id) REFERENCES users (user_id),
	CONSTRAINT fk_appointments_dentist FOREIGN KEY (dentist_id) REFERENCES dentists (dentist_id),
	CONSTRAINT fk_appointments_service FOREIGN KEY (service_id) REFERENCES services (service_id),
	CONSTRAINT fk_appointments_chair FOREIGN KEY (chair_id) REFERENCES chairs (chair_id),
	KEY idx_appointments_dentist_range (dentist_id, appointment_date, status, start_time, end_time),
	KEY idx_appointments_chair_range (chair_id, appointment_date, status, start_time, end_time),
	KEY idx_appointments_patient (patient_user_id, appointment_date)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS admin_notifications (
	notification_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	appointment_id BIGINT UNSIGNED NOT NULL,
	message VARCHAR(500) NOT NULL,
	is_read BOOLEAN NOT NULL DEFAULT FALSE,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT fk_notifications_appointment
		FOREIGN KEY (appointment_id) REFERENCES appointments (appointment_id)
		ON DELETE CASCADE,
	KEY idx_notifications_unread (is_read, created_at)
) ENGINE = InnoDB;

INSERT IGNORE INTO roles (role_key, name)
VALUES
	('admin', 'Administrador'),
	('dentist', 'Odontólogo'),
	('patient', 'Paciente');

INSERT IGNORE INTO specialties (name)
VALUES
	('Odontología general'),
	('Ortodoncia'),
	('Endodoncia'),
	('Periodoncia'),
	('Odontopediatría'),
	('Rehabilitación oral');

INSERT IGNORE INTO services (specialty_id, name, duration_minutes)
SELECT specialty_id, seed.name, seed.duration_minutes
FROM (
	SELECT 'Revisión general' AS name, 30 AS duration_minutes, 'Odontología general' AS specialty_name
	UNION ALL SELECT 'Limpieza dental', 30, 'Odontología general'
	UNION ALL SELECT 'Blanqueamiento', 30, 'Odontología general'
	UNION ALL SELECT 'Ortodoncia', 30, 'Ortodoncia'
	UNION ALL SELECT 'Consulta de urgencia', 30, 'Odontología general'
	UNION ALL SELECT 'Otro tratamiento', 30, 'Odontología general'
	UNION ALL SELECT 'Endodoncia', 90, 'Endodoncia'
	UNION ALL SELECT 'Extracción simple', 30, 'Odontología general'
	UNION ALL SELECT 'Blanqueamiento dental', 30, 'Odontología general'
	UNION ALL SELECT 'Resina compuesta', 30, 'Odontología general'
	UNION ALL SELECT 'Consulta de valoración', 30, 'Odontología general'
	UNION ALL SELECT 'Aplicación de flúor', 30, 'Odontología general'
	UNION ALL SELECT 'Sellantes dentales', 30, 'Odontología general'
	UNION ALL SELECT 'Control de ortodoncia', 30, 'Ortodoncia'
	UNION ALL SELECT 'Radiografía periapical', 30, 'Odontología general'
	UNION ALL SELECT 'Profilaxis avanzada', 30, 'Odontología general'
	UNION ALL SELECT 'Sellado de restauración', 30, 'Odontología general'
	UNION ALL SELECT 'Retiro de brackets', 30, 'Ortodoncia'
) AS seed
INNER JOIN specialties ON specialties.name = seed.specialty_name;

INSERT IGNORE INTO clinic_settings (clinic_id, name, time_zone)
VALUES (1, 'MIRADENT', 'America/Bogota');

INSERT IGNORE INTO clinic_schedule (weekday, block_start, block_end)
VALUES
	(1, '08:00:00', '12:00:00'),
	(1, '13:30:00', '18:00:00'),
	(2, '08:00:00', '12:00:00'),
	(2, '13:30:00', '18:00:00'),
	(3, '08:00:00', '12:00:00'),
	(3, '13:30:00', '18:00:00'),
	(4, '08:00:00', '12:00:00'),
	(4, '13:30:00', '18:00:00'),
	(5, '08:00:00', '12:00:00'),
	(5, '13:30:00', '18:00:00');

INSERT IGNORE INTO chairs (name)
VALUES ('Silla 1'), ('Silla 2');

DROP PROCEDURE IF EXISTS book_appointment;

DELIMITER //

CREATE PROCEDURE book_appointment(
	IN p_patient_user_id BIGINT UNSIGNED,
	IN p_dentist_id BIGINT UNSIGNED,
	IN p_service_id BIGINT UNSIGNED,
	IN p_appointment_date DATE,
	IN p_start_time TIME,
	IN p_notes TEXT
)
SQL SECURITY DEFINER
BEGIN
	DECLARE v_clinic_id TINYINT UNSIGNED;
	DECLARE v_role_id TINYINT UNSIGNED;
	DECLARE v_patient_role_id TINYINT UNSIGNED;
	DECLARE v_dentist_role_id TINYINT UNSIGNED;
	DECLARE v_dentist_user_role_id TINYINT UNSIGNED;
	DECLARE v_dentist_specialty_id SMALLINT UNSIGNED;
	DECLARE v_dentist_start TIME;
	DECLARE v_dentist_end TIME;
	DECLARE v_service_specialty_id SMALLINT UNSIGNED;
	DECLARE v_duration_minutes SMALLINT UNSIGNED;
	DECLARE v_end_time TIME;
	DECLARE v_chair_id TINYINT UNSIGNED;
	DECLARE v_slot_id BIGINT UNSIGNED;
	DECLARE v_appointment_id BIGINT UNSIGNED;
	DECLARE v_conflict_count INT UNSIGNED DEFAULT 0;
	DECLARE v_row_not_found BOOLEAN DEFAULT FALSE;

	DECLARE EXIT HANDLER FOR SQLEXCEPTION
	BEGIN
		ROLLBACK;
		RESIGNAL;
	END;
	DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_row_not_found = TRUE;

	START TRANSACTION;

	SELECT clinic_id INTO v_clinic_id
	FROM clinic_settings
	WHERE clinic_id = 1
	FOR UPDATE;

	IF v_row_not_found THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No se encontró la configuración de MIRADENT.';
	END IF;

	SET v_patient_role_id = (SELECT role_id FROM roles WHERE role_key = 'patient');
	SET v_role_id = (SELECT role_id FROM users WHERE user_id = p_patient_user_id AND is_active = TRUE);
	IF v_patient_role_id IS NULL OR v_role_id IS NULL OR v_role_id <> v_patient_role_id THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La cita debe ser solicitada por una cuenta activa de paciente.';
	END IF;

	SET v_dentist_role_id = (SELECT role_id FROM roles WHERE role_key = 'dentist');
	SET v_dentist_user_role_id = (
		SELECT users.role_id
		FROM dentists
		INNER JOIN users ON users.user_id = dentists.user_id
		WHERE dentists.dentist_id = p_dentist_id
			AND dentists.is_active = TRUE
			AND users.is_active = TRUE
	);
	SET v_dentist_specialty_id = (
		SELECT dentists.specialty_id
		FROM dentists
		INNER JOIN users ON users.user_id = dentists.user_id
		WHERE dentists.dentist_id = p_dentist_id
			AND dentists.is_active = TRUE
			AND users.is_active = TRUE
	);
	SET v_dentist_start = (
		SELECT dentists.work_start_time
		FROM dentists
		INNER JOIN users ON users.user_id = dentists.user_id
		WHERE dentists.dentist_id = p_dentist_id
			AND dentists.is_active = TRUE
			AND users.is_active = TRUE
	);
	SET v_dentist_end = (
		SELECT dentists.work_end_time
		FROM dentists
		INNER JOIN users ON users.user_id = dentists.user_id
		WHERE dentists.dentist_id = p_dentist_id
			AND dentists.is_active = TRUE
			AND users.is_active = TRUE
	);

	IF v_dentist_role_id IS NULL
		OR v_dentist_user_role_id IS NULL
		OR v_dentist_user_role_id <> v_dentist_role_id
		OR v_dentist_specialty_id IS NULL THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El odontólogo no existe o está inactivo.';
	END IF;

	SET v_service_specialty_id = (
		SELECT specialty_id
		FROM services
		WHERE service_id = p_service_id
			AND is_active = TRUE
	);
	SET v_duration_minutes = (
		SELECT duration_minutes
		FROM services
		WHERE service_id = p_service_id
			AND is_active = TRUE
	);

	IF v_service_specialty_id IS NULL THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El servicio no existe o está inactivo.';
	END IF;

	IF v_dentist_specialty_id <> v_service_specialty_id THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La especialidad del odontólogo no corresponde al servicio.';
	END IF;

	IF p_appointment_date IS NULL OR p_start_time IS NULL
		OR TIMESTAMP(p_appointment_date, p_start_time) <= CURRENT_TIMESTAMP() THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Selecciona una fecha y una hora futuras.';
	END IF;

	SET v_end_time = ADDTIME(p_start_time, SEC_TO_TIME(v_duration_minutes * 60));

	IF v_end_time <= p_start_time
		OR p_start_time < v_dentist_start
		OR v_end_time > v_dentist_end THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El servicio no cabe en el horario del odontólogo.';
	END IF;

	IF EXISTS (
		SELECT 1
		FROM clinic_closures
		WHERE closed_date = p_appointment_date
	) THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La clínica no atiende en la fecha seleccionada.';
	END IF;

	IF NOT EXISTS (
		SELECT 1
		FROM clinic_schedule
		WHERE weekday = WEEKDAY(p_appointment_date) + 1
			AND p_start_time >= block_start
			AND v_end_time <= block_end
	) THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El servicio debe terminar dentro del horario de atención y no puede cruzar el almuerzo.';
	END IF;

	SET v_row_not_found = FALSE;
	SELECT slot_id INTO v_slot_id
	FROM availability_slots
	WHERE dentist_id = p_dentist_id
		AND available_date = p_appointment_date
		AND start_time = p_start_time
		AND slot_status = 'OPEN'
	FOR UPDATE;
	IF v_row_not_found THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El odontólogo no tiene ese horario disponible.';
	END IF;

	SELECT COUNT(*) INTO v_conflict_count
	FROM appointments
	WHERE dentist_id = p_dentist_id
		AND appointment_date = p_appointment_date
		AND status <> 'CANCELLED'
		AND p_start_time < end_time
		AND v_end_time > start_time;

	IF v_conflict_count > 0 THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El odontólogo ya tiene una cita que se cruza con ese horario.';
	END IF;

	SET v_chair_id = (
		SELECT chairs.chair_id
		FROM chairs
		WHERE chairs.is_active = TRUE
			AND NOT EXISTS (
				SELECT 1
				FROM appointments
				WHERE appointments.chair_id = chairs.chair_id
					AND appointments.appointment_date = p_appointment_date
					AND appointments.status <> 'CANCELLED'
					AND p_start_time < appointments.end_time
					AND v_end_time > appointments.start_time
			)
		ORDER BY chairs.chair_id
		LIMIT 1
	);

	IF v_chair_id IS NULL THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Las dos sillas están ocupadas en ese horario.';
	END IF;

	INSERT INTO appointments (
		slot_id,
		patient_user_id,
		dentist_id,
		service_id,
		chair_id,
		appointment_date,
		start_time,
		end_time,
		duration_minutes,
		notes
	)
	VALUES (
		v_slot_id,
		p_patient_user_id,
		p_dentist_id,
		p_service_id,
		v_chair_id,
		p_appointment_date,
		p_start_time,
		v_end_time,
		v_duration_minutes,
		COALESCE(p_notes, '')
	);

	SET v_appointment_id = LAST_INSERT_ID();

	INSERT INTO admin_notifications (appointment_id, message)
	SELECT
		v_appointment_id,
		CONCAT('Nueva solicitud de ', users.full_name, ' para ', services.name, '.')
	FROM users
	INNER JOIN services ON services.service_id = p_service_id
	WHERE users.user_id = p_patient_user_id;

	COMMIT;

	SELECT
		appointments.appointment_id,
		appointments.appointment_date,
		appointments.start_time,
		appointments.end_time,
		appointments.status,
		chairs.name AS chair_name
	FROM appointments
	INNER JOIN chairs ON chairs.chair_id = appointments.chair_id
	WHERE appointments.appointment_id = v_appointment_id;
END//

DELIMITER ;
