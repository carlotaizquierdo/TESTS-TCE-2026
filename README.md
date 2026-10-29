# Tests TCE 2026 — Banco nuevo para el tercer examen (27/10/2026)

**Estado:** banco antiguo sustituido por preguntas nuevas en las cinco materias con apuntes disponibles.
Las cuatro alternativas se barajan en cada test, y todas las preguntas tienen explicación y fuente.

| Asignatura del Excel | Clave de la app | Preguntas nuevas | Peso estimado del examen |
|---|---|---:|---:|
| Técnicas aduaneras e IVA | `aduanas` | 37 | 12 |
| Contratación internacional | `derecho` | 25 | 8 |
| Medios de pago, avales y CESCE | `pagos` | 22 | 8 |
| Técnicas de negociación | `negociacion` | 22 | 5 |
| Logística y transporte internacional | `logistica` | 209 | 3 |

**Logística (29/10/2026):** banco sustituido por 209 preguntas conceptuales, sin cálculos, generadas a partir de los «Apuntes de Logística» (notas y transcripciones de clase): Incoterms, responsabilidad del transportista, seguro, marítimo y B/L, contenedores, cotización, aéreo y terrestre. Los recuentos de las demás asignaturas pueden haber cambiado desde la tabla.

**Total inicial: 131 preguntas nuevas.** No se carga el antiguo banco separado de IVA; `data/iva.json` está vacío. Se sustituyeron por completo los bancos de Contratación, Logística y Aduanas.

## Fuentes y cobertura temporal
Fuentes: archivos de la carpeta `Tercer parcial` de Google Drive, incluidos `Técnicas de Negociación · Apuntes desarrollados` (27/10), `Apuntes · Medios de pago (diap. 1-34)` (26/10), `Apuntes_Transporte_Internacional_Incoterms_2020_Oposicion`, `Contratación Internacional · Apuntes desarrollados`, `Natalia Aduanas Viernes` y los resúmenes de IVA / Regímenes Aduaneros.

La parte de Medios de Pago recoge lo explicado hasta las diapositivas 1-34 y no debe interpretarse como cobertura de futuras clases sobre avales/CESCE. Hay otros seis bloques de una o dos preguntas previstos en el Excel (Documental, China, Seguimiento, Inversiones, Emprendimiento, ALSA) sin nuevos apuntes en sus subcarpetas de `Tercer parcial` a la fecha del trabajo, por lo que no se han inventado preguntas.

## Criterios
- Casos con hechos suficientes, no memorización del artículo ni preguntas «¿qué respuesta es correcta?».
- Distractores verosímiles sin patrón fijo de opción correcta.
- Explicaciones para revisar el error de razonamiento.
- Nivel medio o difícil (mayoritariamente difícil).
- Para tests de varias asignaturas, selección ponderada de las cinco materias por el Excel (12/8/8/5/3), sin crear contenidos ficticios de las pendientes.
- Calificación: +1 acierto, −0,33 error, 0 blanco.
- Estadísticas anteriores conservadas en el dispositivo, sin incorporarlas al nuevo banco.

## Sincronización de resultados con Google Sheets
El archivo `google-apps-script/Code.gs` está corregido en el repositorio. **GitHub no despliega Apps Script de forma automática.** Para activar esta versión:
1. Abrir el Sheet `Seguimiento TCE 2026 - Examen 3 y tests`.
2. Menú Extensiones → Apps Script → sustituir Code.gs por el archivo de este repositorio y guardar.
3. Crear o actualizar implementación web (ejecutar como propietario y gestionar acceso con cuidado).
4. En Tests TCE → Estadísticas → Google Sheets, pegar la URL `/exec` si fuese distinta.
5. Completar un test y comprobar manualmente en la pestaña `Historial tests` que la conexión funciona. El navegador no puede confirmar una entrega con modo `no-cors`.

## Publicación
La app permanece en GitHub Pages si ya se desplegó desde la rama `main`. Los JSON se solicitan sin caché y con versión de fecha 20261027. Si se usa como icono de iPad, cerrar y reabrir para forzar la actualización.
