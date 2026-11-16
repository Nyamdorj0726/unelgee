/**
 * МТ-7 · Үнэлгээний апп — Google Sheets backend
 * Энэ кодыг Google Sheets → Extensions → Apps Script дотор бүхэлд нь хуулж тавина.
 * Дараа нь Deploy → New deployment → Web app (Execute as: Me, Who has access: Anyone).
 */

const PEER_SHEET = "Найзын үнэлгээ";
const QUIZ_SHEET = "Бататгах асуулт";

const PEER_HEADERS = ["time", "cls", "evaluator", "student",
  "d1a", "d1b", "d2a", "d2b", "d2c", "d2d", "d2e", "d3a", "d3b",
  "t1", "t2", "t3", "total"];
const PEER_TITLES = ["Огноо", "Анги", "Үнэлсэн сурагч", "Үнэлүүлсэн сурагч",
  "Д1: Нэр зөв (6)", "Д1: Хэмжээ зөв (6)", "Д2: Хавтас (2)", "Д2: Зураг (2)", "Д2: Хэмжээ (1)",
  "Д2: Диск/хавтас/хаяг (3)", "Д2: C диск (3)", "Д3: Бодолт (2)", "Д3: Зөвлөгөө (3)",
  "Даалгавар 1 (12)", "Даалгавар 2 (11)", "Даалгавар 3 (5)", "Нийт (28)"];

const QUIZ_HEADERS = ["time", "cls", "name", "q1", "ok1", "q2", "ok2", "q3", "ok3", "q4", "ok4", "score"];
const QUIZ_TITLES = ["Огноо", "Анги", "Сурагч", "Асуулт 1 хариулт", "А1 зөв", "Асуулт 2 хариулт", "А2 зөв",
  "Асуулт 3 хариулт", "А3 зөв", "Асуулт 4 хариулт", "А4 зөв", "Оноо (4)"];

function sheet_(name, titles) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(titles);
    sh.getRange(1, 1, 1, titles.length).setFontWeight("bold").setBackground("#1B2A41").setFontColor("#F6F4EE");
    sh.setFrozenRows(1);
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function clean_(v, maxLen) {
  return String(v == null ? "" : v).replace(/^[=+\-@]/, "'").slice(0, maxLen || 60);
}
function num_(v, max) {
  const n = Math.round(Number(v));
  return isNaN(n) ? 0 : Math.max(0, Math.min(max, n));
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const d = JSON.parse(e.postData.contents);
    const now = new Date();
    if (d.type === "peer") {
      const max = { d1a: 6, d1b: 6, d2a: 2, d2b: 2, d2c: 1, d2d: 3, d2e: 3, d3a: 2, d3b: 3 };
      const s = {};
      Object.keys(max).forEach(k => s[k] = num_(d[k], max[k]));
      const t1 = s.d1a + s.d1b, t2 = s.d2a + s.d2b + s.d2c + s.d2d + s.d2e, t3 = s.d3a + s.d3b;
      sheet_(PEER_SHEET, PEER_TITLES).appendRow([now, clean_(d.cls, 10), clean_(d.evaluator), clean_(d.student),
        s.d1a, s.d1b, s.d2a, s.d2b, s.d2c, s.d2d, s.d2e, s.d3a, s.d3b, t1, t2, t3, t1 + t2 + t3]);
    } else if (d.type === "quiz") {
      const row = [now, clean_(d.cls, 10), clean_(d.name)];
      let score = 0;
      for (let i = 1; i <= 4; i++) {
        const ok = num_(d["ok" + i], 1);
        score += ok;
        row.push(clean_(d["q" + i], 40), ok);
      }
      row.push(score);
      sheet_(QUIZ_SHEET, QUIZ_TITLES).appendRow(row);
    } else {
      return json_({ ok: false, error: "unknown type" });
    }
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function rows_(name, titles, headers) {
  const sh = sheet_(name, titles);
  const values = sh.getDataRange().getValues();
  values.shift();
  return values.map(r => {
    const o = {};
    headers.forEach((h, i) => o[h] = (r[i] instanceof Date) ? r[i].toISOString() : r[i]);
    return o;
  });
}

function doGet(e) {
  if (e && e.parameter && e.parameter.action === "list") {
    return json_({
      ok: true,
      peer: rows_(PEER_SHEET, PEER_TITLES, PEER_HEADERS),
      quiz: rows_(QUIZ_SHEET, QUIZ_TITLES, QUIZ_HEADERS)
    });
  }
  return json_({ ok: true, message: "МТ-7 үнэлгээний сервер ажиллаж байна" });
}
