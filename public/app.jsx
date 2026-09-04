const { useState, useEffect, useMemo } = React;

const CAMPUSES = ["North", "South"];
const ACADEMIC_YEARS = ["2026-27"];
const PROGRAMMES = ["BE", "MTech", "MCA"];
const SEM_TYPES = ["Odd", "Even", "Suppl/Summer"];
const SEMESTERS = ["1", "2", "3", "4", "5", "6", "7", "8"];
const REPORTER_ROLES = ["DCS", "Invigilator", "Squad", "Other"];
const COMPONENTS = ["Test1", "Test2", "SEE", "SET", "Quiz", "Other"];
const COPY_MODES = ["Chit", "Mobile", "Digital Devices", "Other"];
const STATUSES = ["Reported", "Enquiry Pending", "Resolved", "Not Resolved"];
const STATUS_COLOR = {
  "Reported": { bg: "#F5E7D3", text: "#6B4A1E", border: "#C9A46A" },
  "Enquiry Pending": { bg: "#E4E9EF", text: "#2C4A6E", border: "#7C9AB8" },
  "Resolved": { bg: "#E3ECD9", text: "#3B5A2A", border: "#8AAE6F" },
  "Not Resolved": { bg: "#F1E0DE", text: "#7A2E2E", border: "#C08A87" },
};

const USER_OPTIONS = [
  { id: "COE", label: "Controller of Examinations (COE)" },
  { id: "NDepCOE", label: "North Dept. COE" },
  { id: "SDepCOE", label: "South Dept. COE" },
  { id: "NorthMPC", label: "North Campus MPC" },
  { id: "SouthMPC", label: "South Campus MPC" },
];

