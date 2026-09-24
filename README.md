# TESTS TCE 2026

Aplicación de estudio para el Programa de Técnicos de Comercio Exterior 2026.

## Funcionamiento
- Tests de 4 opciones.
- +1 respuesta correcta.
- -0,33 respuesta incorrecta.
- 0 en blanco.
- Selección de asignaturas, dificultad y número de preguntas.
- Cada intento genera una tanda nueva a partir de conceptos del temario, con variación de formulación, distractores y orden.
- Evita repetir en exceso conceptos vistos recientemente.
- Prioriza contenido marcado como EXAMEN/clave y conceptos fallados.
- Repetición de falladas.
- Historial y estadísticas guardadas localmente en el dispositivo.
- Sincronización opcional con Google Sheets: registra cada test por asignatura, nota, aciertos/fallos y marca automáticamente "Test hecho" en el plan de repaso.
- Carga local de PDF, DOCX y TXT para crear ejercicios sin coste de IA.
- PWA instalable en iPad mediante Safari > Compartir > Añadir a pantalla de inicio.

## Temario inicial
1. Estrategias de Negocios Internacionales (I y II)
2. Cross Cultural
3. COCIM (Presentación)
4. Internet como Fuente de Información de Comercio Internacional (I y II)
5. Protocolo (I y II)
6. Instrumentos de Análisis Económicos
7. Instituciones Multilaterales / Taller de Multilaterales (I y II)
8. Fundamentos de Economía
9. Contratación Internacional Derecho

## Publicación gratuita
Para GitHub Pages gratuito con una cuenta personal, lo más sencillo es mantener el repositorio público y después activar Pages desde Settings > Pages, rama main, carpeta /(root).

La generación local no requiere API ni servicio de IA de pago. Puede añadirse más adelante un proveedor con cuota gratuita para preguntas más sofisticadas.


## Sincronización con Google Sheets
La web sigue siendo estática y gratuita en GitHub Pages. Para escribir en una hoja privada de Google Sheets se usa un Web App gratuito de Google Apps Script.

1. Abre la hoja de seguimiento en Google Sheets.
2. Ve a **Extensiones > Apps Script**.
3. Copia el contenido de `google-apps-script/Code.gs` en `Code.gs`.
4. Ve a **Implementar > Nueva implementación > Aplicación web**.
5. Selecciona **Ejecutar como: Tú** y **Quién tiene acceso: Cualquiera**.
6. Copia la URL terminada en `/exec`.
7. En Tests TCE abre **Estadísticas > Google Sheets**, pega la URL y pulsa **Guardar conexión**.

La URL del Web App se guarda únicamente en `localStorage` del dispositivo y no se publica en el repositorio.
