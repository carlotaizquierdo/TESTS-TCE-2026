/**
 * TCE 2026 · sincronización de GitHub Pages con Google Sheets.
 *
 * IMPORTANTE:
 * 1) Abre la hoja "Seguimiento TCE 2026".
 * 2) Extensiones > Apps Script.
 * 3) Pega este archivo en Code.gs.
 * 4) Implementar > Nueva implementación > Aplicación web.
 *    - Ejecutar como: Tú
 *    - Quién tiene acceso: Cualquiera
 * 5) Copia la URL que termina en /exec y pégala en
 *    Tests TCE > Estadísticas > Google Sheets.
 *
 * El endpoint NO se guarda en GitHub: la web lo conserva en localStorage
 * únicamente en el dispositivo donde lo configures.
 */

const TCE_SHEETS = {
  plan: "Seguimiento Examen 1",
  history: "Historial tests",
  config: "Config"
};

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function workbook_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error('Este script debe crearse desde Extensiones > Apps Script dentro de "Seguimiento TCE 2026".');
  }
  return ss;
}

function configMap_(ss) {
  const sh = ss.getSheetByName(TCE_SHEETS.config);
  if (!sh) throw new Error('No existe la hoja "Config".');
  const last = sh.getLastRow();
  const values = last >= 2 ? sh.getRange(2, 1, last - 1, 4).getValues() : [];
  const map = {};
  values.forEach(r => {
    const key = String(r[0] || "").trim();
    if (!key) return;
    map[key] = {
      title: String(r[1] || "").trim(),
      planTitles: [r[2], r[3]].map(x => String(x || "").trim()).filter(Boolean)
    };
  });
  return map;
}

function markPlanTests_(ss, config, keys) {
  const sh = ss.getSheetByName(TCE_SHEETS.plan);
  if (!sh || sh.getLastRow() < 7) return;
  const startRow = 7;
  const names = sh.getRange(startRow, 3, sh.getLastRow() - startRow + 1, 1).getDisplayValues().flat();
  keys.forEach(key => {
    const item = config[key];
    if (!item) return;
    item.planTitles.forEach(title => {
      const idx = names.indexOf(title);
      if (idx >= 0) sh.getRange(startRow + idx, 5).setValue(true);
    });
  });
}

function doGet() {
  return json_({ ok: true, service: "TCE Sheets Sync" });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const payload = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    if (payload.action === "ping") return json_({ ok: true });

    if (payload.action !== "quiz_completed") {
      return json_({ ok: false, error: "Acción no reconocida" });
    }

    const testId = String(payload.testId || "").trim();
    const subjects = Array.isArray(payload.subjects) ? payload.subjects : [];
    if (!testId || !subjects.length) {
      return json_({ ok: false, error: "Faltan testId o subjects" });
    }

    const ss = workbook_();
    const history = ss.getSheetByName(TCE_SHEETS.history);
    if (!history) throw new Error('No existe la hoja "Historial tests".');

    const config = configMap_(ss);
    const lastRow = history.getLastRow();
    const existing = lastRow > 1 ? history.getRange(2, 2, lastRow - 1, 2).getValues() : [];
    const seen = new Set(existing.map(r => String(r[0]) + "|" + String(r[1])));
    const when = payload.date ? new Date(payload.date) : new Date();
    const origin = String(payload.origin || "Tests TCE");
    const rows = [];
    const keysToMark = [];

    subjects.forEach(s => {
      const key = String(s.key || "").trim();
      if (!key || !config[key]) return;
      const unique = testId + "|" + key;
      keysToMark.push(key);
      if (seen.has(unique)) return;

      rows.push([
        when,
        testId,
        key,
        config[key].title || String(s.name || key),
        Number(s.questions || 0),
        Number(s.ok || 0),
        Number(s.bad || 0),
        Number(s.blank || 0),
        Number(s.grade || 0),
        origin
      ]);
      seen.add(unique);
    });

    if (rows.length) {
      history.getRange(history.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
    }
    markPlanTests_(ss, config, [...new Set(keysToMark)]);

    return json_({ ok: true, inserted: rows.length });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message ? err.message : err) });
  } finally {
    lock.releaseLock();
  }
}
