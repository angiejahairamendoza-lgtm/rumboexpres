import { supabase } from "@/integrations/supabase/client";
import { respuestaCrecerEmpresa, type Perfil } from "./rumbo-data";

export function datosCrecimiento(situacion: number | null, respuesta: string | null) {
  return { crecer_empresa: respuestaCrecerEmpresa(situacion, respuesta) };
}

export async function registrarClicWhatsApp(empresa: string | null, perfil: Perfil) {
  try {
    await supabase.from("clics_whatsapp").insert({ empresa, perfil });
  } catch { /* El conteo no impide abrir WhatsApp. */ }
}