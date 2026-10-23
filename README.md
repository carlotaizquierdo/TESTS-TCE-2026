# Tests TCE 2026 · Contratación, Logística, IVA y Aduanas

Aplicación de práctica para el Programa de Técnicos de Comercio Exterior 2026.

## Materias disponibles
- **Contratación Internacional**: 320 preguntas del banco preexistente \(`data/derecho.json`\).
- **Logística y Transporte Internacional (Incoterms® 2020)**: 233 preguntas, organizadas en 14 bloques \(`data/logistica.json`\).

Se presentan estas cuatro materias en el selector, con bancos independientes. Los bancos antiguos de otras asignaturas se conservan en el historial del repositorio y en sus archivos sin cargarse en la aplicación.

## Funciones

- Cuatro alternativas por pregunta, con orden barajado.
- Aciertos +1, errores −0,33, blancos 0.
- Selección de asignatura, número de preguntas y dificultad.
- Corrección, explicación y repaso de fallos al terminar.
- Estadísticas por las dos asignaturas, y guardado local del historial.
- Sincronización opcional de resultados con Google Sheets.
- Diseño responsive e instalable desde el navegador.

## Alcance de Logística

Incluye Incoterms® 2020, costes y riesgos, seguros, responsabilidad del transportista y DEG, documentación AWB/B/L/CMR, identificación de CIM, agentes IATA, contenedores 20' y 40', transporte marítimo, aéreo y carretera, y casos de cálculo.

Se excluyen mercancías especiales y el desarrollo del ferrocarril, siguiendo las indicaciones del profesor. El AWB y el CMR son no negociables; determinados B/L marítimos sí pueden serlo.

## Publicar / abrir

El repositorio puede servirse desde GitHub Pages mediante `Settings > Pages > Deploy from a branch > main > /(root)`. Su página mantiene la misma dirección si ya estaba configurada.

Las estadísticas y la conexión con Sheets se guardan en el navegador. No se borran los intentos anteriores del dispositivo, aunque la vista filtra otras asignaturas.

- **IVA · Comercio exterior**: 24 casos prácticos del archivo «2026-10-19 IVA RESUMEN.pdf» (`data/iva.json`).
- **Regímenes Aduaneros**: 28 casos prácticos del archivo «2026-10-19 RESUMEN REGÍMENES ADUANEROS.pdf» (`data/aduanas.json`).

Las 52 preguntas nuevas tienen cuatro alternativas y respuesta correcta equilibrada A/B/C/D. Están fundamentadas en los resúmenes del curso, no constituyen una actualización normativa exhaustiva.
