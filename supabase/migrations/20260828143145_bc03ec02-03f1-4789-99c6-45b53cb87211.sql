INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'admin@clinicaedge.pt'
ON CONFLICT (user_id, role) DO NOTHING;

DELETE FROM public.user_roles ur
USING auth.users u
WHERE ur.user_id = u.id AND u.email = 'admin@clinicaedge.pt' AND ur.role = 'paciente'::app_role;