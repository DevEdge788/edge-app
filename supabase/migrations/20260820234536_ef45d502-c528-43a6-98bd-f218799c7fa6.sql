
revoke all on function public.is_patient_of_professional(uuid,uuid) from public, anon, authenticated;
revoke all on function public.is_own_patient(uuid,uuid) from public, anon, authenticated;
