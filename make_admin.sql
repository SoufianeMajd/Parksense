-- Exécutez ce script dans le SQL Editor de Supabase APRES avoir créé le compte 
-- via l'écran d'inscription de l'application (SignUp)

INSERT INTO public.profiles (id, email, name, role)
SELECT id, email, raw_user_meta_data->>'name', 'Admin'
FROM auth.users
WHERE email = 'admin@parksense.com'
ON CONFLICT (id) DO UPDATE 
SET role = 'Admin';
