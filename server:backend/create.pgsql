CREATE EXTENSION pgcrypto;


-- Types -----------------------------------------------------------------------
-- Types -----------------------------------------------------------------------


-- Functions, Aggregates, Triggers, Rules --------------------------------------
CREATE OR REPLACE FUNCTION get_now()
RETURNS BIGINT AS $$
SELECT EXTRACT(EPOCH FROM CURRENT_TIMESTAMP(3)) *1000 END
$$ IMMUTABLE LANGUAGE SQL;

CREATE OR REPLACE FUNCTION get_uts_ms(TIMESTAMP)
RETURNS BIGINT AS $$
SELECT EXTRACT(EPOCH FROM $1) *1000 END
$$ IMMUTABLE LANGUAGE SQL;

CREATE OR REPLACE FUNCTION get_tswtz(BIGINT)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
SELECT to_timestamp($1 /1000::DOUBLE PRECISION) END
$$ IMMUTABLE LANGUAGE SQL;

CREATE OR REPLACE FUNCTION set_temp_pass_created_on() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
NEW.temp_pass_created_on= CASE WHEN NEW.temp_pass IS NULL THEN NULL ELSE get_now() END;
RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER temp_pass_created_on BEFORE UPDATE ON users FOR EACH ROW WHEN (OLD.temp_pass IS DISTINCT FROM NEW.temp_pass) EXECUTE PROCEDURE set_temp_pass_created_on();
CREATE OR REPLACE TRIGGER temp_pass_created_on BEFORE UPDATE ON admins FOR EACH ROW WHEN (OLD.temp_pass IS DISTINCT FROM NEW.temp_pass) EXECUTE PROCEDURE set_temp_pass_created_on();
-- Functions, Aggregates, Triggers, Rules --------------------------------------


-- Tables ----------------------------------------------------------------------
DROP TABLE IF EXISTS admins CASCADE;
CREATE TABLE admins(
	admin_id SERIAL PRIMARY KEY, 
	created_on BIGINT NOT NULL DEFAULT get_now(), 
	active BOOLEAN NOT NULL DEFAULT TRUE, 
	pass VARCHAR(72) NOT NULL, -- "Max Password Length": 72 -- crypt('new password', gen_salt('bf')) -- pass = crypt('entered password', pass)
	temp_pass VARCHAR(72), 
	temp_pass_created_on BIGINT, 
	name TEXT NOT NULL, 
	email TEXT NOT NULL UNIQUE, 
	picture TEXT
);
INSERT INTO admins (admin, name, pass, picture, email) VALUES (true, 'admin', crypt('admin', gen_salt('bf')), '', '???@???.??');

DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users(
	user_id SERIAL PRIMARY KEY, 
	created_on BIGINT NOT NULL DEFAULT get_now(), 
	active BOOLEAN NOT NULL DEFAULT TRUE, 
	pass VARCHAR(72) NOT NULL, -- "Max Password Length": 72 -- crypt('new password', gen_salt('bf')) -- pass = crypt('entered password', pass)
	temp_pass VARCHAR(72), 
	temp_pass_created_on BIGINT, 
	name TEXT NOT NULL, 
	email TEXT NOT NULL UNIQUE, 
	picture TEXT, 
	battery REAL NOT NULL DEFAULT 20
);
INSERT INTO users (name, pass, email) VALUES ('test', crypt('test', gen_salt('bf')), 'test@test.bg');

DROP TABLE IF EXISTS models CASCADE;
CREATE TABLE models(
	model_id SERIAL PRIMARY KEY, 
	name TEXT NOT NULL UNIQUE, 
	picture TEXT
);

DROP TABLE IF EXISTS presets CASCADE;
CREATE TABLE presets(
	preset_id SERIAL PRIMARY KEY, 
	user_id INTEGER REFERENCES users ON DELETE CASCADE, 
	created_on BIGINT NOT NULL DEFAULT get_now(), 
	active BOOLEAN NOT NULL DEFAULT TRUE, 
	name TEXT NOT NULL, 
	picture TEXT, 
	temperature_min REAL, 
	temperature_max REAL, 
	humidity_min REAL, 
	humidity_max REAL, 
	light_min REAL, 
	light_max REAL, 
	salt_min REAL, 
	salt_max REAL, 
	soil_min REAL, 
	soil_max REAL, 
	UNIQUE(user_id, name)
);
INSERT INTO presets (name, picture, humidity_min, humidity_max, light_min, humidity_max, soil_min, soil_max, temperature_min, temperature_max) VALUES ('White Butterfly Orchid', 'pics/presets/preset.1.png', 50, 70, 1500, 3000, 10, 20, 15, 27), ('Zamioculcas Zamiifolia', 'pics/presets/preset.2.png', 30, 80, 600, 20000, 10, 60, 15, 60, 10, 32), ('Philodendron Sanguineum', 'pics/presets/preset.3.png', 30, 80, 1000, 15000, 10, 60, 15, 60, 8, 32);

DROP TABLE IF EXISTS devices CASCADE;
CREATE TABLE devices(
	device_id SERIAL PRIMARY KEY, 
	model_id INTEGER NOT NULL REFERENCES models ON DELETE RESTRICT, 
	user_id INTEGER NOT NULL REFERENCES users ON DELETE CASCADE, 
	preset_id INTEGER REFERENCES presets ON DELETE SET NULL, 
	created_on BIGINT NOT NULL DEFAULT get_now(), 
	active BOOLEAN NOT NULL DEFAULT TRUE, 
	applied_interval BIGINT NOT NULL DEFAULT 3600000, 
	interval BIGINT NOT NULL DEFAULT 3600000, 
	mac TEXT NOT NULL UNIQUE, 
	picture TEXT, 
	name TEXT NOT NULL, 
	UNIQUE(user_id, name)
);

DROP TABLE IF EXISTS data CASCADE;
CREATE TABLE data(
	device_id INT NOT NULL REFERENCES devices ON DELETE CASCADE, 
	created_on BIGINT NOT NULL DEFAULT get_now(), 
	timestamp BIGINT NOT NULL, 
	temperature REAL, 
	humidity REAL, 
	light REAL, 
	salt REAL, 
	soil REAL, 
	flood BOOLEAN, 
	empty_water_tank BOOLEAN, 
	battery REAL NOT NULL
);
-- Tables ----------------------------------------------------------------------
