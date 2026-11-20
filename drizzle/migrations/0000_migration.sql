CREATE TABLE public.resultados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha timestamptz NOT NULL DEFAULT now(),
  empresa text,
  rango_edad text NOT NULL,
  situacion text NOT NULL,
  perfil text NOT NULL,
  energia text NOT NULL,
  interes_1 text NOT NULL,
  interes_2 text NOT NULL,
  calificacion smallint NOT NULL CHECK (calificacion BETWEEN 1 AND 5)
);
GRANT INSERT ON public.resultados TO anon, authenticated;
GRANT ALL ON public.resultados TO service_role;
ALTER TABLE public.resultados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Inserción anónima" ON public.resultados FOR INSERT TO anon, authenticated
WITH CHECK (energia IN ('baja','suficiente') AND perfil IN ('A','B','C') AND char_length(coalesce(empresa,'')) <= 80);