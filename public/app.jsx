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

const USERS = [
  { id: "COE", label: "Controller of Examinations (COE)" },
  { id: "NDepCOE", label: "North Dept. COE" },
  { id: "SDepCOE", label: "South Dept. COE" },
  { id: "NorthMPC", label: "North Campus MPC" },
  { id: "SouthMPC", label: "South Campus MPC" },
];

const TOKEN_KEY = "mpr_token";
const USER_KEY = "mpr_user";

async function apiRequest(path, { method = "GET", token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch (e) { /* non-JSON response */ }
  if (!res.ok || !data || data.ok === false) {
    throw new Error((data && data.error) || `Request failed (${res.status})`);
  }
  return data;
}

const SEM_TYPE_SHORT = { "Odd": "Odd", "Even": "Even", "Suppl/Summer": "Summ" };

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function caseNumber(data, serial) {
  const semShort = SEM_TYPE_SHORT[data.semType] || data.semType || "NA";
  const component = data.component || "NA";
  const campus = data.campus || "NA";
  const year = data.academicYear || "NA";
  return `${year}/${semShort}/${component}/${campus}/MPC${String(serial).padStart(3, "0")}`;
}

function LoginScreen({ onLogin }) {
  const [userId, setUserId] = useState(USERS[0].id);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const data = await apiRequest("/api/login", { method: "POST", body: { userId, password } });
      onLogin(data.user, data.token);
    } catch (err) {
      setError(err.message || "Incorrect user or password.");
    } finally {
      setSubmitting(false);
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
            {USERS.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
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
          disabled={submitting}
          style={{ marginTop: 14, width: "100%", background: "#1F2B3E", color: "#EFEAE0", border: "none", padding: "11px 24px", borderRadius: 4, fontSize: 14, fontWeight: 600, cursor: submitting ? "default" : "pointer", opacity: submitting ? 0.7 : 1 }}
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>

        <div style={{ marginTop: 18, fontSize: 11, color: "#8A8478", lineHeight: 1.5 }}>
          All logged-in users currently have the same rights: view, create, and edit cases for either campus.
        </div>
      </form>
    </div>
  );
}

function MalpracticeRegister() {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [reports, setReports] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState("");
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

  // Restore a previous session (if any) and check it's still valid before
  // trusting it — the server may have been restarted, or the password changed.
  useEffect(() => {
    (async () => {
      const savedToken = localStorage.getItem(TOKEN_KEY);
      const savedUser = localStorage.getItem(USER_KEY);
      if (savedToken && savedUser) {
        try {
          await apiRequest("/api/me", { token: savedToken });
          setToken(savedToken);
          setCurrentUser(JSON.parse(savedUser));
        } catch (e) {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
        }
      }
      setAuthChecked(true);
    })();
  }, []);

  function handleLogin(user, tok) {
    localStorage.setItem(TOKEN_KEY, tok);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    setToken(tok);
    setCurrentUser(user);
  }

  function handleLogout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setCurrentUser(null);
    setReports([]);
    setLoaded(false);
  }

  useEffect(() => {
    if (!currentUser || !token) return;
    (async () => {
      try {
        const data = await apiRequest("/api/reports", { token });
        setReports(data.reports || []);
        setLoadError("");
      } catch (e) {
        setLoadError(e.message || "Could not load cases from the shared register.");
      } finally {
        setLoaded(true);
      }
    })();
  }, [currentUser, token]);

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
    const res = await apiRequest("/api/reports", { method: "POST", token, body: data });
    const entry = res.report;
    setReports((prev) => [entry, ...prev]);
    setSaveNote(`Case ${entry.caseNo} saved. It now awaits enquiry.`);
    setTimeout(() => setSaveNote(""), 3500);
    setTab("new");
  }

  async function patchReport(id, patch) {
    try {
      const res = await apiRequest(`/api/reports/${id}`, { method: "PATCH", token, body: patch });
      setReports((prev) => prev.map((r) => (r.id === id ? res.report : r)));
      setLoadError("");
      return true;
    } catch (e) {
      setLoadError(e.message || "Could not save that change — check your connection and try again.");
      return false;
    }
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
      "Penalty Comments": r.penaltyComments || "",
      "Status": r.status,
      "Not Resolved Reason": r.notResolvedReason || "",
      "Description": r.description || "",
      "Entered By": r.enteredBy || "",
      "Last Edited By": r.lastEditedBy || "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = new Array(24).fill({ wch: 16 });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Malpractice Register");
    XLSX.writeFile(wb, `malpractice_register_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  if (!authChecked) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#8A8478", fontFamily: "Inter, sans-serif" }}>
        Loading…
      </div>
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
        @page { size: A4; margin: 14mm 16mm; }
        @media print {
          html, body { background: #fff !important; margin: 0 !important; }
          .no-print { display: none !important; }
          .system-info { display: none !important; }
          .print-sheet { display: block !important; }
        }
      `}</style>

      {printTarget && <PrintableCase report={printTarget} />}

      <div className="no-print">
      <div style={{ background: "#1F2B3E", color: "#EFEAE0", padding: "22px 32px", borderBottom: "5px double #A6813C" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div className="serif" style={{ fontSize: 24, fontWeight: 700, letterSpacing: "0.01em" }}>Office of the Controller of Examinations</div>
            <div className="mono" style={{ fontSize: 12, color: "#C9BFA5", marginTop: 4, letterSpacing: "0.05em" }}>EXAMINATION MALPRACTICE REGISTER — SHARED WEB EDITION</div>
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

          {loadError && (
            <div style={{ background: "#F1E0DE", border: "1px solid #C08A87", color: "#7A2E2E", padding: "8px 14px", borderRadius: 4, fontSize: 13, marginBottom: 18 }}>
              {loadError}
            </div>
          )}

          {!loaded ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#8A8478" }}>Loading cases from the shared register…</div>
          ) : (
            <>
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
              {tab === "users" && currentUser.id === "COE" && <ManageUsers token={token} />}
            </>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "18px 32px 40px", fontSize: 11, color: "#8A8478" }} className="mono">
        Data is stored in the shared Google Sheet — visible to every signed-in user, on any device.
      </div>
      </div>
    </div>
  );
}

