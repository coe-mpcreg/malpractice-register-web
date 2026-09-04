const https = require('https');
const crypto = require('crypto');

// ---------------------------------------------------------------------------
// Column layout (must match across the whole app)
// ---------------------------------------------------------------------------
const REPORT_COLUMNS = [
  'id', 'caseNo', 'dateReported', 'status', 'academicYear', 'campus',
  'programme', 'semType', 'component', 'studentName', 'usn', 'sem',
  'course', 'courseCode', 'examDate', 'examTime', 'roomNo',
  'copyMode', 'copyModeOther', 'reporterRole', 'reporterName', 'description',
  'penaltyDX', 'fineAmount', 'cancelReg', 'notResolvedReason',
  'enteredBy', 'enteredAt', 'lastEditedBy', 'lastEditedAt',
];
const REPORT_HEADER_LABELS = [
  'ID', 'Case No', 'Date Reported', 'Status', 'Academic Year', 'Campus',
  'Programme', 'Semester Type', 'Component', 'Student Name', 'USN', 'Semester',
  'Course', 'Course Code', 'Date of Exam', 'Time', 'Room No',
  'Mode of Copying', 'Mode (Other)', 'Reporter Role', 'Reported By', 'Description',
  'DX Grade', 'Fine Amount', 'Cancel Registration', 'Not Resolved Reason',
  'Entered By', 'Entered At', 'Last Edited By', 'Last Edited At',
];
const REPORTS_SHEET = 'Reports';
const REPORTS_LAST_COL = 'AD';

const USER_COLUMNS = ['userId', 'label', 'password'];
const USER_HEADER_LABELS = ['User ID', 'Label', 'Password'];
const USERS_SHEET = 'Users';
const USERS_LAST_COL = 'C';

const DEFAULT_USERS = [
  { userId: 'COE', label: 'Controller of Examinations (COE)', password: 'coe@123' },
  { userId: 'NDepCOE', label: 'North Dept. COE', password: 'ndep@123' },
  { userId: 'SDepCOE', label: 'South Dept. COE', password: 'sdep@123' },
  { userId: 'NorthMPC', label: 'North Campus MPC', password: 'north@123' },
  { userId: 'SouthMPC', label: 'South Campus MPC', password: 'south@123' },
];

const SEM_TYPE_SHORT = { Odd: 'Odd', Even: 'Even', 'Suppl/Summer': 'Summ' };

// ---------------------------------------------------------------------------
// Configuration (from environment variables — set by the hosting platform)
// ---------------------------------------------------------------------------
function sanitizeSpreadsheetId(raw) {
  let id = (raw || '').trim();
  // Strip surrounding quotes, in case someone pasted a quoted value.
  if (id.length >= 2) {
    const first = id[0];
    const last = id[id.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      id = id.slice(1, -1).trim();
    }
  }
  // If someone pasted the whole Sheets URL instead of just the ID, pull the
  // ID out of it automatically: .../spreadsheets/d/<ID>/edit...
  const match = id.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (match) {
    id = match[1];
  }
  // Strip any accidental whitespace/newlines that survived copy-paste.
  id = id.replace(/\s+/g, '');
  return id;
}

function getConfig() {
  return {
    spreadsheetId: sanitizeSpreadsheetId(process.env.GOOGLE_SPREADSHEET_ID || ''),
    clientEmail: (process.env.GOOGLE_CLIENT_EMAIL || '').trim(),
    privateKey: sanitizePrivateKey(process.env.GOOGLE_PRIVATE_KEY || ''),
  };
}

function isConfigured() {
  const cfg = getConfig();
  return !!(cfg.spreadsheetId && cfg.clientEmail && cfg.privateKey);
}

// Private keys get pasted into env vars from all kinds of sources (raw PEM,
// a JSON file value with the surrounding quotes still attached, escaped \n
// sequences, Windows line endings, etc). Normalize all of that here.
function sanitizePrivateKey(raw) {
  let key = (raw || '').trim();
  if (key.length >= 2) {
    const first = key[0];
    const last = key[key.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      key = key.slice(1, -1).trim();
    }
  }
  key = key.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n');
  key = key.replace(/\r\n/g, '\n');
  return key.trim();
}

function validatePrivateKey(key) {
  if (!key.includes('BEGIN PRIVATE KEY') && !key.includes('BEGIN RSA PRIVATE KEY')) {
    throw new Error(
      'GOOGLE_PRIVATE_KEY does not look valid. It should be the full "private_key" value ' +
      'from the downloaded service-account JSON file, including the BEGIN/END lines.'
    );
  }
}

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// ---------------------------------------------------------------------------
// Low-level HTTPS + service-account OAuth (JWT Bearer flow)
// ---------------------------------------------------------------------------
function httpsRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          let message = data;
          try {
            const parsed = JSON.parse(data);
            message = (parsed.error && (parsed.error.message || parsed.error)) || data;
          } catch (e) {
            // leave message as raw text
          }
          reject(new Error(`HTTP ${res.statusCode}: ${message}`));
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