function LoginScreen({ onLogin }) {
  const [userId, setUserId] = useState(USER_OPTIONS[0].id);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, password }),
      });
      const result = await res.json();
      setLoading(false);
      if (!result.ok) {
        setError(result.error || "Incorrect user or password.");
        return;
      }
      onLogin(result.user, result.token);
    } catch (err) {
      setLoading(false);
      setError("Could not reach the server. Check your internet connection.");
    }
  }

  return (
    <div style={{ fontFamily: "Inter, -apple-system, sans-serif", background: "#1F2B3E", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        .serif { font-family: 'Lora', Georgia, serif; }
        ::placeholder { color: #a39d8f; }
      `}</style>
      <form
        onSubmit={handleSubmit}
        style={{ background: "#FBF9F4", border: "1px solid #C9BFA5", borderRadius: 8, padding: "36px 34px", width: 380, boxShadow: "0 12px 40px rgba(0,0,0,0.35)" }}
      >
        <div className="serif" style={{ fontSize: 20, fontWeight: 700, color: "#1F2B3E", marginBottom: 4 }}>Office of the Controller of Examinations</div>
        <div style={{ fontSize: 12, color: "#8A8478", marginBottom: 26, letterSpacing: "0.03em", textTransform: "uppercase" }}>Examination Malpractice Register — Sign in</div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#5B6472", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.03em" }}>User</label>
          <select
            style={inputStyle}
            value={userId}
            onChange={(e) => { setUserId(e.target.value); setError(""); }}
          >
            {USER_OPTIONS.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 10 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#5B6472", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.03em" }}>Password</label>
          <input
            type="password"
            style={inputStyle}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            placeholder="Enter password"
            autoFocus
          />
        </div>

        {error && <div style={{ color: "#7A2E2E", fontSize: 13, margin: "8px 0 6px" }}>{error}</div>}

        <button
          type="submit"
          disabled={loading}
          style={{ marginTop: 14, width: "100%", background: "#1F2B3E", color: "#EFEAE0", border: "none", padding: "11px 24px", borderRadius: 4, fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>

        <div style={{ marginTop: 18, fontSize: 11, color: "#8A8478", lineHeight: 1.5 }}>
          All logged-in users currently have the same rights: view, create, and edit cases for either campus. Works from any computer or phone with a browser.
        </div>
      </form>
    </div>
  );
}

function ManageUsers({ users, onChangePassword }) {
  const [userId, setUserId] = useState(users[0].id);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!newPassword || newPassword.length < 4) {
      setError("Password must be at least 4 characters.");
      setSuccess("");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      setSuccess("");
      return;
    }
    setSaving(true);
    const result = await onChangePassword(userId, newPassword);
    setSaving(false);
    if (!result || !result.ok) {
      setError((result && result.error) || "Could not save the password to the spreadsheet. Check your connection.");
      setSuccess("");
      return;
    }
    setError("");
    setNewPassword("");
    setConfirmPassword("");
    const user = users.find((u) => u.id === userId);
    setSuccess(`Password updated for ${user ? user.label : userId}.`);
    setTimeout(() => setSuccess(""), 3500);
  }

  return (
    <div>
      <h2 className="serif" style={{ fontSize: 19, margin: "0 0 6px", color: "#1F2B3E" }}>Manage users</h2>
      <p style={{ fontSize: 13, color: "#5B6472", marginBottom: 20 }}>Only the COE account can change sign-in passwords. Changes take effect immediately for the next login.</p>

      <div style={{ maxWidth: 380 }}>
        <Field label="User">
          <select style={inputStyle} value={userId} onChange={(e) => { setUserId(e.target.value); setError(""); setSuccess(""); }}>
            {users.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
          </select>
        </Field>
        <Field label="New password">
          <input type="password" style={inputStyle} value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setError(""); }} placeholder="At least 4 characters" />
        </Field>
        <Field label="Confirm new password">
          <input type="password" style={inputStyle} value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }} placeholder="Repeat password" />
        </Field>

        {error && <div style={{ color: "#7A2E2E", fontSize: 13, margin: "4px 0 14px" }}>{error}</div>}
        {success && <div style={{ color: "#3B5A2A", fontSize: 13, margin: "4px 0 14px" }}>{success}</div>}

        <button
          onClick={handleSave}
          style={{ background: "#1F2B3E", color: "#EFEAE0", border: "none", padding: "11px 24px", borderRadius: 4, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
        >
          Update password
        </button>
      </div>

      <div style={sectionHeadStyle}>Current accounts</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {users.map((u) => (
          <div key={u.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "8px 12px", background: "#F3EFE4", border: "1px solid #DCD3BD", borderRadius: 4 }}>
            <span style={{ fontWeight: 600, color: "#1F2B3E" }}>{u.label}</span>
            <span className="mono" style={{ color: "#8A8478" }}>{u.id}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FullScreenMessage({ title, body }) {
  return (
    <div style={{ fontFamily: "Inter, -apple-system, sans-serif", background: "#1F2B3E", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#EFEAE0" }}>
      <div style={{ textAlign: "center" }}>
        <div className="serif" style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{title}</div>
        <div style={{ fontSize: 13, color: "#C9BFA5" }}>{body}</div>
      </div>
    </div>
  );
}

function MalpracticeRegister() {
  const [currentUser, setCurrentUser] = useState(null);
  const [reports, setReports] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("new");
  const [filters, setFilters] = useState({
    campus: "All", status: "All", programme: "All", semType: "All",
    component: "All", reporterRole: "All", copyMode: "All",
  });
  function setFilter(key, value) {
    setFilters((f) => ({ ...f, [key]: value }));
  }
  const [saveNote, setSaveNote] = useState("");
  const [printTarget, setPrintTarget] = useState(null);

  useEffect(() => {
    if (!printTarget) return;
    const t = setTimeout(() => window.print(), 150);
    const handleAfter = () => setPrintTarget(null);
    window.addEventListener("afterprint", handleAfter);
    return () => {
      clearTimeout(t);
      window.removeEventListener("afterprint", handleAfter);
    };
  }, [printTarget]);

  const [appStatus, setAppStatus] = useState("checking"); // checking | serverDown | notConfigured | ready
  const [token, setToken] = useState(null);
  const [users, setUsers] = useState([]);
  const [lastSynced, setLastSynced] = useState(null);
  const [syncError, setSyncError] = useState("");

  async function apiFetch(path, options) {
    const opts = options || {};
    const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
    if (token) headers.Authorization = `Bearer ${token}`;
    try {
      const res = await fetch(path, { ...opts, headers });
      let data;
      try {
        data = await res.json();
      } catch (e) {
        data = { ok: false, error: `Server returned an unexpected response (HTTP ${res.status}).` };
      }
      if (res.status === 401) {
        handleLogout();
      }
      return data;
    } catch (e) {
      return { ok: false, error: "Could not reach the server. Check your internet connection." };
    }
  }

  async function loadData(showErrors) {
    const [reportsRes, usersRes] = await Promise.all([apiFetch("/api/reports"), apiFetch("/api/users")]);
    if (reportsRes.ok && usersRes.ok) {
      setReports(reportsRes.reports || []);
      setUsers(usersRes.users || []);
      setLastSynced(new Date());
      setSyncError("");
      setLoaded(true);
      return reportsRes.reports || [];
    } else {
      if (showErrors) {
        setSyncError((reportsRes && reportsRes.error) || (usersRes && usersRes.error) || "Could not load the register.");
      }
      return null;
    }
  }

  useEffect(() => {
    (async () => {
      let health;
      try {
        health = await fetch("/api/health").then((r) => r.json());
      } catch (e) {
        setAppStatus("serverDown");
        return;
      }
      if (!health || !health.ok || !health.configured) {
        setAppStatus("notConfigured");
        return;
      }
      const storedToken = localStorage.getItem("mpr_token");
      if (storedToken) {
        try {
          const meRes = await fetch("/api/me", { headers: { Authorization: `Bearer ${storedToken}` } }).then((r) => r.json());
          if (meRes.ok) {
            setToken(storedToken);
            setCurrentUser(meRes.user);
          } else {
            localStorage.removeItem("mpr_token");
          }
        } catch (e) {
          // Ignore — user will just need to sign in again.
        }
      }
      setAppStatus("ready");
    })();
  }, []);

  // Once signed in, load the register, then keep it fresh. Polling is
  // skipped while filling in the New Report or Enquiry forms, so a refresh
  // never overwrites what's mid-typing.
  useEffect(() => {
    if (!currentUser || !token) return;
    loadData(true);
  }, [currentUser, token]);

  useEffect(() => {
    if (!currentUser || !token) return;
    if (tab === "new" || tab === "enquiry") return;
    const t = setInterval(() => loadData(false), 25000);
    return () => clearInterval(t);
  }, [currentUser, token, tab]);

  function handleLogin(user, tok) {
    localStorage.setItem("mpr_token", tok);
    setToken(tok);
    setCurrentUser(user);
  }

  function handleLogout() {
    localStorage.removeItem("mpr_token");
    setToken(null);
    setCurrentUser(null);
    setReports([]);
    setUsers([]);
    setLoaded(false);
  }

  const effectiveUsers = users;

  async function changePassword(userId, newPassword) {
    return apiFetch(`/api/users/${encodeURIComponent(userId)}/password`, {
      method: "POST",
      body: JSON.stringify({ password: newPassword }),
    });
  }

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      if (filters.campus !== "All" && r.campus !== filters.campus) return false;
      if (filters.status !== "All" && r.status !== filters.status) return false;
      if (filters.programme !== "All" && r.programme !== filters.programme) return false;
      if (filters.semType !== "All" && r.semType !== filters.semType) return false;
      if (filters.component !== "All" && r.component !== filters.component) return false;
      if (filters.reporterRole !== "All" && r.reporterRole !== filters.reporterRole) return false;
      if (filters.copyMode !== "All" && r.copyMode !== filters.copyMode) return false;
      return true;
    });
  }, [reports, filters]);

  const stats = useMemo(() => {
    const total = reports.length;
    const byCampus = {};
    CAMPUSES.forEach((c) => (byCampus[c] = 0));
    const byStatus = {};
    STATUSES.forEach((s) => (byStatus[s] = 0));
    const byReporter = {};
    REPORTER_ROLES.forEach((r) => (byReporter[r] = 0));
    const byProgramme = {};
    PROGRAMMES.forEach((p) => (byProgramme[p] = 0));
    const byMode = {};
    COPY_MODES.forEach((m) => (byMode[m] = 0));
    const byComponent = {};
    COMPONENTS.forEach((c) => (byComponent[c] = 0));
    const byCampusStatus = {};
    CAMPUSES.forEach((c) => {
      byCampusStatus[c] = {};
      STATUSES.forEach((s) => (byCampusStatus[c][s] = 0));
    });
    reports.forEach((r) => {
      byCampus[r.campus] = (byCampus[r.campus] || 0) + 1;
      byStatus[r.status] = (byStatus[r.status] || 0) + 1;
      byReporter[r.reporterRole] = (byReporter[r.reporterRole] || 0) + 1;
      byProgramme[r.programme] = (byProgramme[r.programme] || 0) + 1;
      byMode[r.copyMode] = (byMode[r.copyMode] || 0) + 1;
      byComponent[r.component] = (byComponent[r.component] || 0) + 1;
      if (byCampusStatus[r.campus]) {
        byCampusStatus[r.campus][r.status] = (byCampusStatus[r.campus][r.status] || 0) + 1;
      }
    });
    return { total, byCampus, byStatus, byReporter, byProgramme, byMode, byComponent, byCampusStatus };
  }, [reports]);

  async function addReport(data) {
    setSaveNote("Saving…");
    const result = await apiFetch("/api/reports", { method: "POST", body: JSON.stringify(data) });
    if (!result.ok) {
      setSaveNote("");
      setSyncError(`Could not save the case: ${result.error || "unknown error"}. Nothing was cleared — check your connection and try again.`);
      return false;
    }
    setReports((prev) => [result.report, ...prev]);
    setSaveNote(`Case ${result.report.caseNo} saved. It now awaits enquiry.`);
    setTimeout(() => setSaveNote(""), 3500);
    setTab("new");
    return true;
  }

  function patchReport(id, patch) {
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    apiFetch(`/api/reports/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(patch) }).then((result) => {
      if (!result.ok) {
        setSyncError(`A change didn't save: ${result.error || "unknown error"}. Try again, or use Refresh to check the latest state.`);
      } else if (result.report) {
        setReports((prev) => prev.map((r) => (r.id === id ? { ...r, ...result.report } : r)));
      }
    });
  }

  function exportToExcel(list) {
    const rows = list.map((r) => ({
      "Case No": r.caseNo,
      "Date Reported": r.dateReported,
      "Academic Year": r.academicYear,
      "Campus": r.campus,
      "Programme": r.programme,
      "Semester Type": r.semType,
      "Component": r.component,
      "Student Name": r.studentName,
      "USN": r.usn,
      "Sem": r.sem,
      "Course": r.course,
      "Course Code": r.courseCode,
      "Date of Exam": r.examDate,
      "Time": r.examTime,
      "Room Number": r.roomNo,
      "Mode of Copying": r.copyMode === "Other" ? `Other - ${r.copyModeOther || ""}` : r.copyMode,
      "Reported By": r.reporterName,
      "Reporter Role": r.reporterRole,
      "DX Grade": r.penaltyDX ? "Yes" : "No",
      "Fine Amount": r.fineAmount || "",
      "Cancel Registration": r.cancelReg ? "Yes" : "No",
      "Status": r.status,
      "Not Resolved Reason": r.notResolvedReason || "",
      "Description": r.description || "",
      "Entered By": r.enteredBy || "",
      "Last Edited By": r.lastEditedBy || "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = new Array(23).fill({ wch: 16 });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Malpractice Register");
    XLSX.writeFile(wb, `malpractice_register_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  if (appStatus === "checking") {
    return <FullScreenMessage title="Loading…" body="Connecting to the register." />;
  }

  if (appStatus === "serverDown") {
    return <FullScreenMessage title="Can't reach the server" body="Check your internet connection and reload the page." />;
  }

  if (appStatus === "notConfigured") {
    return (
      <FullScreenMessage
        title="Not set up yet"
        body="The server administrator still needs to connect Google Sheets (server environment variables). Please check back soon."
      />
    );
  }

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div style={{ fontFamily: "Inter, -apple-system, sans-serif", background: "#EFEAE0", minHeight: "100vh", color: "#242320" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        .serif { font-family: 'Lora', Georgia, serif; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        .tab-btn { transition: all 0.15s ease; }
        .stamp {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 3px;
          border: 1.5px solid;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          transform: rotate(-1.5deg);
        }
        input, select, textarea {
          font-family: 'Inter', sans-serif;
        }
        ::placeholder { color: #a39d8f; }
        .print-sheet { display: none; }
        @media print {
          .no-print { display: none !important; }
          .print-sheet { display: block !important; }
        }
      `}</style>

      {printTarget && <PrintableCase report={printTarget} />}

      <div className="no-print">
      <div style={{ background: "#1F2B3E", color: "#EFEAE0", padding: "22px 32px", borderBottom: "5px double #A6813C" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div className="serif" style={{ fontSize: 24, fontWeight: 700, letterSpacing: "0.01em" }}>Office of the Controller of Examinations</div>
            <div className="mono" style={{ fontSize: 12, color: "#C9BFA5", marginTop: 4, letterSpacing: "0.05em" }}>EXAMINATION MALPRACTICE REGISTER — WEB EDITION</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="mono" style={{ fontSize: 12, color: "#A6813C" }}>
              {CAMPUSES.join("  ·  ")}
            </div>
            <div style={{ fontSize: 12, color: "#C9BFA5", marginTop: 6, display: "flex", alignItems: "center", gap: 10, justifyContent: "flex-end" }}>
              <span>Logged in as <strong style={{ color: "#EFEAE0" }}>{currentUser.label}</strong></span>
              <button
                onClick={handleLogout}
                style={{ background: "none", border: "1px solid #A6813C", color: "#EFEAE0", padding: "3px 10px", borderRadius: 3, fontSize: 11, cursor: "pointer" }}
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 32px" }}>
        <div style={{ display: "flex", gap: 4, marginTop: 18 }}>
          {[
            ["new", "New report"],
            ["enquiry", "Enquiry"],
            ["register", "Case history"],
            ["dashboard", "Dashboard"],
            ...(currentUser.id === "COE" ? [["users", "Manage users"]] : []),
          ].map(([key, label]) => (
            <button
              key={key}
              className="tab-btn"
              onClick={() => setTab(key)}
              style={{
                padding: "10px 20px",
                border: "1px solid #C9BFA5",
                borderBottom: tab === key ? "1px solid #FBF9F4" : "1px solid #C9BFA5",
                borderRadius: "6px 6px 0 0",
                background: tab === key ? "#FBF9F4" : "#E3DCCB",
                color: tab === key ? "#1F2B3E" : "#5B6472",
                fontWeight: 500,
                fontSize: 13,
                cursor: "pointer",
                marginBottom: -1,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div style={{ background: "#FBF9F4", border: "1px solid #C9BFA5", borderRadius: "0 6px 6px 6px", padding: 28, minHeight: 480 }}>
          {saveNote && (
            <div style={{ background: "#E3ECD9", border: "1px solid #8AAE6F", color: "#3B5A2A", padding: "8px 14px", borderRadius: 4, fontSize: 13, marginBottom: 18 }}>
              {saveNote}
            </div>
          )}

          {tab === "dashboard" && <Dashboard stats={stats} />}
          {tab === "new" && <NewReport onSubmit={addReport} />}
          {tab === "enquiry" && <Enquiry reports={reports} onPatch={patchReport} onPrint={setPrintTarget} />}
          {tab === "register" && (
            <Register
              reports={filtered}
              filters={filters}
              setFilter={setFilter}
              onPrint={setPrintTarget}
              onExport={exportToExcel}
            />
          )}
          {tab === "users" && currentUser.id === "COE" && (
            <ManageUsers users={effectiveUsers} onChangePassword={changePassword} />
          )}
        </div>
      </div>

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "18px 32px 40px", fontSize: 11, color: "#8A8478" }} className="mono">
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <span>
            Live register, shared across both campuses
            {lastSynced ? ` · Last synced ${lastSynced.toLocaleTimeString()}` : ""}
          </span>
          <button
            onClick={() => loadData(true)}
            style={{ background: "none", border: "1px solid #C9BFA5", color: "#5B6472", padding: "3px 10px", borderRadius: 3, fontSize: 11, cursor: "pointer" }}
          >
            Refresh now
          </button>
        </div>
        {syncError && <div style={{ color: "#7A2E2E", marginTop: 6 }}>{syncError}</div>}
      </div>
      </div>
    </div>
  );
}

function PrintableCase({ report: r }) {
  return (
    <div className="print-sheet serif" style={{ padding: "40px 50px", color: "#111", fontSize: 13, lineHeight: 1.5 }}>
      <div style={{ textAlign: "center", borderBottom: "3px double #111", paddingBottom: 14, marginBottom: 20 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Office of the Controller of Examinations</div>
        <div style={{ fontSize: 12, marginTop: 4 }}>Examination Malpractice — Incident Report</div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 18 }}>
        <tbody>
          <Row label="Case No." value={r.caseNo} />
          <Row label="Date Reported" value={r.dateReported} />
          <Row label="Academic Year" value={r.academicYear} />
          <Row label="Campus" value={r.campus} />
          <Row label="Programme" value={r.programme} />
          <Row label="Semester Type" value={r.semType} />
          <Row label="Component" value={r.component} />
          <Row label="Student Name" value={r.studentName} />
          <Row label="USN" value={r.usn} />
          <Row label="Semester" value={r.sem} />
          <Row label="Course" value={r.course} />
          <Row label="Course Code" value={r.courseCode} />
          <Row label="Date of Exam" value={r.examDate} />
          <Row label="Time" value={r.examTime} />
          <Row label="Room Number" value={r.roomNo} />
          <Row label="Mode of Copying" value={r.copyMode === "Other" ? `Other — ${r.copyModeOther || ""}` : r.copyMode} />
          <Row label="Reported By" value={`${r.reporterName} (${r.reporterRole})`} />
          <Row label="Current Status" value={r.status} />
          {r.status === "Not Resolved" && <Row label="Reason (Not Resolved)" value={r.notResolvedReason || "—"} />}
        </tbody>
      </table>

      <div style={{ marginBottom: 18 }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Description of incident</div>
        <div style={{ border: "1px solid #999", minHeight: 60, padding: 10 }}>{r.description || "—"}</div>
      </div>

      <div style={{ marginBottom: 18 }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Penalty imposed</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <Row label="DX Grade" value={r.penaltyDX ? "Yes" : "No"} />
            <Row label="Fine Amount" value={r.fineAmount ? `Rs. ${r.fineAmount}` : "—"} />
            <Row label="Cancel Registration" value={r.cancelReg ? "Yes" : "No"} />
          </tbody>
        </table>
      </div>

      <div style={{ marginBottom: 40 }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Enquiry committee remarks</div>
        <div style={{ border: "1px solid #999", minHeight: 80, padding: 10 }}></div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 50 }}>
        <Signature label="Reporting staff" />
        <Signature label="DCS / Invigilator" />
        <Signature label="Controller of Examinations" />
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <tr>
      <td style={{ padding: "4px 0", width: 170, fontWeight: 700, verticalAlign: "top" }}>{label}</td>
      <td style={{ padding: "4px 0" }}>{value}</td>
    </tr>
  );
}

function Signature({ label }) {
  return (
    <div style={{ textAlign: "center", width: 160 }}>
      <div style={{ borderTop: "1px solid #111", paddingTop: 6, fontSize: 12 }}>{label}</div>
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div style={{ background: "#F3EFE4", border: "1px solid #DCD3BD", borderRadius: 6, padding: "16px 18px", flex: 1, minWidth: 140 }}>
      <div style={{ fontSize: 12, color: "#8A8478", marginBottom: 6 }}>{label}</div>
      <div className="serif" style={{ fontSize: 28, fontWeight: 700, color: accent || "#1F2B3E" }}>{value}</div>
    </div>
  );
}

function BarGroup({ title, entries, total, color }) {
  const max = Math.max(1, ...entries.map(([, v]) => v));
  return (
    <div style={{ flex: 1, minWidth: 240 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#5B6472", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.04em" }}>{title}</div>
      {entries.every(([, v]) => v === 0) && <div style={{ fontSize: 13, color: "#8A8478" }}>No cases logged yet.</div>}
      {entries.map(([k, v]) => (
        <div key={k} style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}>
            <span>{k}</span>
            <span className="mono">{v}</span>
          </div>
          <div style={{ background: "#E3DCCB", height: 8, borderRadius: 4 }}>
            <div style={{ width: `${(v / max) * 100}%`, background: color, height: 8, borderRadius: 4 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Dashboard({ stats }) {
  return (
    <div>
      <h2 className="serif" style={{ fontSize: 19, margin: "0 0 18px", color: "#1F2B3E" }}>Register overview</h2>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 28 }}>
        <StatCard label="Total cases logged" value={stats.total} />
        <StatCard label="Reported" value={stats.byStatus["Reported"] || 0} />
        <StatCard label="Enquiry pending" value={stats.byStatus["Enquiry Pending"] || 0} />
        <StatCard label="Resolved" value={stats.byStatus["Resolved"] || 0} accent="#3B5A2A" />
        <StatCard label="Not resolved" value={stats.byStatus["Not Resolved"] || 0} accent="#7A2E2E" />
      </div>

      <div style={{ fontSize: 13, fontWeight: 600, color: "#5B6472", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.04em" }}>Enquiry status by campus</div>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 28, fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #DCD3BD" }}>
            <th style={{ textAlign: "left", padding: "6px 8px", color: "#5B6472" }}>Campus</th>
            {STATUSES.map((s) => <th key={s} style={{ textAlign: "left", padding: "6px 8px", color: "#5B6472" }}>{s}</th>)}
          </tr>
        </thead>
        <tbody>
          {CAMPUSES.map((c) => (
            <tr key={c} style={{ borderBottom: "1px solid #EFE9DC" }}>
              <td style={{ padding: "6px 8px", fontWeight: 600, color: "#1F2B3E" }}>{c}</td>
              {STATUSES.map((s) => <td key={s} className="mono" style={{ padding: "6px 8px" }}>{stats.byCampusStatus[c] ? stats.byCampusStatus[c][s] || 0 : 0}</td>)}
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: "flex", gap: 32, flexWrap: "wrap", marginBottom: 28 }}>
        <BarGroup title="Cases by campus" entries={Object.entries(stats.byCampus)} color="#1F2B3E" />
        <BarGroup title="Cases by component" entries={Object.entries(stats.byComponent)} color="#A6813C" />
      </div>

      <div style={{ display: "flex", gap: 32, flexWrap: "wrap", marginBottom: 28 }}>
        <BarGroup title="Cases by programme" entries={Object.entries(stats.byProgramme)} color="#1F2B3E" />
        <BarGroup title="Cases by reporter role" entries={Object.entries(stats.byReporter)} color="#7A2E2E" />
      </div>

      <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
        <BarGroup title="Cases by mode of copying" entries={Object.entries(stats.byMode)} color="#7A2E2E" />
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div style={{ display: "flex", gap: 10, fontSize: 13, padding: "5px 0", borderBottom: "1px dashed #E9E2CF" }}>
      <span style={{ fontWeight: 700, color: "#1F2B3E", minWidth: 150, flexShrink: 0 }}>{label}:</span>
      <span style={{ color: "#3B3A36" }}>{value || "—"}</span>
    </div>
  );
}

function CaseDetailPanel({ r }) {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 28px" }}>
        <DetailRow label="Student Name" value={r.studentName} />
        <DetailRow label="USN" value={r.usn} />
        <DetailRow label="Programme" value={r.programme} />
        <DetailRow label="Semester" value={r.sem} />
        <DetailRow label="Academic Year" value={r.academicYear} />
        <DetailRow label="Semester Type" value={r.semType} />
        <DetailRow label="Course" value={r.course ? `${r.course}${r.courseCode ? " (" + r.courseCode + ")" : ""}` : ""} />
        <DetailRow label="Component" value={r.component} />
        <DetailRow label="Date of Exam" value={r.examDate} />
        <DetailRow label="Time" value={r.examTime} />
        <DetailRow label="Room Number" value={r.roomNo} />
        <DetailRow label="Campus" value={r.campus} />
        <DetailRow label="Mode of Copying" value={r.copyMode === "Other" ? `Other — ${r.copyModeOther || ""}` : r.copyMode} />
        <DetailRow label="Reported By" value={r.reporterName ? `${r.reporterName} (${r.reporterRole})` : ""} />
        <DetailRow label="Date Reported" value={r.dateReported} />
        {(r.penaltyDX || r.fineAmount || r.cancelReg) && (
          <DetailRow
            label="Penalty"
            value={[
              r.penaltyDX ? "DX grade" : null,
              r.fineAmount ? `Fine Rs. ${r.fineAmount}` : null,
              r.cancelReg ? "Registration cancelled" : null,
            ].filter(Boolean).join(" · ") || null}
          />
        )}
        {r.status === "Not Resolved" && r.notResolvedReason && (
          <DetailRow label="Reason Not Resolved" value={r.notResolvedReason} />
        )}
        {r.enteredBy && <DetailRow label="Entered By (system)" value={r.enteredBy} />}
        {r.lastEditedBy && <DetailRow label="Last Edited By (system)" value={r.lastEditedBy} />}
      </div>
      {r.description && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#A6813C", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5 }}>Description</div>
          <div style={{ fontSize: 13, color: "#5B6472", fontStyle: "italic", background: "#F8F5EC", padding: "9px 12px", borderRadius: 4 }}>{r.description}</div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#5B6472", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.03em" }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "9px 11px",
  border: "1px solid #C9BFA5",
  borderRadius: 4,
  fontSize: 14,
  background: "#FFFDF9",
  boxSizing: "border-box",
};

const sectionHeadStyle = {
  fontSize: 12,
  fontWeight: 700,
  color: "#A6813C",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  margin: "22px 0 12px",
  paddingBottom: 6,
  borderBottom: "1px solid #DCD3BD",
};

const EMPTY_FORM = {
  academicYear: "2026-27",
  campus: CAMPUSES[0],
  programme: "",
  semType: "",
  component: "",
  studentName: "",
  usn: "",
  sem: "",
  course: "",
  courseCode: "",
  examDate: "",
  examTime: "",
  roomNo: "",
  copyMode: "",
  copyModeOther: "",
  reporterRole: "DCS",
  reporterName: "",
  description: "",
};

function NewReport({ onSubmit }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const classified = form.academicYear && form.programme && form.semType && form.component;

  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!classified) {
      setError("Select academic year, programme, semester type, and component first.");
      return;
    }
    if (!form.studentName.trim() || !form.usn.trim() || !form.reporterName.trim()) {
      setError("Fill in student name, USN, and reporting staff name.");
      return;
    }
    if (!form.copyMode) {
      setError("Select the mode of copying.");
      return;
    }
    if (form.copyMode === "Other" && !form.copyModeOther.trim()) {
      setError('Describe the mode of copying since "Other" is selected.');
      return;
    }
    setError("");
    setSaving(true);
    const ok = await onSubmit(form);
    setSaving(false);
    if (ok) setForm(EMPTY_FORM);
  }

  return (
    <div>
      <h2 className="serif" style={{ fontSize: 19, margin: "0 0 18px", color: "#1F2B3E" }}>File a new malpractice report</h2>

      <div style={sectionHeadStyle}>1. Classify the case</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 20px" }}>
        <Field label="Academic year">
          <select style={inputStyle} value={form.academicYear} onChange={(e) => set("academicYear", e.target.value)}>
            {ACADEMIC_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </Field>
        <Field label="Programme">
          <select style={inputStyle} value={form.programme} onChange={(e) => set("programme", e.target.value)}>
            <option value="">Select programme</option>
            {PROGRAMMES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="Semester type">
          <select style={inputStyle} value={form.semType} onChange={(e) => set("semType", e.target.value)}>
            <option value="">Select semester type</option>
            {SEM_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
      </div>

      {form.semType && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 20px" }}>
          <Field label="Component">
            <select style={inputStyle} value={form.component} onChange={(e) => set("component", e.target.value)}>
              <option value="">Select component</option>
              {COMPONENTS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        </div>
      )}

      {classified && (
        <>
          <div style={sectionHeadStyle}>2. Exam and student details</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
            <Field label="Campus">
              <select style={inputStyle} value={form.campus} onChange={(e) => set("campus", e.target.value)}>
                {CAMPUSES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Student name">
              <input style={inputStyle} value={form.studentName} placeholder="e.g. A. Sharma" onChange={(e) => set("studentName", e.target.value)} />
            </Field>
            <Field label="USN">
              <input style={inputStyle} value={form.usn} placeholder="e.g. 1XX22CS045" onChange={(e) => set("usn", e.target.value)} />
            </Field>
            <Field label="Semester">
              <select style={inputStyle} value={form.sem} onChange={(e) => set("sem", e.target.value)}>
                <option value="">Select semester</option>
                {SEMESTERS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Course">
              <input style={inputStyle} value={form.course} placeholder="e.g. Data Structures" onChange={(e) => set("course", e.target.value)} />
            </Field>
            <Field label="Course code">
              <input style={inputStyle} value={form.courseCode} placeholder="e.g. 22CS53" onChange={(e) => set("courseCode", e.target.value)} />
            </Field>
            <Field label="Date of exam">
              <input type="date" style={inputStyle} value={form.examDate} onChange={(e) => set("examDate", e.target.value)} />
            </Field>
            <Field label="Time">
              <input type="time" style={inputStyle} value={form.examTime} onChange={(e) => set("examTime", e.target.value)} />
            </Field>
            <Field label="Room number">
              <input style={inputStyle} value={form.roomNo} placeholder="e.g. B-204" onChange={(e) => set("roomNo", e.target.value)} />
            </Field>
          </div>

          <div style={sectionHeadStyle}>3. Mode of copying</div>
          <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginBottom: 6 }}>
            {COPY_MODES.map((m) => (
              <label key={m} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, cursor: "pointer" }}>
                <input type="radio" checked={form.copyMode === m} onChange={() => set("copyMode", m)} />
                {m}
              </label>
            ))}
          </div>
          {form.copyMode === "Other" && (
            <Field label="Specify (required for Other)">
              <input style={inputStyle} value={form.copyModeOther} placeholder="e.g. Signals from adjacent candidate" onChange={(e) => set("copyModeOther", e.target.value)} />
            </Field>
          )}

          <div style={sectionHeadStyle}>4. Reported by</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
            <Field label="Reporter role">
              <div style={{ display: "flex", gap: 16, paddingTop: 6, flexWrap: "wrap" }}>
                {REPORTER_ROLES.map((r) => (
                  <label key={r} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, cursor: "pointer" }}>
                    <input type="radio" checked={form.reporterRole === r} onChange={() => set("reporterRole", r)} />
                    {r}
                  </label>
                ))}
              </div>
            </Field>
            <Field label="Reporting staff name">
              <input style={inputStyle} value={form.reporterName} placeholder="e.g. R. Kumar" onChange={(e) => set("reporterName", e.target.value)} />
            </Field>
          </div>

          <div style={sectionHeadStyle}>5. Description of incident</div>
          <Field label="Description">
            <textarea style={{ ...inputStyle, minHeight: 90, resize: "vertical" }} value={form.description} placeholder="What happened, where, and when" onChange={(e) => set("description", e.target.value)} />
          </Field>
        </>
      )}

      {error && <div style={{ color: "#7A2E2E", fontSize: 13, margin: "8px 0 14px" }}>{error}</div>}

      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={handleSubmit}
          disabled={saving}
          style={{
            background: "#1F2B3E",
            color: "#EFEAE0",
            border: "none",
            padding: "11px 24px",
            borderRadius: 4,
            fontSize: 14,
            fontWeight: 600,
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Saving…" : "Save report"}
        </button>
        <button
          onClick={() => { setForm(EMPTY_FORM); setError(""); }}
          style={{
            background: "none",
            color: "#5B6472",
            border: "1px solid #C9BFA5",
            padding: "11px 24px",
            borderRadius: 4,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Ignore
        </button>
      </div>
    </div>
  );
}

function Enquiry({ reports, onPatch, onPrint }) {
  const pending = reports.filter((r) => r.status === "Reported" || r.status === "Enquiry Pending");
  const [index, setIndex] = useState(0);
  const safeIndex = pending.length === 0 ? 0 : Math.min(index, pending.length - 1);

  useEffect(() => {
    if (index > pending.length - 1 && pending.length > 0) setIndex(pending.length - 1);
  }, [pending.length, index]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, flexWrap: "wrap", gap: 10 }}>
        <h2 className="serif" style={{ fontSize: 19, margin: 0, color: "#1F2B3E" }}>Enquiry — pending cases</h2>
        {pending.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={safeIndex === 0}
              style={{ background: "none", border: "1px solid #C9BFA5", color: safeIndex === 0 ? "#B9B2A0" : "#1F2B3E", padding: "7px 14px", borderRadius: 4, fontSize: 12, cursor: safeIndex === 0 ? "not-allowed" : "pointer" }}
            >
              ← Previous
            </button>
            <span className="mono" style={{ fontSize: 12, color: "#8A8478" }}>Case {safeIndex + 1} of {pending.length}</span>
            <button
              onClick={() => setIndex((i) => Math.min(pending.length - 1, i + 1))}
              disabled={safeIndex === pending.length - 1}
              style={{ background: "none", border: "1px solid #C9BFA5", color: safeIndex === pending.length - 1 ? "#B9B2A0" : "#1F2B3E", padding: "7px 14px", borderRadius: 4, fontSize: 12, cursor: safeIndex === pending.length - 1 ? "not-allowed" : "pointer" }}
            >
              Next →
            </button>
          </div>
        )}
      </div>
      <p style={{ fontSize: 13, color: "#5B6472", marginBottom: 20 }}>Enter the enquiry outcome and penalty for this case, then set its final status. It moves to Case history once marked Resolved or Not Resolved.</p>

      {pending.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px 0", color: "#8A8478" }}>No cases currently awaiting enquiry.</div>
      ) : (
        (() => {
          const r = pending[safeIndex];
          const sc = STATUS_COLOR[r.status];
          return (
            <div key={r.id} style={{ border: "1px solid #DCD3BD", borderRadius: 6, padding: "22px 26px", background: "#FFFDF9" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 4 }}>
                <div className="mono" style={{ fontSize: 12, color: "#8A8478" }}>{r.caseNo}</div>
                <span className="stamp" style={{ background: sc.bg, color: sc.text, borderColor: sc.border }}>{r.status}</span>
              </div>

              <div style={sectionHeadStyle}>Case details</div>
              <CaseDetailPanel r={r} />

              <div style={sectionHeadStyle}>Penalty</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 20px", alignItems: "end" }}>
                <Field label="DX grade">
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer", paddingTop: 6 }}>
                    <input type="checkbox" checked={!!r.penaltyDX} onChange={(e) => onPatch(r.id, { penaltyDX: e.target.checked })} />
                    Award DX grade
                  </label>
                </Field>
                <Field label="Fine amount (Rs.)">
                  <input type="number" min="0" style={inputStyle} value={r.fineAmount || ""} placeholder="e.g. 5000" onChange={(e) => onPatch(r.id, { fineAmount: e.target.value })} />
                </Field>
                <Field label="Cancel registration">
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer", paddingTop: 6 }}>
                    <input type="checkbox" checked={!!r.cancelReg} onChange={(e) => onPatch(r.id, { cancelReg: e.target.checked })} />
                    Cancel the registration
                  </label>
                </Field>
              </div>

              <div style={{ marginTop: 14, display: "flex", alignItems: "flex-end", gap: 14, flexWrap: "wrap" }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#5B6472", marginBottom: 5, textTransform: "uppercase" }}>Enquiry status</label>
                  <select
                    style={{ ...inputStyle, width: "auto" }}
                    value={r.status}
                    onChange={(e) => {
                      const status = e.target.value;
                      onPatch(r.id, { status, notResolvedReason: status === "Not Resolved" ? r.notResolvedReason : "" });
                    }}
                  >
                    <option value="Reported">Reported</option>
                    <option value="Enquiry Pending">Enquiry Pending</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Not Resolved">Not Resolved</option>
                  </select>
                </div>
                <button
                  onClick={() => onPrint(r)}
                  style={{ background: "none", border: "1px solid #C9BFA5", color: "#1F2B3E", padding: "9px 14px", borderRadius: 4, fontSize: 12, cursor: "pointer" }}
                >
                  Print case report
                </button>
              </div>

              {r.status === "Not Resolved" && (
                <div style={{ marginTop: 12 }}>
                  <label style={{ fontSize: 12, color: "#7A2E2E", fontWeight: 600, display: "block", marginBottom: 4 }}>Reason not resolved:</label>
                  <input
                    style={{ ...inputStyle, borderColor: "#C08A87" }}
                    value={r.notResolvedReason || ""}
                    placeholder="e.g. Student did not appear for enquiry hearing"
                    onChange={(e) => onPatch(r.id, { notResolvedReason: e.target.value })}
                  />
                </div>
              )}
            </div>
          );
        })()
      )}
    </div>
  );
}

function Register({ reports, filters, setFilter, onPrint, onExport }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 12 }}>
        <h2 className="serif" style={{ fontSize: 19, margin: 0, color: "#1F2B3E" }}>Case register</h2>
        <button
          onClick={() => onExport(reports)}
          disabled={reports.length === 0}
          style={{ background: "#3B5A2A", color: "#FBF9F4", border: "none", padding: "9px 16px", borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: reports.length ? "pointer" : "not-allowed", opacity: reports.length ? 1 : 0.5, whiteSpace: "nowrap" }}
        >
          Export to Excel
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18, padding: "12px", background: "#F3EFE4", border: "1px solid #DCD3BD", borderRadius: 6 }}>
        <select style={{ ...inputStyle, width: "auto" }} value={filters.campus} onChange={(e) => setFilter("campus", e.target.value)}>
          <option value="All">All campuses</option>
          {CAMPUSES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select style={{ ...inputStyle, width: "auto" }} value={filters.status} onChange={(e) => setFilter("status", e.target.value)}>
          <option value="All">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select style={{ ...inputStyle, width: "auto" }} value={filters.programme} onChange={(e) => setFilter("programme", e.target.value)}>
          <option value="All">All programmes</option>
          {PROGRAMMES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select style={{ ...inputStyle, width: "auto" }} value={filters.semType} onChange={(e) => setFilter("semType", e.target.value)}>
          <option value="All">All semester types</option>
          {SEM_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select style={{ ...inputStyle, width: "auto" }} value={filters.component} onChange={(e) => setFilter("component", e.target.value)}>
          <option value="All">All components</option>
          {COMPONENTS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select style={{ ...inputStyle, width: "auto" }} value={filters.reporterRole} onChange={(e) => setFilter("reporterRole", e.target.value)}>
          <option value="All">All reporter roles</option>
          {REPORTER_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select style={{ ...inputStyle, width: "auto" }} value={filters.copyMode} onChange={(e) => setFilter("copyMode", e.target.value)}>
          <option value="All">All copying modes</option>
          {COPY_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <div style={{ fontSize: 12, color: "#8A8478", marginBottom: 14 }}>{reports.length} case{reports.length === 1 ? "" : "s"} matching this query</div>

      {reports.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px 0", color: "#8A8478" }}>
          No cases match this filter yet. File a report to begin the register.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {reports.map((r) => {
            const sc = STATUS_COLOR[r.status];
            return (
              <div key={r.id} style={{ border: "1px solid #DCD3BD", borderRadius: 6, padding: "18px 22px", background: "#FFFDF9" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 4 }}>
                  <div className="mono" style={{ fontSize: 12, color: "#8A8478" }}>{r.caseNo}</div>
                  <span className="stamp" style={{ background: sc.bg, color: sc.text, borderColor: sc.border }}>{r.status}</span>
                </div>

                <CaseDetailPanel r={r} />

                <div style={{ marginTop: 14 }}>
                  <button
                    onClick={() => onPrint(r)}
                    style={{ background: "none", border: "1px solid #C9BFA5", color: "#1F2B3E", padding: "5px 12px", borderRadius: 4, fontSize: 12, cursor: "pointer" }}
                  >
                    Print case report
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<MalpracticeRegister />);
