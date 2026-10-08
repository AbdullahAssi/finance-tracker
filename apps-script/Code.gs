/**
 * Expense Tracker – Google Sheets backend.
 *
 * Paste this into Extensions > Apps Script of your Google Sheet, then deploy it as a Web app
 * (see README.md). The app sends queued changes here and gets the full sheet contents back.
 */

// Optional but recommended: set the same value in the app (Settings > Google Sheet > Secret).
var SECRET = '';

var TX_HEADERS = ['id', 'type', 'amount', 'date', 'category', 'method', 'note', 'updatedAt'];
var CAT_HEADERS = ['id', 'name', 'icon', 'budget'];
// Columns stored as plain text so Sheets never turns dates or notes into other types
var TX_TEXT_COLS = [1, 2, 4, 5, 6, 7];
var CAT_TEXT_COLS = [1, 2, 3];

function doGet() {
  return json_({ ok: true, message: 'Expense Tracker script is running.' });
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var body = JSON.parse(e.postData.contents);
    if (SECRET && body.token !== SECRET) return json_({ ok: false, error: 'Wrong secret.' });

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var txSheet = getSheet_(ss, 'Transactions', TX_HEADERS);
    var catSheet = getSheet_(ss, 'Categories', CAT_HEADERS);
    var txs = readRows_(txSheet, TX_HEADERS);
    var cats = readRows_(catSheet, CAT_HEADERS);

    var ops = body.ops || [];
    var txChanged = false;
    var catChanged = false;

    ops.forEach(function (op) {
      if (op.kind === 'upsert') {
        var i = indexOfId_(txs, op.tx.id);
        if (i === -1) txs.push(op.tx);
        else txs[i] = op.tx;
        txChanged = true;
      } else if (op.kind === 'delete') {
        txs = txs.filter(function (t) { return String(t.id) !== String(op.id); });
        txChanged = true;
      } else if (op.kind === 'categories') {
        cats = op.categories;
        catChanged = true;
      } else if (op.kind === 'replaceAll') {
        txs = op.transactions;
        cats = op.categories;
        txChanged = true;
        catChanged = true;
      }
    });

    if (txChanged) writeRows_(txSheet, TX_HEADERS, txs, TX_TEXT_COLS);
    if (catChanged) writeRows_(catSheet, CAT_HEADERS, cats, CAT_TEXT_COLS);

    return json_({ ok: true, transactions: txs, categories: cats });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function getSheet_(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    sheet.setFrozenRows(1);
  } else {
    // Upgrade older sheets in place when a new column (e.g. budget) has been added
    var current = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
    if (current.join('|') !== headers.join('|')) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    }
  }
  return sheet;
}

function indexOfId_(rows, id) {
  for (var i = 0; i < rows.length; i++) if (String(rows[i].id) === String(id)) return i;
  return -1;
}

function readRows_(sheet, headers) {
  var last = sheet.getLastRow();
  if (last < 2) return [];
  var tz = Session.getScriptTimeZone();
  var values = sheet.getRange(2, 1, last - 1, headers.length).getValues();
  var rows = [];
  values.forEach(function (row) {
    if (row[0] === '' || row[0] === null) return;
    var obj = {};
    headers.forEach(function (h, i) {
      var v = row[i];
      if (v instanceof Date) v = Utilities.formatDate(v, tz, 'yyyy-MM-dd');
      obj[h] = v;
    });
    rows.push(obj);
  });
  return rows;
}

function writeRows_(sheet, headers, rows, textCols) {
  var last = sheet.getLastRow();
  if (last > 1) sheet.getRange(2, 1, last - 1, headers.length).clearContent();
  if (rows.length === 0) return;
  var range = sheet.getRange(2, 1, rows.length, headers.length);
  textCols.forEach(function (c) {
    sheet.getRange(2, c, rows.length, 1).setNumberFormat('@');
  });
  range.setValues(
    rows.map(function (r) {
      return headers.map(function (h) { return r[h] === undefined || r[h] === null ? '' : r[h]; });
    })
  );
}