let cachedToken = null; // { accessToken, expiresAt }

async function getAccessToken() {
  const cfg = getConfig();
  if (!isConfigured()) {
    throw new Error(
      'Google Sheets is not configured on the server. Set GOOGLE_SPREADSHEET_ID, ' +
      'GOOGLE_CLIENT_EMAIL, and GOOGLE_PRIVATE_KEY as environment variables and restart.'
    );
  }
  validatePrivateKey(cfg.privateKey);
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) {
    return cachedToken.accessToken;
  }
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: cfg.clientEmail,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };
  const signingInput = base64url(JSON.stringify(header)) + '.' + base64url(JSON.stringify(claim));
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signingInput);
  const signature = signer
    .sign(cfg.privateKey, 'base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  const jwt = signingInput + '.' + signature;

  const body =
    'grant_type=' + encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer') +
    '&assertion=' + encodeURIComponent(jwt);

  const resp = await httpsRequest(
    {
      hostname: 'oauth2.googleapis.com',
      path: '/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
    },
    body
  );

  const data = JSON.parse(resp);
  if (!data.access_token) {
    throw new Error(data.error_description || data.error || 'Failed to obtain a Google access token.');
  }
  cachedToken = { accessToken: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cachedToken.accessToken;
}

async function sheetsApiRequest(method, pathSuffix, bodyObj) {
  const cfg = getConfig();
  if (!cfg.spreadsheetId) {
    throw new Error('GOOGLE_SPREADSHEET_ID is empty on the server. Set it in your hosting environment variables and restart.');
  }
  const token = await getAccessToken();
  const bodyStr = bodyObj !== undefined ? JSON.stringify(bodyObj) : undefined;
  try {
    const resp = await httpsRequest(
      {
        hostname: 'sheets.googleapis.com',
        path: `/v4/spreadsheets/${cfg.spreadsheetId}${pathSuffix}`,
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
        },
      },
      bodyStr
    );
    return resp ? JSON.parse(resp) : null;
  } catch (e) {
    if (e.message.includes('HTTP 404')) {
      throw new Error(
        `HTTP 404 from Google Sheets for spreadsheet ID "${cfg.spreadsheetId}". This usually means either the ` +
        `GOOGLE_SPREADSHEET_ID doesn't match an existing sheet, or the sheet hasn't been shared with ` +
        `${cfg.clientEmail || '(no client email set)'} as an Editor. Double-check both, then restart the server.`
      );
    }
    throw e;
  }
}

