
-- ============== ENUMS ==============
CREATE TYPE public.app_role AS ENUM ('admin', 'rececionista', 'medico', 'paciente');
CREATE TYPE public.appointment_status AS ENUM ('agendada','confirmada','em_curso','concluida','cancelada','faltou');
CREATE TYPE public.payment_method AS ENUM ('numerario','multibanco','mbway','cartao','transferencia','seguro','outro');
CREATE TYPE public.procedure_status AS ENUM ('planeado','em_curso','concluido','faturado','cancelado');
CREATE TYPE public.gender AS ENUM ('feminino','masculino','outro','nao_especificado');

-- ============== PROFILES ==============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============== USER ROLES ==============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin','rececionista','medico')
  )
$$;

-- ============== updated_at helper ==============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- ============== Auto profile on signup ==============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  -- default role: paciente
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'paciente');
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============== SPECIALTIES ==============
CREATE TABLE public.specialties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#11B8B5',
  icon TEXT,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.specialties ENABLE ROW LEVEL SECURITY;

-- ============== PROFESSIONALS ==============
CREATE TABLE public.professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  specialty_id UUID REFERENCES public.specialties(id) ON DELETE SET NULL,
  email TEXT,
  phone TEXT,
  license_number TEXT,
  commission_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  agenda_color TEXT DEFAULT '#003B7A',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_prof_updated BEFORE UPDATE ON public.professionals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;

-- ============== ROOMS ==============
CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  room_type TEXT,
  capacity INT NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- ============== PATIENTS ==============
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  tax_number TEXT,
  email TEXT,
  phone TEXT,
  birth_date DATE,
  gender public.gender DEFAULT 'nao_especificado',
  address TEXT,
  postal_code TEXT,
  city TEXT,
  clinical_notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_patients_updated BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- ============== PROCEDURE CATALOG ==============
CREATE TABLE public.procedure_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  specialty_id UUID REFERENCES public.specialties(id) ON DELETE SET NULL,
  duration_minutes INT NOT NULL DEFAULT 30,
  base_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  commission_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.procedure_catalog ENABLE ROW LEVEL SECURITY;

-- ============== APPOINTMENTS ==============
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE RESTRICT,
  specialty_id UUID REFERENCES public.specialties(id) ON DELETE SET NULL,
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status public.appointment_status NOT NULL DEFAULT 'agendada',
  channel TEXT DEFAULT 'recepcao',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_appt_starts ON public.appointments(starts_at);
CREATE INDEX idx_appt_prof ON public.appointments(professional_id, starts_at);
CREATE INDEX idx_appt_patient ON public.appointments(patient_id);
CREATE TRIGGER trg_appt_updated BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- ============== PROCEDURES (executed) ==============
CREATE TABLE public.procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  catalog_id UUID REFERENCES public.procedure_catalog(id) ON DELETE SET NULL,
  tooth TEXT,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  status public.procedure_status NOT NULL DEFAULT 'planeado',
  payment_method public.payment_method,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.procedures ENABLE ROW LEVEL SECURITY;

-- ============== RLS POLICIES ==============

-- profiles
CREATE POLICY "Próprio perfil leitura" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.is_staff(auth.uid()));
CREATE POLICY "Próprio perfil edita" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id);
CREATE POLICY "Próprio perfil insere" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- user_roles
CREATE POLICY "Vê o meu role" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin gere roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- specialties: legível por autenticados; só admin escreve
CREATE POLICY "Specialties leitura auth" ON public.specialties FOR SELECT TO authenticated USING (true);
CREATE POLICY "Specialties admin" ON public.specialties FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- rooms
CREATE POLICY "Rooms leitura staff" ON public.rooms FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Rooms admin" ON public.rooms FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- procedure_catalog
CREATE POLICY "Catálogo leitura auth" ON public.procedure_catalog FOR SELECT TO authenticated USING (true);
CREATE POLICY "Catálogo admin" ON public.procedure_catalog FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- professionals
CREATE POLICY "Prof leitura auth" ON public.professionals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Prof admin escreve" ON public.professionals FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- patients
CREATE POLICY "Pac staff lê tudo" ON public.patients FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'rececionista'));
CREATE POLICY "Pac médico vê seus" ON public.patients FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'medico') AND EXISTS (
    SELECT 1 FROM public.appointments a
    JOIN public.professionals pr ON pr.id = a.professional_id
    WHERE a.patient_id = patients.id AND pr.user_id = auth.uid()
  ));
CREATE POLICY "Pac próprio vê" ON public.patients FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Pac staff escreve" ON public.patients FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'rececionista'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'rececionista'));

-- appointments
CREATE POLICY "Appt staff lê" ON public.appointments FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'rececionista'));
CREATE POLICY "Appt médico vê suas" ON public.appointments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.professionals pr WHERE pr.id = appointments.professional_id AND pr.user_id = auth.uid()));
CREATE POLICY "Appt paciente vê suas" ON public.appointments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.patients p WHERE p.id = appointments.patient_id AND p.user_id = auth.uid()));
CREATE POLICY "Appt staff escreve" ON public.appointments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'rececionista'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'rececionista'));
CREATE POLICY "Appt médico atualiza estado" ON public.appointments FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.professionals pr WHERE pr.id = appointments.professional_id AND pr.user_id = auth.uid()));

-- procedures
CREATE POLICY "Proc staff lê" ON public.procedures FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'rececionista'));
CREATE POLICY "Proc médico vê seus" ON public.procedures FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.appointments a
    JOIN public.professionals pr ON pr.id = a.professional_id
    WHERE a.id = procedures.appointment_id AND pr.user_id = auth.uid()
  ));
CREATE POLICY "Proc staff escreve" ON public.procedures FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'rececionista'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'rececionista'));
CREATE POLICY "Proc médico escreve seus" ON public.procedures FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.appointments a
    JOIN public.professionals pr ON pr.id = a.professional_id
    WHERE a.id = procedures.appointment_id AND pr.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.appointments a
    JOIN public.professionals pr ON pr.id = a.professional_id
    WHERE a.id = procedures.appointment_id AND pr.user_id = auth.uid()
  ));
