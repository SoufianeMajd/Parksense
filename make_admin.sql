-- Exécutez ce script dans le SQL Editor de Supabase APRES avoir créé le compte 
-- via l'écran d'inscription de l'application (SignUp)

UPDATE public.profiles
SET role = 'Admin'
WHERE email = 'admin@parksense.com';
