/**
 * Learn Forge registration backend.
 * Paste this into a Google Sheet: Extensions > Apps Script. See README.md.
 *
 * GET  ?action=count  returns { ok, count, capacity, open }. Nothing else is public.
 * POST (JSON body)    saves one registration, enforces the seat limit and blocks duplicate emails.
 */

var SHEET_NAME = "Registrations";
var CAPACITY = 40; // keep in sync with capacity in config.js
var HEADERS = ["Timestamp", "Name", "Email", "College", "Year", "Branch", "Interests"];
var FREE_MAIL = /@(gmail|googlemail|yahoo|ymail|outlook|hotmail|live|icloud|proton|protonmail)\./i;

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
  }
  return sh;
}

function countRows_(sh) {
  return Math.max(0, sh.getLastRow() - 1);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Keeps spreadsheet formulas out of the sheet.
function clean_(v, max) {
  var s = String(v == null ? "" : v).replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max || 200);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function doGet() {
  var n = countRows_(getSheet_());
  return json_({ ok: true, count: n, capacity: CAPACITY, open: n < CAPACITY });
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
  } catch (err) {
    return json_({ ok: false, status: "busy" });
  }

  try {
    var d = JSON.parse(e.postData.contents);

    // Hidden spam trap field. Real students leave it empty.
    if (d.website) return json_({ ok: true, status: "saved" });

    var name = clean_(d.name, 100);
    var email = String(d.email || "").trim().toLowerCase().slice(0, 120);
    var college = clean_(d.college, 140);
    var year = clean_(d.year, 40);
    var branch = clean_(d.branch, 100);
    var interests = (Array.isArray(d.interests) ? d.interests : []).slice(0, 10).map(function (i) { return clean_(i, 60); });

    if (name.length < 2 || college.length < 3 || !year || branch.length < 2 || !interests.length ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || FREE_MAIL.test(email)) {
      return json_({ ok: false, status: "invalid" });
    }

    var sh = getSheet_();
    var n = countRows_(sh);

    if (n > 0) {
      var emails = sh.getRange(2, 3, n, 1).getValues();
      for (var i = 0; i < emails.length; i++) {
        if (String(emails[i][0]).toLowerCase() === email) {
          return json_({ ok: true, status: "duplicate", count: n });
        }
      }
    }

    if (n >= CAPACITY) return json_({ ok: false, status: "full", count: n });

    sh.appendRow([new Date(), name, email, college, year, branch, interests.join("; ")]);
    return json_({ ok: true, status: "saved", count: n + 1 });
  } catch (err) {
    return json_({ ok: false, status: "error" });
  } finally {
    lock.releaseLock();
  }
}
