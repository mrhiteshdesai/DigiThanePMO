import { useState, type FormEvent } from "react";
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
  achieve: { title: "Achievements", blurb: "Live status of the workstream." },
  tasks: { title: "Workstream", blurb: "Full task list with owners and targets." },
  raci: { title: "RACI matrix", blurb: "" },
  roles: { title: "Delivery cell", blurb: "Job titles on the delivery team." },
  ask: { title: "Ask the Development Cell", blurb: "Questions are recorded on this site. On the published board they also arrive by email (Netlify)." },
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

function PartyKey() {
  const legend = data.parties.filter((p) => !["TMC", "RailTel", "Smartrags"].includes(p.code));
  return (
    <div className="party-key" aria-label="Column names">
      <div className="party-key-title">Delivery columns</div>
      <div className="party-grid">
        {legend.map((p) => (
          <div key={p.code} className="party-row">
            <span className="party-code">{p.code}</span>
            <span className="party-label">{p.label}</span>
          </div>
        ))}
      </div>
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
  const [askState, setAskState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [sessionThreads, setSessionThreads] = useState<{ from: string; q: string; at: string }[]>([]);

  const gates = data.roadmap.length;
  const done = data.roadmap.filter((r) => r.status === "done").length;
  const active = data.tasks.filter((t) => t.status.toLowerCase().includes("progress")).length;
  const blocked = data.tasks.filter((t) => t.rag === "amber" || t.status.toLowerCase().includes("block")).length;
  const page = PAGE[tab];

  async function submitQuestion(e: FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setAskState("sending");
    const payload = new URLSearchParams({
      "form-name": "pmo-question",
      from: from.trim() || "(not given)",
      question: q.trim(),
    });
    try {
      await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: payload.toString(),
      });
    } catch {
      /* local Vite has no Netlify Forms — still keep the thread on this page */
    }
    setSessionThreads((rows) => [
      { from: from.trim() || "(not given)", q: q.trim(), at: new Date().toLocaleString("en-GB") },
      ...rows,
    ]);
    setQ("");
    setAskState("sent");
  }

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
            {tab === "raci" ? (
              <>
                <RaciKey />
                <PartyKey />
              </>
            ) : page.blurb ? (
              <p className="lede">{page.blurb}</p>
            ) : null}
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
              <form className="ask-form" name="pmo-question" method="POST" onSubmit={submitQuestion}>
                <input type="hidden" name="form-name" value="pmo-question" />
                <p className="honeypot" aria-hidden>
                  <label>
                    Don’t fill this
                    <input name="bot-field" tabIndex={-1} autoComplete="off" />
                  </label>
                </p>
                <label htmlFor="pmo-from">Name / organisation</label>
                <input
                  id="pmo-from"
                  name="from"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  autoComplete="organization"
                />
                <label htmlFor="pmo-q">Question</label>
                <textarea id="pmo-q" name="question" rows={6} value={q} onChange={(e) => setQ(e.target.value)} required />
                <button className="btn" type="submit" disabled={askState === "sending"}>
                  {askState === "sending" ? "Sending…" : "Submit question"}
                </button>
                {askState === "sent" ? (
                  <p className="lede">Recorded on this board. A written reply can appear in Threads after the next publish.</p>
                ) : null}
                {askState === "error" ? <p className="lede">Could not send. Try again.</p> : null}
              </form>
              <div className="ask-threads">
                <div className="chat-head">
                  <div className="stat-label">Threads</div>
                  <span className="chat-sub">Questions and replies</span>
                </div>
                {data.messages.length === 0 && sessionThreads.length === 0 ? (
                  <div className="chat-empty">No messages yet. Submit a question above.</div>
                ) : (
                  <div className="chat-feed">
                    {[...sessionThreads].reverse().map((m, i) => (
                      <div key={`s-${i}`} className="chat-row in">
                        <div className="chat-bubble">
                          <div className="chat-meta">{m.from}</div>
                          <p>{m.q}</p>
                          <div className="chat-time">{m.at}</div>
                        </div>
                      </div>
                    ))}
                    {(data.messages as Array<string | Record<string, string>>).map((m, i) => {
                      if (typeof m === "string") {
                        return (
                          <div key={i} className="chat-row in">
                            <div className="chat-bubble">
                              <div className="chat-meta">Question</div>
                              <p>{m}</p>
                            </div>
                          </div>
                        );
                      }
                      const question = m.question || m.body || m.q;
                      const answer = m.answer || m.reply;
                      return (
                        <div key={i} className="chat-thread">
                          {question ? (
                            <div className="chat-row in">
                              <div className="chat-bubble">
                                <div className="chat-meta">{m.from || "Question"}</div>
                                <p>{question}</p>
                              </div>
                            </div>
                          ) : null}
                          {answer ? (
                            <div className="chat-row out">
                              <div className="chat-bubble">
                                <div className="chat-meta">Development Cell</div>
                                <p>{answer}</p>
                              </div>
                            </div>
                          ) : !question ? (
                            <div className="chat-row in">
                              <div className="chat-bubble">
                                <p>{JSON.stringify(m)}</p>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
