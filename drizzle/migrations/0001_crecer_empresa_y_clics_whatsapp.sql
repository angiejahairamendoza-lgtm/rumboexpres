ALTER TABLE public.resultados ADD COLUMN crecer_empresa text;
ALTER TABLE public.resultados ADD CONSTRAINT resultados_crecer_empresa_valido CHECK (crecer_empresa IS NULL OR crecer_empresa IN ('Sí', 'No', 'Todavía no lo sé'));
CREATE TABLE public.clics_whatsapp (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha timestamptz NOT NULL DEFAULT now(),
  empresa text,
  perfil text NOT NULL
);
GRANT INSERT ON public.clics_whatsapp TO anon, authenticated;
GRANT ALL ON public.clics_whatsapp TO service_role;
ALTER TABLE public.clics_whatsapp ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Inserción anónima" ON public.clics_whatsapp FOR INSERT TO anon, authenticated WITH CHECK (perfil IN ('A', 'B', 'C') AND char_length(COALESCE(empresa, '')) <= 80);