const path = require('path');
const fs = require('fs');
const express = require('express');
const { signToken, verifyToken } = require('./server/auth');
const sheets = require('./server/sheets');

// Lightweight .env loader for local development — no extra dependency.
// On a real host (Render, Railway, etc.) you'll set these in the
// platform's environment-variable settings instead, and this is skipped.
function loadDotEnvIfPresent() {
  try {
    const envPath = path.join(__dirname, '.env');
    if (!fs.existsSync(envPath)) return;
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const idx = trimmed.indexOf('=');
      if (idx === -1) return;
      const key = trimmed.slice(0, idx).trim();
      let value = trimmed.slice(idx + 1);
      // Preserve multi-line private keys stored as literal \n sequences.
      value = value.trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    });
  } catch (e) {
    console.warn('Could not read .env file:', e.message);
  }
}

loadDotEnvIfPresent();

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ ok: false, error: 'Not signed in.' });
  req.user = payload;
  next();
}

function requireCOE(req, res, next) {
  if (!req.user || req.user.id !== 'COE') {
    return res.status(403).json({ ok: false, error: 'Only the COE account can do this.' });
  }
  next();
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, configured: sheets.isConfigured() });
});

app.post('/api/login', async (req, res) => {
  const { userId, password } = req.body || {};
  if (!userId || !password) {
    return res.status(400).json({ ok: false, error: 'User and password are required.' });
  }
  try {
    const users = await sheets.loadUsers();
    const user = users.find((u) => u.userId === userId);
    if (!user || user.password !== password) {
      return res.status(401).json({ ok: false, error: 'Incorrect user or password.' });
    }
    const token = signToken({
      id: user.userId,
      label: user.label,
      exp: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    });
    res.json({ ok: true, token, user: { id: user.userId, label: user.label } });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/api/me', requireAuth, (req, res) => {
  res.json({ ok: true, user: { id: req.user.id, label: req.user.label } });
});

app.get('/api/reports', requireAuth, async (req, res) => {
  try {
    const reports = await sheets.loadReports();
    res.json({ ok: true, reports });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post('/api/reports', requireAuth, async (req, res) => {
  try {
    const data = req.body || {};
    const existing = await sheets.loadReports();
    const serial = existing.filter((r) => r.campus === data.campus).length + 1;
    const entry = {
      id: sheets.uid(),
      caseNo: sheets.caseNumber(data, serial),
      dateReported: new Date().toISOString().slice(0, 10),
      status: 'Reported',
      penaltyDX: false,
      fineAmount: '',
      cancelReg: false,
      notResolvedReason: '',
      enteredBy: req.user.id,
      enteredAt: new Date().toISOString(),
      ...data,
    };
    await sheets.appendReport(entry);
    res.json({ ok: true, report: entry });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.patch('/api/reports/:id', requireAuth, async (req, res) => {
  try {
    const patch = {
      ...(req.body || {}),
      lastEditedBy: req.user.id,
      lastEditedAt: new Date().toISOString(),
    };
    const merged = await sheets.patchReport(req.params.id, patch);
    res.json({ ok: true, report: merged });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/api/users', requireAuth, async (req, res) => {
  try {
    const users = await sheets.loadUsers();
    res.json({ ok: true, users: users.map((u) => ({ id: u.userId, label: u.label })) });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post('/api/users/:id/password', requireAuth, requireCOE, async (req, res) => {
  try {
    const { password } = req.body || {};
    if (!password || password.length < 4) {
      return res.status(400).json({ ok: false, error: 'Password must be at least 4 characters.' });
    }
    await sheets.upsertUserPassword(req.params.id, password);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Any other route falls back to the single-page app.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Malpractice Register server listening on port ${PORT}`);
  if (sheets.isConfigured()) {
    sheets.provisionSheetsIfNeeded().catch((e) => {
      console.error('Could not verify/provision the Google Sheet at startup:', e.message);
    });
  } else {
    console.warn(
      'Google Sheets is not configured yet. Set GOOGLE_SPREADSHEET_ID, GOOGLE_CLIENT_EMAIL, ' +
      'and GOOGLE_PRIVATE_KEY as environment variables, then restart the server.'
    );
  }
});
