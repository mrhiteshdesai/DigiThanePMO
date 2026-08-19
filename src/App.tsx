import { useMemo, useState } from "react";
import data from "./data/pmo-kickoff.json";

type Tab = "roadmap" | "achieve" | "tasks" | "raci" | "roles" | "ask";

const RACI_COLOR: Record<string, string> = {
  R: "#0f6b4c",
  A: "#b42318",
  C: "#c9a227",
  I: "#1e4d8c",
  "-": "#e4e7ec",
};
const RACI_FG: Record<string, string> = {
  R: "#fff",
  A: "#fff",
  C: "#1a1404",
  I: "#fff",
  "-": "#667085",
};

const RACI_TERMS: { code: string; word: string }[] = [
  { code: "A", word: "Accountable" },
  { code: "R", word: "Responsible" },
  { code: "C", word: "Consulted" },
  { code: "I", word: "Informed" },
  { code: "-", word: "Not in this row" },
];

const NAV: { id: Tab; label: string; kicker: string }[] = [
  { id: "roadmap", label: "Roadmap", kicker: "Gates" },
  { id: "achieve", label: "Achievements", kicker: "Status" },
  { id: "tasks", label: "Workstream", kicker: "Plan" },
  { id: "raci", label: "RACI", kicker: "Owners" },
  { id: "roles", label: "Delivery cell", kicker: "People" },
  { id: "ask", label: "Ask the cell", kicker: "Inbox" },
];

const PAGE: Record<Tab, { title: string; blurb: string }> = {
  roadmap: { title: "Delivery roadmap", blurb: "Agreement 31 Jul 2026 · public go-live 30 Nov 2026" },
  achieve: { title: "Achievements", blurb: "Live status. The Excel download does not carry this column." },
  tasks: { title: "Workstream", blurb: "Full task list with owners and targets." },
  raci: { title: "RACI matrix", blurb: "" },
  roles: { title: "Delivery cell", blurb: "TMC writes to the Project Manager only." },
  ask: { title: "Ask the Development Cell", blurb: "Acknowledge in 1 working day. Answer in 3. Not instant chat." },
};

function achieveRank(t: { status: string; rag: string }) {
  const s = t.status.toLowerCase();
  if (s.includes("progress")) return 0;
  if (s.includes("next")) return 1;
  if (s.includes("wait") || t.rag === "amber") return 2;
  if (s.includes("done") || s.includes("complete")) return 4;
  return 3;
}

function fmtDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function RaciKey() {
  return (
    <div className="raci-key" aria-label="RACI terminology">
      {RACI_TERMS.map((item) => (
        <span key={item.code} className="raci-term">
          <span className="raci-cell" style={{ background: RACI_COLOR[item.code], color: RACI_FG[item.code] }}>
            {item.code === "-" ? "—" : item.code}
          </span>
          <span className="raci-word">
            {item.code === "-" ? "—" : item.code} · {item.word}
          </span>
        </span>
      ))}
    </div>
  );
}

function pillClass(status: string, rag?: string) {
  const s = status.toLowerCase();
  if (s.includes("done")) return "pill pill-ok";
  if (s.includes("progress") || s === "next") return "pill pill-run";
  if (rag === "amber" || s.includes("wait") || s.includes("block")) return "pill pill-watch";
  return "pill pill-idle";
}