// ---------------------------------------------------------------------------
// Sheet provisioning (create tabs + headers + default users if missing)
// ---------------------------------------------------------------------------
async function provisionSheetsIfNeeded() {
  const meta = await sheetsApiRequest('GET', '?fields=sheets.properties.title');
  const existingTitles = (meta.sheets || []).map((s) => s.properties.title);

  const addRequests = [];
  if (!existingTitles.includes(REPORTS_SHEET)) {
    addRequests.push({ addSheet: { properties: { title: REPORTS_SHEET } } });
  }
  if (!existingTitles.includes(USERS_SHEET)) {
    addRequests.push({ addSheet: { properties: { title: USERS_SHEET } } });
  }
  if (addRequests.length) {
    await sheetsApiRequest('POST', ':batchUpdate', { requests: addRequests });
  }

  if (!existingTitles.includes(REPORTS_SHEET)) {
    await sheetsApiRequest(
      'PUT',
      `/values/${encodeURIComponent(REPORTS_SHEET)}!A1:${REPORTS_LAST_COL}1?valueInputOption=RAW`,
      { values: [REPORT_HEADER_LABELS] }
    );
  }
  if (!existingTitles.includes(USERS_SHEET)) {
    await sheetsApiRequest(
      'PUT',
      `/values/${encodeURIComponent(USERS_SHEET)}!A1:${USERS_LAST_COL}1?valueInputOption=RAW`,
      { values: [USER_HEADER_LABELS] }
    );
    const userRows = DEFAULT_USERS.map((u) => USER_COLUMNS.map((c) => u[c]));
    await sheetsApiRequest(
      'POST',
      `/values/${encodeURIComponent(USERS_SHEET)}!A2:${USERS_LAST_COL}?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
      { values: userRows }
    );
  }
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------
let reportRowCache = {}; // id -> row number (1-based, includes header row)

function rowToReport(rowValues) {
  const obj = {};
  REPORT_COLUMNS.forEach((key, i) => {
    let v = rowValues[i] !== undefined ? rowValues[i] : '';
    if (key === 'penaltyDX' || key === 'cancelReg') v = v === 'TRUE' || v === true;
    obj[key] = v;
  });
  return obj;
}

function reportToRow(report) {
  return REPORT_COLUMNS.map((key) => {
    const v = report[key];
    if (key === 'penaltyDX' || key === 'cancelReg') return v ? 'TRUE' : 'FALSE';
    return v === undefined || v === null ? '' : String(v);
  });
}

async function loadReports() {
  const data = await sheetsApiRequest('GET', `/values/${encodeURIComponent(REPORTS_SHEET)}!A2:${REPORTS_LAST_COL}`);
  const rows = data.values || [];
  reportRowCache = {};
  const reports = rows.map((row, i) => {
    const report = rowToReport(row);
    reportRowCache[report.id] = i + 2;
    return report;
  });
  return reports.reverse(); // most recently entered first
}

async function appendReport(report) {
  const row = reportToRow(report);
  await sheetsApiRequest(
    'POST',
    `/values/${encodeURIComponent(REPORTS_SHEET)}!A2:${REPORTS_LAST_COL}?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    { values: [row] }
  );
}

async function patchReport(id, patch) {
  let rowNumber = reportRowCache[id];
  let existing = null;
  if (!rowNumber) {
    const reports = await loadReports();
    existing = reports.find((r) => r.id === id);
    rowNumber = reportRowCache[id];
  }
  if (!rowNumber) throw new Error('Could not locate that case in the spreadsheet.');
  if (!existing) {
    const data = await sheetsApiRequest('GET', `/values/${encodeURIComponent(REPORTS_SHEET)}!A${rowNumber}:${REPORTS_LAST_COL}${rowNumber}`);
    existing = rowToReport((data.values && data.values[0]) || []);
  }
  const merged = { ...existing, ...patch };
  const row = reportToRow(merged);
  await sheetsApiRequest(
    'PUT',
    `/values/${encodeURIComponent(REPORTS_SHEET)}!A${rowNumber}:${REPORTS_LAST_COL}${rowNumber}?valueInputOption=RAW`,
    { values: [row] }
  );
  return merged;
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------
let userRowCache = {}; // userId -> row number

async function loadUsers() {
  const data = await sheetsApiRequest('GET', `/values/${encodeURIComponent(USERS_SHEET)}!A2:${USERS_LAST_COL}`);
  const rows = data.values || [];
  userRowCache = {};
  const users = rows.map((row, i) => {
    const obj = {};
    USER_COLUMNS.forEach((key, k) => (obj[key] = row[k] || ''));
    userRowCache[obj.userId] = i + 2;
    return obj;
  });
  return users;
}

async function upsertUserPassword(userId, password) {
  if (!Object.keys(userRowCache).length) {
    await loadUsers();
  }
  const rowNumber = userRowCache[userId];
  const defaultUser = DEFAULT_USERS.find((u) => u.userId === userId);
  const label = defaultUser ? defaultUser.label : userId;
  if (rowNumber) {
    await sheetsApiRequest(
      'PUT',
      `/values/${encodeURIComponent(USERS_SHEET)}!A${rowNumber}:${USERS_LAST_COL}${rowNumber}?valueInputOption=RAW`,
      { values: [[userId, label, password]] }
    );
  } else {
    await sheetsApiRequest(
      'POST',
      `/values/${encodeURIComponent(USERS_SHEET)}!A2:${USERS_LAST_COL}?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
      { values: [[userId, label, password]] }
    );
  }
}

// ---------------------------------------------------------------------------
// Small shared utilities (also mirrored in the frontend for display purposes)
// ---------------------------------------------------------------------------
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function caseNumber(data, serial) {
  const semShort = SEM_TYPE_SHORT[data.semType] || data.semType || 'NA';
  const component = data.component || 'NA';
  const campus = data.campus || 'NA';
  const year = data.academicYear || 'NA';
  return `${year}/${semShort}/${component}/${campus}/MPC${String(serial).padStart(3, '0')}`;
}

function diagnosticSummary() {
  const cfg = getConfig();
  return {
    spreadsheetId: cfg.spreadsheetId || '(empty)',
    clientEmail: cfg.clientEmail || '(empty)',
    privateKeyLooksValid: cfg.privateKey.includes('BEGIN PRIVATE KEY') || cfg.privateKey.includes('BEGIN RSA PRIVATE KEY'),
  };
}

module.exports = {
  isConfigured,
  provisionSheetsIfNeeded,
  loadReports,
  appendReport,
  patchReport,
  loadUsers,
  upsertUserPassword,
  uid,
  caseNumber,
  diagnosticSummary,
};
