# Rumboexpres

Construye la app completa "RUMBO Exprés" descrita en el PRD de abajo, en un solo paso.

Instrucciones de construcción:
- Toda la interfaz en español, tuteando. Respeta textualmente los textos entre comillas del PRD.
- Mobile first, con la marca de la sección 6 (azul marino #0B1F4B, turquesa #2BE3E5, turquesa claro #E8F8F9, fondo blanco, tipografía Nunito de Google Fonts).
- Rutas: "/" (enlace público) y "/e/:empresa" (enlace de empresa); mismo flujo.
- Habilita Lovable Cloud solo para una tabla anónima `resultados` con los campos de la sección 8 (fecha, empresa, rango_edad, situacion, perfil, energia, interes_1, interes_2, calificacion). No guardes nada más.
- Usa Lovable AI desde una función del servidor para dos llamadas con salida JSON estructurada: (1) traducir habilidades (Paso 4) y (2) generar la ruta de 30 días (Paso 6), siguiendo al pie de la letra las reglas del PRD.
- El cálculo del Paso 5 se hace en el navegador y no se guarda.
- PDF descargable generado en el navegador con la marca.
- Estado del flujo en memoria/sesión del navegador; botón "Atrás" en cada paso; barra de progreso.

=== PRD ===

# PRD — RUMBO Exprés

Autora: Licda. Angie Mendoza, psicóloga clínica y orientadora vocacional (colegiada 6959) · En Mente y Cuerpo

## 1. Problema
La mayoría entra a un call center de paso y se queda años creyendo que no tiene experiencia para otro trabajo. Barreras: el dinero (sueldo mejor que el mercado de entrada, deudas), el cansancio (sin energía al terminar el turno), el encasillamiento ("solo aprendí a aguantar") y planes distintos (trampolín, crecer dentro, sin plan).

## 2. Usuarios
Personas que trabajan o trabajaron en un call center en Guatemala (con otro empleo, por su cuenta o buscando trabajo). Usan el celular, cansadas y con poco tiempo. Empresas de call center que la ofrecen como beneficio.

## 3. Solución
App web mobile first, unos 25 minutos, sin cuenta y sin nombre. Versión breve del Programa RUMBO con criterio psicológico. Al final: perfil, intereses, valores, habilidades traducidas, margen de estabilidad económica y ruta de 30 días con mini guía por paso, descargable en PDF.

## 4. Dos formas de entrar
- Enlace público: `/`
- Enlace de empresa: `/e/:empresa`. La persona no escribe código. El identificador solo agrupa datos anónimos.

## 5. Flujo
Barra de progreso de 6 pasos. Botón "Atrás". Una pregunta o bloque por pantalla.

### Paso 0 — Bienvenida
- Título: "Las habilidades que usas en tu trabajo de call center son muy valiosas en muchas industrias."
- Texto: "En unos 25 minutos vas a ver lo que sí sabes hacer y vas a salir con una ruta de 30 días. No necesitas cuenta. No guardamos tu nombre."
- Aviso: "Tus resultados se basan en el Programa RUMBO, creado por una psicóloga clínica. Usamos inteligencia artificial solo para redactarlos. No guardamos tu nombre ni tus respuestas. Esta herramienta no reemplaza un proceso terapéutico."
- Botón "Empezar".

### Paso 1 — ¿Cómo está tu energía?
"En las últimas dos semanas…" (basado en el WHO-5). Opciones para cada frase: Todo el tiempo (5) · Casi todos los días (4) · Bastantes días (3) · Algunos días (2) · Pocas veces (1) · Nunca (0).
1. Me he sentido alegre y de buen humor. 2. Me he sentido tranquilo/a y relajado/a. 3. Me he sentido activo/a y con energía. 4. Me he despertado fresco/a y descansado/a. 5. Mi vida diaria ha tenido cosas que me interesan.
Más: "Al terminar tu jornada, ¿cuánta energía te queda para tus propios planes?" (Mucha · Algo · Casi nada).
Reglas: nunca mostrar puntaje, color de alerta ni etiqueta clínica; nadie se detiene. Suma < 13 → energia="baja"; si no "suficiente". Si "baja", al avanzar mostrar: "Lo que sientes es muy común en este trabajo y tiene sentido. No es falta de voluntad: es cansancio acumulado. Tu ruta va a empezar por ahí."

### Paso 2 — Tu situación y tu punto de partida
1. Edad: 18–24 · 25–29 · 30–34 · 35–39 · 40 o más
2. "¿Cuál es tu situación hoy?": Trabajo en un call center · Dejé el call center y tengo otro empleo · Dejé el call center y trabajo por mi cuenta (servicios, negocio propio) · Dejé el call center y estoy buscando trabajo
3. "¿Qué es lo que más necesitas ahora?": Avanzar hacia una meta que ya tengo (A) · Mejores condiciones en lo que ya hago (rol, horario, desgaste) (B) · Que lo que hago me dé suficientes ingresos (A, foco económico) · Descubrir qué quiero hacer (C)
4. "¿Tienes algo en marcha para crecer profesionalmente?": Sí: estudio o tengo un proyecto propio (A → mostrar campo "¿Cuál es tu proyecto o meta? (en una línea)") · Sé qué área o puesto me interesa, pero no he empezado (B) · Todavía nada (C)
5. "Si en un año siguieras igual que hoy, te sentirías…": Tranquilo/a, si mi otro proyecto avanzó (A) · Con ganas de moverme a otra área (B) · Estancado/a, sin avanzar nada (C) · No lo he pensado (C)
6. "Del 0 al 10, ¿qué tan claro tienes tu siguiente paso para crecer profesionalmente?" (deslizador)
Resultado: perfil con más puntos (empate: gana la pregunta 3).
- A — Trampolín: "Ya tienes algo en marcha y lo estás impulsando. Tu reto es que se sostenga, sin agotarte en el camino." (Si eligió "suficientes ingresos": "Ya tienes algo en marcha y lo estás impulsando. Tu reto es que lo que haces se sostenga económicamente, sin agotarte en el camino.")
- B — Crecer aquí: "Quieres seguir en tu área, en un rol o con condiciones que te desgasten menos."
- C — Buscando rumbo: "Todavía no ves con claridad tu siguiente paso, y está bien empezar desde aquí. Tu ruta va a ir con pasos pequeños que te devuelvan la sensación de avance."
Nunca lenguaje clínico.

### Paso 3 — Tus intereses y valores
A. "Marca las 4 actividades que más disfrutarías hacer." (inspirado en el modelo de Holland; no es un test validado):
Arreglar o configurar equipos y aparatos (Práctico) · Trabajar con las manos o con herramientas (Práctico) · Investigar por qué pasa un problema hasta encontrar la causa (Investigador) · Analizar datos o números para sacar conclusiones (Investigador) · Escribir, diseñar o crear contenido (Creativo) · Proponer ideas nuevas o formas distintas de hacer las cosas (Creativo) · Explicarle a alguien cómo resolver un problema (Social) · Acompañar a personas en momentos difíciles (Social) · Convencer, negociar o vender una idea (Emprendedor) · Coordinar a un equipo y tomar decisiones (Emprendedor) · Revisar que un proceso se haga sin errores (Organizador) · Llevar registros, archivos o agendas en orden (Organizador)
Resultado: los 2 tipos con más marcas, con una frase y áreas donde se combinan. Ej.: "Investigar y organizar: te atrae entender las cosas a fondo y ponerlas en orden. Se combinan en análisis de calidad, gestión de casos, investigación aplicada y administración de servicios."
B. "¿Qué es lo que más valoras en un trabajo? Elige 3.": Estabilidad económica · Autonomía · Ayudar a otros · Aprender y crecer · Reconocimiento · Equilibrio con mi vida personal · Crear cosas nuevas · Trabajar en equipo · Prestaciones y seguridad
C. "¿Qué condición de trabajo te haría más falta? Elige hasta 2.": Sin monitoreo constante · Horario fijo · Trabajo remoto · Menos llamadas · Un espacio tranquilo · Ingresos más altos aunque sean variables

### Paso 4 — Tus habilidades, traducidas (IA)
- "Escribe de 3 a 5 cosas que haces o hacías en tu trabajo, con tus palabras. No hay respuestas correctas."
- 3 a 5 campos con chips de ejemplo que llenan el campo: "Calmo a clientes molestos", "Manejo varios sistemas a la vez", "Cumplo metas de tiempo y calidad", "Atiendo en inglés", "Capacito a compañeros nuevos".
- Botón "Traducir mis habilidades".
- La IA devuelve por tarea: nombre de la habilidad en lenguaje del mercado (puede incluir término en inglés si es el usual, ej. "Coordinación de servicios de salud y acompañamiento al paciente (patient advocate)"); frase para el CV en primera persona, concreta, sin exagerar; 2 o 3 puestos donde se usa (al menos uno dentro de la industria: back-office, calidad, capacitación, soporte, análisis; y uno fuera).
- La persona marca con estrella sus 3 favoritas ("las que más disfrutas usar, aunque no sean las que mejor dominas").
- Frase editable: "Soy una persona que sabe ___, ___ y ___."

### Paso 5 — Tu margen de estabilidad económica (opcional)
- "No es para decidir si renuncias. Es para saber con qué cuentas hoy. Puedes usar números aproximados, en quetzales."
- Campos: Ingreso mensual aproximado · Gastos fijos indispensables al mes · Ahorros disponibles. Botón "Saltar este paso".
- Cálculo en el navegador: margen = ingreso − gastos; meses de respaldo = ahorros ÷ gastos.
- Margen ≥ 0: "Cada mes te quedan unos Q[margen] después de tus gastos fijos, y tus ahorros te darían unos [meses] meses de respaldo."
- Margen < 0: "Hoy tus gastos fijos superan tus ingresos por unos Q[|margen|] al mes[, y no hay ahorro de respaldo]. Esto no habla de tu capacidad; habla de por dónde conviene empezar tu ruta."

### Paso 6 — Tu ruta de 30 días (IA)
4 semanas, cada una con título y 1 o 2 pasos. Cada paso: título; "Cómo hacerlo" con 2 a 4 instrucciones concretas; "✅ Listo cuando:" señal clara; tiempo estimado (30 min o menos).
Usa: perfil, situación, proyecto o meta, energía, energía al terminar la jornada, claridad 0–10, intereses, valores, condiciones, habilidades favoritas, margen económico.
Reglas para la IA:
- Concreto: cada paso dice qué hacer, con qué y dónde. Mal: "Lleva un registro". Bien: "Lleva un registro semanal de tus sesiones e ingresos: por cada sesión anota fecha, iniciales del cliente, si ya pagó y el monto; cada viernes suma sesiones e ingresos."
- Baja exposición: nada de escribir a desconocidos ni pedir favores en frío. Preferir preguntas abiertas en grupos de Facebook de su área, cálculos, revisión de ofertas, ajustes al CV, materiales propios.
- Si energia="baja": semana 1 "Recuperar energía antes de decidir", con descanso y cuidado del cuerpo, e incluye como opción sin presionar: "Si quieres, puedes conversar con una psicóloga".
- Si el margen es negativo: semana 1 se enfoca en saber cuánto falta y en opciones de ingreso puente que usen sus habilidades favoritas y respeten sus condiciones.
- Si tiene proyecto o meta con números: incluir un paso para calcular cuántos clientes o ventas necesita por semana.
- Usar sus valores y condiciones (ej.: si eligió "Equilibrio con mi vida personal", la revisión de la semana 4 lo incluye).
- Perfil A: sostener el proyecto sin agotarse; ingresos y orden. Perfil B: identificar roles o condiciones mejores en su área y preparar el movimiento. Perfil C: pasos muy pequeños que devuelvan la sensación de avance.
- Nunca recomendar renunciar impulsivamente. Nunca prometer empleo ni ingresos. No dar asesoría financiera profesional.
- Tono de invitación, no de orden. Tutear. Español de Guatemala, neutro.
- Cierra con: "📅 Fecha para revisar tu ruta: [hoy + 30 días]".

### Paso 7 — Cierre
- Resumen en una pantalla: perfil, frase "Soy una persona que sabe…", intereses, valores, habilidades traducidas, margen (si lo llenó) y ruta.
- Botón "Descargar mi plan (PDF)" con la marca. Sin envío por correo.
- "¿Te fue útil?" de 1 a 5 estrellas (anónimo; al calificar se guarda la fila en `resultados`).
- Bloque: "Programa RUMBO, dirigido por la psicóloga Angie Mendoza" / "Si quieres acompañamiento para avanzar, son 4 sesiones contigo y para ti." Botones: "Escribir por WhatsApp" → https://wa.me/50254372899 · "Visitar página web" → https://angiemendoza.lovable.app
- Botón "Empezar de nuevo".

### Siempre visible
Pie de página en todas las pantallas: "¿Necesitas hablar con alguien ahora?" → ventana con WhatsApp de la Licda. Angie Mendoza (https://wa.me/50254372899) y: "Si estás en peligro, llama a los servicios de emergencia de tu país." No depende de ningún resultado.

## 6. Diseño
Azul marino #0B1F4B (títulos), turquesa #2BE3E5 (botones y acentos), turquesa muy claro #E8F8F9 (fondos de campos), fondo blanco. Tipografía Nunito. Botones grandes, textos cortos. Tono sereno y profesional, nada infantil.

## 7. Técnico
Stack por defecto de Lovable. Lovable AI desde función del servidor (dos llamadas, JSON estructurado). Flujo en la sesión del navegador. PDF generado en el navegador.

## 8. Datos y privacidad
No se guarda: nombre, textos escritos, habilidades, proyecto, números económicos ni la ruta. Sí se guarda, anónimo, al terminar: fecha, empresa (si entró por /e/:empresa), rango de edad, situación, perfil, energía (baja/suficiente), los 2 tipos de interés y la calificación 1–5.

## 9. Fuera de alcance
Panel para Recursos Humanos, envío por correo, cuentas, pagos, app descargable.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://rumboexpres.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/82cee465-7bfa-41b4-8679-2eef6a5e2fa5).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
