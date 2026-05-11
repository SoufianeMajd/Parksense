-- Schéma de base de données Supabase (PostgreSQL) pour ParkSense

-- Activer l'extension pgcrypto pour générer des UUIDs si besoin (Supabase le fait par défaut)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: PARKING_LOTS
CREATE TABLE parking_lots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    total_capacity INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Table: PARKING_SPOTS
CREATE TABLE parking_spots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lot_id UUID NOT NULL REFERENCES parking_lots(id) ON DELETE CASCADE,
    label VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Libre' CHECK (status IN ('Libre', 'Occupee')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Table: SENSORS
CREATE TABLE sensors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mac_address VARCHAR(50) UNIQUE NOT NULL,
    spot_id UUID REFERENCES parking_spots(id) ON DELETE SET NULL,
    last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    status VARCHAR(50) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Offline'))
);

-- Note : La table USERS (authentification) est gérée nativement par Supabase (auth.users).
-- Nous créons un profil public (public.profiles) lié à auth.users pour stocker les rôles.
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'User' CHECK (role IN ('Admin', 'User')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Table: RESERVATIONS
CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    spot_id UUID NOT NULL REFERENCES parking_spots(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Active', 'Completed', 'Cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Table: NOTIFICATIONS
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'Info' CHECK (type IN ('Info', 'Alert')),
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Fonction pour mettre à jour le timestamp 'updated_at' de parking_spots automatiquement
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_parking_spots_modtime
    BEFORE UPDATE ON parking_spots
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();

-- Row Level Security (RLS) - Permettre la lecture/écriture publique pour le prototype
ALTER TABLE parking_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE parking_spots ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensors ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Ajout de polices très permissives pour faciliter le développement (A SÉCURISER EN PROD)
CREATE POLICY "Allow public read for lots" ON parking_lots FOR SELECT USING (true);
CREATE POLICY "Allow public read for spots" ON parking_spots FOR SELECT USING (true);
CREATE POLICY "Allow public read for profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Allow individual profile update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Les capteurs IoT peuvent mettre à jour les spots via l'API, ou l'utilisateur peut lire.
CREATE POLICY "Allow public update for spots" ON parking_spots FOR UPDATE USING (true);

-- Réservations
CREATE POLICY "Users can view their own reservations" ON reservations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own reservations" ON reservations FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notifications
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