function PrintableCase({ report: r }) {
  const mode = r.copyMode === "Other" ? `Other — ${r.copyModeOther || ""}` : r.copyMode;
  const course = r.course ? `${r.course}${r.courseCode ? " (" + r.courseCode + ")" : ""}` : r.courseCode;
  // Pairs of [label, value] shown two per row to keep the report on one page.
  const details = [
    ["Case No.", r.caseNo], ["Date Reported", r.dateReported],
    ["Academic Year", r.academicYear], ["Campus", r.campus],
    ["Programme", r.programme], ["Semester Type", r.semType],
    ["Component", r.component], ["Semester", r.sem],
    ["Student Name", r.studentName], ["USN", r.usn],
    ["Course", course], ["Room Number", r.roomNo],
    ["Date of Exam", r.examDate], ["Time", r.examTime],
    ["Mode of Copying", mode], ["Reported By", r.reporterName ? `${r.reporterName} (${r.reporterRole})` : ""],
    ["Current Status", r.status], r.status === "Not Resolved" ? ["Reason (Not Resolved)", r.notResolvedReason] : null,
  ];
  const rows = [];
  for (let i = 0; i < details.length; i += 2) rows.push([details[i], details[i + 1]]);

  const labelCell = { padding: "3px 6px 3px 0", width: "18%", fontWeight: 700, verticalAlign: "top" };
  const valueCell = { padding: "3px 12px 3px 0", width: "32%", verticalAlign: "top" };

  return (
    <div className="print-sheet serif" style={{ color: "#111", fontSize: 12, lineHeight: 1.4 }}>
      <div style={{ textAlign: "center", borderBottom: "3px double #111", paddingBottom: 10, marginBottom: 14 }}>
        <div style={{ fontSize: 17, fontWeight: 700 }}>Office of the Controller of Examinations</div>
        <div style={{ fontSize: 12, marginTop: 3 }}>Examination Malpractice — Incident Report</div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 14 }}>
        <tbody>
          {rows.map(([a, b], i) => (
            <tr key={i}>
              <td style={labelCell}>{a[0]}</td>
              <td style={valueCell}>{a[1] || "—"}</td>
              <td style={labelCell}>{b ? b[0] : ""}</td>
              <td style={valueCell}>{b ? b[1] || "—" : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginBottom: 14, pageBreakInside: "avoid" }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>Description of incident</div>
        <div style={{ border: "1px solid #999", minHeight: 40, padding: 8, whiteSpace: "pre-wrap" }}>{r.description || "—"}</div>
      </div>

      <div style={{ marginBottom: 14, pageBreakInside: "avoid" }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>Penalty imposed</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={labelCell}>DX Grade</td>
              <td style={valueCell}>{r.penaltyDX ? "Yes" : "No"}</td>
              <td style={labelCell}>Fine Amount</td>
              <td style={valueCell}>{r.fineAmount ? `Rs. ${r.fineAmount}` : "—"}</td>
            </tr>
            <tr>
              <td style={labelCell}>Cancel Registration</td>
              <td style={valueCell}>{r.cancelReg ? "Yes" : "No"}</td>
              <td style={labelCell}></td>
              <td style={valueCell}></td>
            </tr>
            <tr>
              <td style={labelCell}>Penalty Comments</td>
              <td colSpan={3} style={{ padding: "3px 0", verticalAlign: "top", whiteSpace: "pre-wrap" }}>{r.penaltyComments || "—"}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 60, pageBreakInside: "avoid", breakInside: "avoid" }}>
        <div style={{ textAlign: "center", width: 220 }}>
          <div style={{ borderTop: "1px solid #111", paddingTop: 5, fontSize: 13, fontWeight: 700 }}>Controller of Examinations</div>
        </div>
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

function DetailRow({ label, value, className }) {
  return (
    <div className={className} style={{ display: "flex", gap: 10, fontSize: 13, padding: "5px 0", borderBottom: "1px dashed #E9E2CF" }}>
      <span style={{ fontWeight: 700, color: "#1F2B3E", minWidth: 150, flexShrink: 0 }}>{label}:</span>
      <span style={{ color: "#3B3A36" }}>{value || "—"}</span>
    </div>
  );
}

function CaseDetailPanel({ r, hidePenalty = false }) {
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
        {!hidePenalty && (r.penaltyDX || r.fineAmount || r.cancelReg) && (
          <DetailRow
            label="Penalty"
            value={[
              r.penaltyDX ? "DX grade" : null,
              r.fineAmount ? `Fine Rs. ${r.fineAmount}` : null,
              r.cancelReg ? "Registration cancelled" : null,
            ].filter(Boolean).join(" · ") || null}
          />
        )}
        {!hidePenalty && r.penaltyComments && (
          <DetailRow label="Penalty Comments" value={r.penaltyComments} />
        )}
        {!hidePenalty && r.status === "Not Resolved" && r.notResolvedReason && (
          <DetailRow label="Reason Not Resolved" value={r.notResolvedReason} />
        )}
        {r.enteredBy && <DetailRow className="system-info" label="Entered By (system)" value={r.enteredBy} />}
        {r.lastEditedBy && <DetailRow className="system-info" label="Last Edited By (system)" value={r.lastEditedBy} />}
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
  const [submitting, setSubmitting] = useState(false);

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const classified = form.academicYear && form.programme && form.semType && form.component;

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
    setSubmitting(true);
    try {
      await onSubmit(form);
      setForm(EMPTY_FORM);
    } catch (e) {
      setError(e.message || "Could not save the report — check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
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
          disabled={submitting}
          style={{
            background: "#1F2B3E",
            color: "#EFEAE0",
            border: "none",
            padding: "11px 24px",
            borderRadius: 4,
            fontSize: 14,
            fontWeight: 600,
            cursor: submitting ? "default" : "pointer",
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting ? "Saving…" : "Save report"}
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

function enquiryDraftFrom(r) {
  return {
    penaltyDX: !!r.penaltyDX,
    fineAmount: r.fineAmount || "",
    cancelReg: !!r.cancelReg,
    penaltyComments: r.penaltyComments || "",
    status: r.status || "Reported",
    notResolvedReason: r.notResolvedReason || "",
  };
}

function Enquiry({ reports, onPatch, onPrint }) {
  const pending = reports.filter((r) => r.status === "Reported" || r.status === "Enquiry Pending");
  const [index, setIndex] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [savedNote, setSavedNote] = useState("");
  const safeIndex = pending.length === 0 ? 0 : Math.min(index, pending.length - 1);

  useEffect(() => {
    if (index > pending.length - 1 && pending.length > 0) setIndex(pending.length - 1);
  }, [pending.length, index]);

  function goTo(newIndex) {
    if (dirty && !window.confirm("You have unsaved changes on this case. Leave without saving?")) return;
    setDirty(false);
    setSavedNote("");
    setIndex(newIndex);
  }

  function handleSaved(caseNo, status) {
    setDirty(false);
    const leftList = status === "Resolved" || status === "Not Resolved";
    setSavedNote(
      leftList
        ? `Enquiry for ${caseNo} saved as ${status}. It has moved to Case history.`
        : `Enquiry for ${caseNo} saved.`
    );
    setTimeout(() => setSavedNote(""), 4000);
  }

  const navBtn = (disabled) => ({
    background: "none", border: "1px solid #C9BFA5", color: disabled ? "#B9B2A0" : "#1F2B3E",
    padding: "7px 14px", borderRadius: 4, fontSize: 12, cursor: disabled ? "not-allowed" : "pointer",
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, flexWrap: "wrap", gap: 10 }}>
        <h2 className="serif" style={{ fontSize: 19, margin: 0, color: "#1F2B3E" }}>Enquiry — pending cases</h2>
        {pending.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => goTo(Math.max(0, safeIndex - 1))} disabled={safeIndex === 0} style={navBtn(safeIndex === 0)}>
              ← Previous
            </button>
            <span className="mono" style={{ fontSize: 12, color: "#8A8478" }}>Case {safeIndex + 1} of {pending.length}</span>
            <button onClick={() => goTo(Math.min(pending.length - 1, safeIndex + 1))} disabled={safeIndex === pending.length - 1} style={navBtn(safeIndex === pending.length - 1)}>
              Next →
            </button>
          </div>
        )}
      </div>
      <p style={{ fontSize: 13, color: "#5B6472", marginBottom: 20 }}>
        Enter the penalty, comments and enquiry status for this case, then press <strong>Save enquiry</strong>. Nothing is saved until you press Save. Cases marked Resolved or Not Resolved move to Case history.
      </p>

      {savedNote && (
        <div style={{ background: "#E3ECD9", border: "1px solid #8AAE6F", color: "#3B5A2A", padding: "8px 14px", borderRadius: 4, fontSize: 13, marginBottom: 16 }}>
          {savedNote}
        </div>
      )}

      {pending.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px 0", color: "#8A8478" }}>No cases currently awaiting enquiry.</div>
      ) : (
        <EnquiryCard
          key={pending[safeIndex].id}
          r={pending[safeIndex]}
          onPatch={onPatch}
          onPrint={onPrint}
          onDirtyChange={setDirty}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

function EnquiryCard({ r, onPatch, onPrint, onDirtyChange, onSaved }) {
  const [draft, setDraft] = useState(() => enquiryDraftFrom(r));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const original = enquiryDraftFrom(r);
  const dirty = Object.keys(draft).some((k) => draft[k] !== original[k]);

  useEffect(() => { onDirtyChange(dirty); }, [dirty]);

  // Warn before closing/refreshing the browser tab with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  function set(k, v) {
    setError("");
    setDraft((d) => ({ ...d, [k]: v }));
  }

  async function handleSave() {
    if (draft.status === "Not Resolved" && !draft.notResolvedReason.trim()) {
      setError('Enter the reason, since the status is "Not Resolved".');
      return;
    }
    setSaving(true);
    setError("");
    const patch = {
      ...draft,
      penaltyComments: draft.penaltyComments.trim(),
      notResolvedReason: draft.status === "Not Resolved" ? draft.notResolvedReason.trim() : "",
    };
    const ok = await onPatch(r.id, patch);
    setSaving(false);
    if (ok) {
      onDirtyChange(false);
      onSaved(r.caseNo, patch.status);
    } else {
      setError("Could not save — check your connection and try again. Your entries are still here.");
    }
  }

  const sc = STATUS_COLOR[r.status];

  return (
    <div style={{ border: "1px solid #DCD3BD", borderRadius: 6, padding: "22px 26px", background: "#FFFDF9" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 4 }}>
        <div className="mono" style={{ fontSize: 12, color: "#8A8478" }}>{r.caseNo}</div>
        <span className="stamp" style={{ background: sc.bg, color: sc.text, borderColor: sc.border }}>{r.status}</span>
      </div>

      <div style={sectionHeadStyle}>Case details</div>
      <CaseDetailPanel r={r} hidePenalty />

      <div style={sectionHeadStyle}>Penalty</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 20px", alignItems: "end" }}>
        <Field label="DX grade">
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer", paddingTop: 6 }}>
            <input type="checkbox" checked={draft.penaltyDX} onChange={(e) => set("penaltyDX", e.target.checked)} />
            Award DX grade
          </label>
        </Field>
        <Field label="Fine amount (Rs.)">
          <input type="number" min="0" style={inputStyle} value={draft.fineAmount} placeholder="e.g. 5000" onChange={(e) => set("fineAmount", e.target.value)} />
        </Field>
        <Field label="Cancel registration">
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer", paddingTop: 6 }}>
            <input type="checkbox" checked={draft.cancelReg} onChange={(e) => set("cancelReg", e.target.checked)} />
            Cancel the registration
          </label>
        </Field>
      </div>
      <div style={{ marginTop: 4 }}>
        <Field label="Penalty comments">
          <textarea
            style={{ ...inputStyle, minHeight: 70, resize: "vertical", fontFamily: "Inter, sans-serif" }}
            value={draft.penaltyComments}
            placeholder="Any additional remarks on the penalty or enquiry outcome"
            onChange={(e) => set("penaltyComments", e.target.value)}
          />
        </Field>
      </div>

      <div style={{ marginTop: 6 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#5B6472", marginBottom: 5, textTransform: "uppercase" }}>Enquiry status</label>
        <select style={{ ...inputStyle, width: "auto" }} value={draft.status} onChange={(e) => set("status", e.target.value)}>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {draft.status === "Not Resolved" && (
        <div style={{ marginTop: 12 }}>
          <label style={{ fontSize: 12, color: "#7A2E2E", fontWeight: 600, display: "block", marginBottom: 4 }}>Reason not resolved (required):</label>
          <input
            style={{ ...inputStyle, borderColor: "#C08A87" }}
            value={draft.notResolvedReason}
            placeholder="e.g. Student did not appear for enquiry hearing"
            onChange={(e) => set("notResolvedReason", e.target.value)}
          />
        </div>
      )}

      {error && <div style={{ color: "#7A2E2E", fontSize: 13, marginTop: 12 }}>{error}</div>}

      <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <button
          onClick={handleSave}
          disabled={saving || !dirty}
          style={{
            background: "#1F2B3E", color: "#EFEAE0", border: "none", padding: "11px 24px", borderRadius: 4,
            fontSize: 14, fontWeight: 600, cursor: saving || !dirty ? "default" : "pointer", opacity: saving || !dirty ? 0.6 : 1,
          }}
        >
          {saving ? "Saving…" : "Save enquiry"}
        </button>
        <button
          onClick={() => { setDraft(enquiryDraftFrom(r)); setError(""); }}
          disabled={saving || !dirty}
          style={{ background: "none", color: "#5B6472", border: "1px solid #C9BFA5", padding: "11px 20px", borderRadius: 4, fontSize: 14, fontWeight: 600, cursor: saving || !dirty ? "default" : "pointer", opacity: !dirty ? 0.6 : 1 }}
        >
          Discard changes
        </button>
        <button
          onClick={() => onPrint({ ...r, ...draft })}
          style={{ background: "none", border: "1px solid #C9BFA5", color: "#1F2B3E", padding: "11px 16px", borderRadius: 4, fontSize: 13, cursor: "pointer" }}
        >
          Print case report
        </button>
        {dirty && !saving && <span style={{ fontSize: 12, color: "#A6813C" }}>Unsaved changes</span>}
      </div>
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

function ManageUsers({ token }) {
  const [users, setUsers] = useState(USERS);
  const [passwords, setPasswords] = useState({});
  const [status, setStatus] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const data = await apiRequest("/api/users", { token });
        if (data.users) setUsers(data.users);
      } catch (e) {
        // Fall back to the static list above; the update button still works.
      }
    })();
  }, [token]);

  async function updatePassword(userId) {
    const password = (passwords[userId] || "").trim();
    if (password.length < 4) {
      setStatus((s) => ({ ...s, [userId]: { ok: false, message: "Password must be at least 4 characters." } }));
      return;
    }
    try {
      await apiRequest(`/api/users/${userId}/password`, { method: "POST", token, body: { password } });
      setStatus((s) => ({ ...s, [userId]: { ok: true, message: "Password updated." } }));
      setPasswords((p) => ({ ...p, [userId]: "" }));
    } catch (e) {
      setStatus((s) => ({ ...s, [userId]: { ok: false, message: e.message || "Could not update password." } }));
    }
  }

  return (
    <div>
      <h2 className="serif" style={{ fontSize: 19, margin: "0 0 8px", color: "#1F2B3E" }}>Manage users</h2>
      <p style={{ fontSize: 13, color: "#5B6472", marginBottom: 20 }}>
        Set a new password for any account. It updates the shared Sheet immediately, so it works from every device right away.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {users.map((u) => (
          <div key={u.id} style={{ border: "1px solid #DCD3BD", borderRadius: 6, padding: "14px 18px", background: "#FFFDF9", display: "flex", alignItems: "flex-end", gap: 14, flexWrap: "wrap" }}>
            <div style={{ minWidth: 220 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1F2B3E" }}>{u.label}</div>
              <div className="mono" style={{ fontSize: 11, color: "#8A8478" }}>{u.id}</div>
            </div>
            <Field label="New password">
              <input
                type="password"
                style={inputStyle}
                value={passwords[u.id] || ""}
                placeholder="At least 4 characters"
                onChange={(e) => setPasswords((p) => ({ ...p, [u.id]: e.target.value }))}
              />
            </Field>
            <button
              onClick={() => updatePassword(u.id)}
              style={{ background: "#1F2B3E", color: "#EFEAE0", border: "none", padding: "9px 16px", borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              Update password
            </button>
            {status[u.id] && (
              <span style={{ fontSize: 12, color: status[u.id].ok ? "#3B5A2A" : "#7A2E2E" }}>{status[u.id].message}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<MalpracticeRegister />);
