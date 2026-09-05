CREATE TABLE public.time_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  clock_in timestamptz NOT NULL DEFAULT now(),
  clock_out timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_time_entries_user_in ON public.time_entries(user_id, clock_in DESC);

GRANT SELECT, INSERT, UPDATE ON public.time_entries TO authenticated;
GRANT ALL ON public.time_entries TO service_role;

ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own time entries" ON public.time_entries
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users insert own time entries" ON public.time_entries
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own time entries" ON public.time_entries
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_time_entries_updated BEFORE UPDATE ON public.time_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Regra dos 5 minutos
CREATE OR REPLACE FUNCTION public.validate_time_entry()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  last_out timestamptz;
  open_count int;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT count(*) INTO open_count FROM time_entries
      WHERE user_id = NEW.user_id AND clock_out IS NULL;
    IF open_count > 0 THEN
      RAISE EXCEPTION 'Já existe uma entrada em aberto. Registe a saída primeiro.';
    END IF;
    SELECT max(clock_out) INTO last_out FROM time_entries WHERE user_id = NEW.user_id;
    IF last_out IS NOT NULL AND NEW.clock_in < last_out + interval '5 minutes' THEN
      RAISE EXCEPTION 'Intervalo mínimo de 5 minutos entre a última saída e uma nova entrada.';
    END IF;
  END IF;
  IF NEW.clock_out IS NOT NULL THEN
    IF NEW.clock_out < NEW.clock_in + interval '5 minutes' THEN
      RAISE EXCEPTION 'A saída tem de ser registada pelo menos 5 minutos após a entrada.';
    END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_time_entries_validate BEFORE INSERT OR UPDATE ON public.time_entries
  FOR EACH ROW EXECUTE FUNCTION public.validate_time_entry();