export default function App() {
  const [tab, setTab] = useState<Tab>("roadmap");
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");

  const gates = data.roadmap.length;
  const done = data.roadmap.filter((r) => r.status === "done").length;
  const active = data.tasks.filter((t) => t.status.toLowerCase().includes("progress")).length;
  const blocked = data.tasks.filter((t) => t.rag === "amber" || t.status.toLowerCase().includes("block")).length;
  const page = PAGE[tab];

  const mailto = useMemo(() => {
    const to = import.meta.env.VITE_PM_EMAIL || "";
    const subject = encodeURIComponent("DigiThane PMO question");
    const body = encodeURIComponent(
      `From: ${from || "(name / organisation)"}\n\n${q}\n\n— sent from Ask the Development Cell`,
    );
    const addr = to ? `mailto:${to}` : "mailto:";
    return `${addr}?subject=${subject}&body=${body}`;
  }, [from, q]);

  return (
    <div className="shell">
      <aside className="rail">
        <div className="rail-brand">
          <div className="mark" aria-hidden />
          <div>
            <div className="rail-name">DigiThane</div>
            <div className="rail-sub">Delivery PMO</div>
          </div>
        </div>

        <nav className="rail-nav">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              className={tab === item.id ? "nav-item on" : "nav-item"}
              onClick={() => setTab(item.id)}
            >
              <span className="nav-kicker">{item.kicker}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="rail-foot">
          <div className="rail-foot-label">Go-live</div>
          <div className="rail-foot-value">{fmtDate(data.goLive)}</div>
        </div>
      </aside>

      <div className="main">
        <header className="top">
          <div>
            <p className="eyebrow">DigiThane 2.0</p>
            <h1>{page.title}</h1>
            {tab === "raci" ? <RaciKey /> : page.blurb ? <p className="lede">{page.blurb}</p> : null}
          </div>
          <div className="top-meta">
            <div className="chip">
              Updated <strong>{fmtDate(data.updated)}</strong>
            </div>
            <div className="chip">
              Agreement <strong>{fmtDate(data.loi)}</strong>
            </div>
          </div>
        </header>

        <section className="stats">
          <article className="stat">
            <span className="stat-label">Gates closed</span>
            <strong>
              {done}
              <em>/{gates}</em>
            </strong>
          </article>
          <article className="stat">
            <span className="stat-label">In flight</span>
            <strong>{active}</strong>
          </article>
          <article className="stat">
            <span className="stat-label">Waiting / blocked</span>
            <strong className={blocked ? "warn" : ""}>{blocked}</strong>
          </article>
        </section>

        {tab === "roadmap" ? (
          <p className="how">Updated: Everyday EOD (IST) Status Is Refreshed By Development Cell</p>
        ) : null}

        <section className="panel">
          {tab === "roadmap" && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Gate</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>What TMC should see</th>
                  </tr>
                </thead>
                <tbody>
                  {data.roadmap.map((row) => (
                    <tr key={row.gate}>
                      <td className="cell-strong">{row.gate}</td>
                      <td className="cell-mono">{row.date}</td>
                      <td>
                        <span className={pillClass(row.status)}>{row.status.replace("_", " ")}</span>
                      </td>
                      <td className="cell-muted">{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "achieve" && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Phase</th>
                    <th>ID</th>
                    <th>Task</th>
                    <th>Target</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[...data.tasks]
                    .sort((a, b) => achieveRank(a) - achieveRank(b))
                    .map((t) => (
                      <tr key={`${t.phase}-${t.id}`}>
                        <td className="cell-muted">{t.phase}</td>
                        <td className="cell-mono">{t.id}</td>
                        <td className="cell-strong">{t.name}</td>
                        <td className="cell-mono">{t.target}</td>
                        <td>
                          <span className={pillClass(t.status, t.rag)}>{t.status}</span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "tasks" && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Phase</th>
                    <th>ID</th>
                    <th>Task</th>
                    <th>Owner</th>
                    <th>Target</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.tasks.map((t) => (
                    <tr key={`${t.phase}-${t.id}`}>
                      <td className="cell-muted">{t.phase}</td>
                      <td className="cell-mono">{t.id}</td>
                      <td className="cell-strong">{t.name}</td>
                      <td className="cell-muted">{t.role}</td>
                      <td className="cell-mono">{t.target}</td>
                      <td>
                        <span className={pillClass(t.status, t.rag)}>{t.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "raci" && (
            <div className="table-wrap raci-wrap">
              <table className="raci">
                <thead>
                  <tr>
                    <th>Activity</th>
                    {data.parties.map((p) => (
                      <th key={p.code} title={p.label}>
                        {p.code}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.raciPhases.flatMap((p) => [
                    <tr key={p.id} className="phase-row">
                      <td colSpan={1 + data.parties.length}>{p.spacer}</td>
                    </tr>,
                    ...p.activities.map((act, i) => (
                      <tr key={`${p.id}-${act}`}>
                        <td className="raci-act">{act}</td>
                        {p.codes[i].map((code, j) => (
                          <td key={data.parties[j].code}>
                            <span
                              className="raci-cell"
                              style={{ background: RACI_COLOR[code], color: RACI_FG[code] }}
                            >
                              {code === "-" ? "—" : code}
                            </span>
                          </td>
                        ))}
                      </tr>
                    )),
                  ])}
                </tbody>
              </table>
            </div>
          )}

          {tab === "roles" && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Role</th>
                    <th>Mandate</th>
                  </tr>
                </thead>
                <tbody>
                  {data.roles.map((r) => (
                    <tr key={r.role}>
                      <td className="cell-strong">{r.role}</td>
                      <td className="cell-muted">{r.mandate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "ask" && (
            <div className="ask">
              <div className="ask-copy">
                <p>{data.sla.contact}</p>
                <p className="cell-muted">
                  Replies come from the Development Cell through the Project Manager. Written answers appear here on the
                  next publish.
                </p>
              </div>
              <form className="ask-form" onSubmit={(e) => e.preventDefault()}>
                <label htmlFor="pmo-from">Name / organisation</label>
                <input id="pmo-from" value={from} onChange={(e) => setFrom(e.target.value)} autoComplete="organization" />
                <label htmlFor="pmo-q">Question</label>
                <textarea id="pmo-q" rows={6} value={q} onChange={(e) => setQ(e.target.value)} />
                <a className="btn" href={mailto}>
                  Send to Project Manager
                </a>
              </form>
              <div className="ask-threads">
                <div className="stat-label">Threads</div>
                {data.messages.length === 0 ? (
                  <p className="empty">No threads yet.</p>
                ) : (
                  <ul>
                    {(data.messages as Array<string | Record<string, string>>).map((m, i) => (
                      <li key={i}>{typeof m === "string" ? m : m.answer || m.body || JSON.stringify(m)}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
