-- Migration: Add company user support and parking approval workflow
-- Run this file in your Supabase SQL editor

-- 1. Add company_name to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);

-- 2. Drop the old CHECK constraint on role and add new one
DO $$
DECLARE
    con_name text;
BEGIN
    SELECT con.conname INTO con_name
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    WHERE rel.relname = 'profiles'
    AND con.contype = 'c';
    
    IF con_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE profiles DROP CONSTRAINT ' || con_name;
    END IF;
END $$;

ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('Admin', 'User', 'Company'));

-- 3. Add new columns to parking_lots
ALTER TABLE parking_lots ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE parking_lots ADD COLUMN IF NOT EXISTS price_per_hour DECIMAL(10,2) DEFAULT 0;
ALTER TABLE parking_lots ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE parking_lots ADD COLUMN IF NOT EXISTS approved BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE parking_lots ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE parking_lots ADD COLUMN IF NOT EXISTS phone VARCHAR(50);

-- 4. Drop all existing RLS policies on parking_lots and recreate
DROP POLICY IF EXISTS "Allow public read for lots" ON parking_lots;
DROP POLICY IF EXISTS "Allow public read approved lots" ON parking_lots;
DROP POLICY IF EXISTS "Allow companies insert own lots" ON parking_lots;
DROP POLICY IF EXISTS "Allow companies update own lots" ON parking_lots;
DROP POLICY IF EXISTS "Allow companies read own lots" ON parking_lots;

CREATE POLICY "Allow public read approved lots" ON parking_lots FOR SELECT USING (approved = true);
CREATE POLICY "Allow companies insert own lots" ON parking_lots FOR INSERT WITH CHECK (auth.uid() = company_id);
CREATE POLICY "Allow companies update own lots" ON parking_lots FOR UPDATE USING (auth.uid() = company_id OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'Admin'));
CREATE POLICY "Allow companies read own lots" ON parking_lots FOR SELECT USING (auth.uid() = company_id OR approved = true OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'Admin'));

-- 5. Allow companies to update spots in their lots
DROP POLICY IF EXISTS "Allow companies update their lot spots" ON parking_spots;

CREATE POLICY "Allow companies update their lot spots" ON parking_spots FOR UPDATE USING (
    lot_id IN (SELECT id FROM parking_lots WHERE company_id = auth.uid())
);

-- 6. Update existing parking_lots to be approved (so they still show on the map)
UPDATE parking_lots SET approved = true WHERE approved = false;
