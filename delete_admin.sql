-- Exécutez ce script dans le SQL Editor de Supabase pour supprimer l'utilisateur de test.

DELETE FROM public.profiles 
WHERE email = 'admin@parksense.com';

DELETE FROM auth.users 
WHERE email = 'admin@parksense.com';
