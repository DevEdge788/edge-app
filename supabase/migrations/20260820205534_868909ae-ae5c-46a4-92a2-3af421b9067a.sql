CREATE TYPE public.notification_channel AS ENUM ('sms','whatsapp','email');
CREATE TYPE public.confirmation_status AS ENUM ('pendente','confirmada','recusada','reagendar');
CREATE TYPE public.notification_status AS ENUM ('simulado','enviado','falhado');

CREATE TABLE public.appointment_confirmations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  channel public.notification_channel NOT NULL,
  status public.confirmation_status NOT NULL DEFAULT 'pendente',
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(18),'hex'),
  sent_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  response_source text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_appt_conf_appt ON public.appointment_confirmations(appointment_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointment_confirmations TO authenticated;
GRANT ALL ON public.appointment_confirmations TO service_role;
ALTER TABLE public.appointment_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff gere confirmacoes" ON public.appointment_confirmations
  FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Paciente ve as suas confirmacoes" ON public.appointment_confirmations
  FOR SELECT TO authenticated USING (EXISTS (
    SELECT 1 FROM public.appointments a JOIN public.patients p ON p.id = a.patient_id
    WHERE a.id = appointment_confirmations.appointment_id AND p.user_id = auth.uid()));

CREATE POLICY "Paciente responde as suas confirmacoes" ON public.appointment_confirmations
  FOR UPDATE TO authenticated USING (EXISTS (
    SELECT 1 FROM public.appointments a JOIN public.patients p ON p.id = a.patient_id
    WHERE a.id = appointment_confirmations.appointment_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.appointments a JOIN public.patients p ON p.id = a.patient_id
    WHERE a.id = appointment_confirmations.appointment_id AND p.user_id = auth.uid()));

CREATE TABLE public.notification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL,
  confirmation_id uuid REFERENCES public.appointment_confirmations(id) ON DELETE SET NULL,
  channel public.notification_channel NOT NULL,
  provider text NOT NULL DEFAULT 'mock',
  template text NOT NULL DEFAULT 'lembrete_consulta',
  recipient text,
  content text,
  status public.notification_status NOT NULL DEFAULT 'simulado',
  error_message text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notif_logs_created ON public.notification_logs(created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_logs TO authenticated;
GRANT ALL ON public.notification_logs TO service_role;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff gere logs de notificacao" ON public.notification_logs
  FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));