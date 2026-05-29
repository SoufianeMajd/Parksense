-- Script pour générer des données de test réalistes pour ParkSense
-- Ce script utilise un bloc PL/pgSQL pour insérer dynamiquement des parkings, 
-- des places de parking, et des capteurs avec des états aléatoires pour simuler une utilisation réelle.

DO $$
DECLARE
    -- Déclaration des UUIDs pour les parkings
    lot1_id UUID := uuid_generate_v4();
    lot2_id UUID := uuid_generate_v4();
    lot3_id UUID := uuid_generate_v4();
    lot4_id UUID := uuid_generate_v4();
    lot5_id UUID := uuid_generate_v4();
    lot6_id UUID := uuid_generate_v4();
    lot7_id UUID := uuid_generate_v4();
    lot8_id UUID := uuid_generate_v4();
    lot9_id UUID := uuid_generate_v4();
    lot10_id UUID := uuid_generate_v4();
    esp32_id UUID := '11111111-1111-1111-1111-111111111111';
    
    spot_id UUID;
    i INT;
    status_val VARCHAR;
    random_time TIMESTAMP;
BEGIN
    -- 0. Nettoyer les anciennes données pour éviter les doublons
    DELETE FROM sensors;
    DELETE FROM parking_spots;
    DELETE FROM parking_lots;

    -- 1. Insérer des parkings réalistes (Exemple basé sur Casablanca)
    INSERT INTO parking_lots (id, name, latitude, longitude, total_capacity) VALUES
    (esp32_id, 'ParkSense ESP32 Simulation', 33.383021, -7.568350, 6),
    (lot1_id, 'Parking Maarif', 33.5852, -7.6329, 20),
    (lot2_id, 'Parking Centre Ville', 33.5898, -7.6152, 30),
    (lot3_id, 'Parking Ain Diab (Plage)', 33.5936, -7.6695, 40),
    (lot4_id, 'Parking Casa Port', 33.5992, -7.6105, 50),
    (lot5_id, 'Parking Technopark', 33.5415, -7.6433, 20),
    (lot6_id, 'Parking Aéroport Nouaceur', 33.3675, -7.5898, 60),
    (lot7_id, 'Parking Quartier Habous', 33.5822, -7.6045, 15),
    (lot8_id, 'Parking Centre Deroua', 33.3942, -7.5317, 15),
    (lot9_id, 'Parking Casablanca Marina', 33.6062, -7.6200, 80),
    (lot10_id, 'Parking Sidi Maarouf', 33.5284, -7.6493, 40);

    -- 1.5 Générer les 6 places pour l'ESP32 en premier (garantit leur présence)
    INSERT INTO parking_spots (id, lot_id, label, status, created_at, updated_at)
    VALUES 
    (uuid_generate_v4(), esp32_id, 'A1', 'Libre', NOW(), NOW()),
    (uuid_generate_v4(), esp32_id, 'A2', 'Libre', NOW(), NOW()),
    (uuid_generate_v4(), esp32_id, 'A3', 'Libre', NOW(), NOW()),
    (uuid_generate_v4(), esp32_id, 'A4', 'Libre', NOW(), NOW()),
    (uuid_generate_v4(), esp32_id, 'A5', 'Occupee', NOW(), NOW()),
    (uuid_generate_v4(), esp32_id, 'A6', 'Occupee', NOW(), NOW());

    -- 2. Générer des places et capteurs pour le Parking 1 (Maarif)
    FOR i IN 1..20 LOOP
        spot_id := uuid_generate_v4();
        IF random() > 0.2 THEN status_val := 'Occupee'; ELSE status_val := 'Libre'; END IF;
        random_time := NOW() - (random() * interval '3 hours');
        
        INSERT INTO parking_spots (id, lot_id, label, status, created_at, updated_at)
        VALUES (spot_id, lot1_id, 'A' || i, status_val, random_time - interval '1 day', random_time);
        
        INSERT INTO sensors (mac_address, spot_id, status)
        VALUES (substring(md5(random()::text) from 1 for 12), spot_id, 'Active');
    END LOOP;

    -- 3. Générer des places et capteurs pour le Parking 2 (Centre Ville)
    FOR i IN 1..30 LOOP
        spot_id := uuid_generate_v4();
        IF random() > 0.5 THEN status_val := 'Occupee'; ELSE status_val := 'Libre'; END IF;
        random_time := NOW() - (random() * interval '1 hour');
        
        INSERT INTO parking_spots (id, lot_id, label, status, created_at, updated_at)
        VALUES (spot_id, lot2_id, 'B' || i, status_val, random_time - interval '2 days', random_time);
        
        INSERT INTO sensors (mac_address, spot_id, status)
        VALUES (substring(md5(random()::text) from 1 for 12), spot_id, 'Active');
    END LOOP;

    -- 4. Générer des places et capteurs pour le Parking 3 (Ain Diab)
    FOR i IN 1..40 LOOP
        spot_id := uuid_generate_v4();
        IF random() > 0.7 THEN status_val := 'Occupee'; ELSE status_val := 'Libre'; END IF;
        random_time := NOW() - (random() * interval '5 hours');
        
        INSERT INTO parking_spots (id, lot_id, label, status, created_at, updated_at)
        VALUES (spot_id, lot3_id, 'C' || i, status_val, random_time - interval '3 days', random_time);
        
        INSERT INTO sensors (mac_address, spot_id, status)
        VALUES (substring(md5(random()::text) from 1 for 12), spot_id, 'Active');
    END LOOP;

    -- 5. Générer des places et capteurs pour le Parking 4 (Casa Port)
    FOR i IN 1..50 LOOP
        spot_id := uuid_generate_v4();
        IF random() > 0.1 THEN status_val := 'Occupee'; ELSE status_val := 'Libre'; END IF;
        random_time := NOW() - (random() * interval '30 minutes');
        
        INSERT INTO parking_spots (id, lot_id, label, status, created_at, updated_at)
        VALUES (spot_id, lot4_id, 'D' || i, status_val, random_time - interval '1 day', random_time);
        
        INSERT INTO sensors (mac_address, spot_id, status)
        VALUES (substring(md5(random()::text) from 1 for 12), spot_id, 'Active');
    END LOOP;

    -- 6. Générer des places et capteurs pour le Parking 5 (Technopark)
    FOR i IN 1..20 LOOP
        spot_id := uuid_generate_v4();
        IF random() > 0.4 THEN status_val := 'Occupee'; ELSE status_val := 'Libre'; END IF;
        random_time := NOW() - (random() * interval '2 hours');
        
        INSERT INTO parking_spots (id, lot_id, label, status, created_at, updated_at)
        VALUES (spot_id, lot5_id, 'T' || i, status_val, random_time - interval '1 week', random_time);
        
        INSERT INTO sensors (mac_address, spot_id, status)
        VALUES (substring(md5(random()::text) from 1 for 12), spot_id, 'Active');
    END LOOP;

    -- 7. Générer des places et capteurs pour le Parking 6 (Aéroport Nouaceur)
    FOR i IN 1..60 LOOP
        spot_id := uuid_generate_v4();
        IF random() > 0.3 THEN status_val := 'Occupee'; ELSE status_val := 'Libre'; END IF;
        random_time := NOW() - (random() * interval '4 hours');
        
        INSERT INTO parking_spots (id, lot_id, label, status, created_at, updated_at)
        VALUES (spot_id, lot6_id, 'N' || i, status_val, random_time - interval '1 week', random_time);
        
        INSERT INTO sensors (mac_address, spot_id, status)
        VALUES (substring(md5(random()::text) from 1 for 12), spot_id, 'Active');
    END LOOP;

    -- 8. Générer des places et capteurs pour le Parking 7 (Habous)
    FOR i IN 1..15 LOOP
        spot_id := uuid_generate_v4();
        IF random() > 0.15 THEN status_val := 'Occupee'; ELSE status_val := 'Libre'; END IF;
        random_time := NOW() - (random() * interval '1 hour');
        
        INSERT INTO parking_spots (id, lot_id, label, status, created_at, updated_at)
        VALUES (spot_id, lot7_id, 'H' || i, status_val, random_time - interval '2 days', random_time);
        
        INSERT INTO sensors (mac_address, spot_id, status)
        VALUES (substring(md5(random()::text) from 1 for 12), spot_id, 'Active');
    END LOOP;

    -- 9. Générer des places et capteurs pour le Parking 8 (Deroua)
    FOR i IN 1..15 LOOP
        spot_id := uuid_generate_v4();
        IF random() > 0.4 THEN status_val := 'Occupee'; ELSE status_val := 'Libre'; END IF;
        random_time := NOW() - (random() * interval '6 hours');
        
        INSERT INTO parking_spots (id, lot_id, label, status, created_at, updated_at)
        VALUES (spot_id, lot8_id, 'DR' || i, status_val, random_time - interval '2 days', random_time);
        
        INSERT INTO sensors (mac_address, spot_id, status)
        VALUES (substring(md5(random()::text) from 1 for 12), spot_id, 'Active');
    END LOOP;

    -- 10. Générer des places et capteurs pour le Parking 9 (Marina)
    FOR i IN 1..80 LOOP
        spot_id := uuid_generate_v4();
        IF random() > 0.85 THEN status_val := 'Occupee'; ELSE status_val := 'Libre'; END IF;
        random_time := NOW() - (random() * interval '30 minutes');
        
        INSERT INTO parking_spots (id, lot_id, label, status, created_at, updated_at)
        VALUES (spot_id, lot9_id, 'M' || i, status_val, random_time - interval '4 days', random_time);
        
        INSERT INTO sensors (mac_address, spot_id, status)
        VALUES (substring(md5(random()::text) from 1 for 12), spot_id, 'Active');
    END LOOP;

    -- 11. Générer des places et capteurs pour le Parking 10 (Sidi Maarouf)
    FOR i IN 1..40 LOOP
        spot_id := uuid_generate_v4();
        IF random() > 0.6 THEN status_val := 'Occupee'; ELSE status_val := 'Libre'; END IF;
        random_time := NOW() - (random() * interval '2 hours');
        
        INSERT INTO parking_spots (id, lot_id, label, status, created_at, updated_at)
        VALUES (spot_id, lot10_id, 'SM' || i, status_val, random_time - interval '1 week', random_time);
        
        INSERT INTO sensors (mac_address, spot_id, status)
        VALUES (substring(md5(random()::text) from 1 for 12), spot_id, 'Active');
    END LOOP;

    -- Fin du script

END $$;
