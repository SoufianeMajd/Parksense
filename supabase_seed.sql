-- Exécutez ce script dans le SQL Editor de Supabase pour créer un utilisateur de test directement.
-- L'email sera: admin@parksense.com
-- Le mot de passe sera: admin123

INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    uuid_generate_v4(),
    'authenticated',
    'authenticated',
    'admin@parksense.com',
    crypt('admin123', gen_salt('bf')),
    CURRENT_TIMESTAMP,
    '{"provider":"email","providers":["email"]}',
    '{"name":"Admin Test"}',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Insertion dans la table profiles (puisqu'elle est liée à auth.users)
INSERT INTO public.profiles (id, email, name, role)
SELECT id, email, 'Admin Test', 'Admin'
FROM auth.users 
WHERE email = 'admin@parksense.com';

-- Insertion dans auth.identities pour permettre la connexion
INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
)
SELECT 
    uuid_generate_v4(),
    id,
    id::text,
    format('{"sub":"%s","email":"%s"}', id::text, email)::jsonb,
    'email',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM auth.users
WHERE email = 'admin@parksense.com';
