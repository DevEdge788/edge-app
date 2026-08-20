
create or replace function public.is_patient_of_professional(_patient_id uuid, _user_id uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists (
    select 1 from appointments a join professionals pr on pr.id = a.professional_id
    where a.patient_id = _patient_id and pr.user_id = _user_id
  )
$$;

create or replace function public.is_own_patient(_patient_id uuid, _user_id uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists (select 1 from patients p where p.id = _patient_id and p.user_id = _user_id)
$$;

drop policy if exists "Pac médico vê seus" on public.patients;
create policy "Pac médico vê seus" on public.patients for select to authenticated
using (has_role(auth.uid(),'medico') and public.is_patient_of_professional(id, auth.uid()));

drop policy if exists "Appt paciente vê suas" on public.appointments;
create policy "Appt paciente vê suas" on public.appointments for select to authenticated
using (public.is_own_patient(patient_id, auth.uid()));

insert into public.user_roles (user_id, role)
select id, 'admin'::app_role from auth.users where email = 'sandra.costa.form@outlook.pt'
on conflict (user_id, role) do nothing;
