"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Activity, ArrowRight, CheckCheck, Clock3, DollarSign, Radio, Users } from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";

type Status = "todo" | "doing" | "done";
type Agent = "Codex" | "cursor" | "Antigravity";
type Task = { id: string; title: string; status: Status; agent: Agent; priority: "Alta" | "Normal" };
type Event = { id: string; text: string; time: string };
type UsageSnapshot = {
  version: 1;
  label: "estimate";
  currency: "USD";
  llm_calls: number;
  tokens_in: number;
  tokens_out: number;
  estimated_usd: number;
  source?: string;
  case_id?: string;
};

const KEY = "mola.workspace.v1";
const USAGE_KEY = "mola.usage.v1";
const USAGE_PREF_KEY = "mola.usage.prefs.v1";
const agents: Agent[] = ["Codex", "cursor", "Antigravity"];
const DEFAULT_API_BASE = "http://127.0.0.1:8080";

function readUsageSnapshot(): UsageSnapshot | null {
  try {
    const saved = JSON.parse(localStorage.getItem(USAGE_KEY) || "null");
    if (
      saved?.version === 1 &&
      saved?.currency === "USD" &&
      saved?.label === "estimate" &&
      typeof saved.llm_calls === "number" &&
      typeof saved.tokens_in === "number" &&
      typeof saved.tokens_out === "number" &&
      typeof saved.estimated_usd === "number"
    ) {
      return saved as UsageSnapshot;
    }
  } catch {
    /* offline admin stays honest */
  }
  return null;
}

function persistUsage(snapshot: UsageSnapshot) {
  localStorage.setItem(USAGE_KEY, JSON.stringify(snapshot));
}

function normalizeApiBase(raw: string): string {
  return raw.trim().replace(/\/+$/, "");
}

function usageFromApiPayload(payload: Record<string, unknown>, source: string): UsageSnapshot | null {
  if (
    payload.currency !== "USD" ||
    payload.label !== "estimate" ||
    typeof payload.llm_calls !== "number" ||
    typeof payload.tokens_in !== "number" ||
    typeof payload.tokens_out !== "number" ||
    typeof payload.estimated_usd !== "number"
  ) {
    return null;
  }
  return {
    version: 1,
    label: "estimate",
    currency: "USD",
    llm_calls: payload.llm_calls,
    tokens_in: payload.tokens_in,
    tokens_out: payload.tokens_out,
    estimated_usd: payload.estimated_usd,
    source,
    case_id: typeof payload.case_id === "string" ? payload.case_id : undefined,
  };
}

const fallbackTasks: Task[] = [
  { id: "MOL-004", title: "Dar vida aos pequenos detalhes", status: "todo", agent: "cursor", priority: "Normal" },
  { id: "MOL-005", title: "Um lugar para cada ideia", status: "todo", agent: "Codex", priority: "Alta" },
  { id: "MOL-002", title: "Uma mola com personalidade", status: "doing", agent: "Antigravity", priority: "Alta" },
  { id: "MOL-003", title: "Fazer o trabalho se mover", status: "doing", agent: "cursor", priority: "Normal" },
  { id: "MOL-001", title: "Encontrar nosso ponto de partida", status: "done", agent: "Codex", priority: "Normal" },
  { id: "MOL-006", title: "Escolher as cores da brincadeira", status: "done", agent: "Antigravity", priority: "Normal" },
];

export default function AdminPage() {
  const [tasks, setTasks] = useState<Task[]>(fallbackTasks);
  const [events, setEvents] = useState<Event[]>([]);
  const [source, setSource] = useState("Exemplo local");
  const [usage, setUsage] = useState<UsageSnapshot | null>(null);
  const [apiBase, setApiBase] = useState(DEFAULT_API_BASE);
  const [caseId, setCaseId] = useState("");
  const [usageStatus, setUsageStatus] = useState<"idle" | "loading" | "error">("idle");
  const [usageError, setUsageError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "null");
      if (saved?.version === 1 && Array.isArray(saved.tasks) && saved.tasks.length) {
        setTasks(saved.tasks.map((t: Task) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          agent: t.agent,
          priority: t.priority,
        })));
        if (Array.isArray(saved.events)) setEvents(saved.events.slice(0, 8));
        if (typeof saved.source === "string") setSource(saved.source.slice(0, 160));
      }
    } catch { /* demo admin still works offline */ }

    try {
      const prefs = JSON.parse(localStorage.getItem(USAGE_PREF_KEY) || "null");
      if (prefs && typeof prefs.apiBase === "string" && prefs.apiBase.trim()) {
        setApiBase(normalizeApiBase(prefs.apiBase));
      }
      if (prefs && typeof prefs.caseId === "string") {
        setCaseId(prefs.caseId.slice(0, 120));
      }
    } catch { /* prefs optional */ }

    setUsage(readUsageSnapshot());
  }, []);

  const metrics = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter(t => t.status === "done").length;
    const doing = tasks.filter(t => t.status === "doing").length;
    const todo = tasks.filter(t => t.status === "todo").length;
    const high = tasks.filter(t => t.priority === "Alta" && t.status !== "done").length;
    const byAgent = agents.map(agent => ({
      agent,
      total: tasks.filter(t => t.agent === agent).length,
      done: tasks.filter(t => t.agent === agent && t.status === "done").length,
      open: tasks.filter(t => t.agent === agent && t.status !== "done").length,
    }));
    const completion = total ? Math.round((done / total) * 100) : 0;
    return { total, done, doing, todo, high, byAgent, completion };
  }, [tasks]);

  async function loadUsageFromApi() {
    const base = normalizeApiBase(apiBase);
    const id = caseId.trim();
    if (!base || !id) {
      setUsageStatus("error");
      setUsageError("Informe a URL do backend e o case_id.");
      return;
    }
    if (!/^https?:\/\//i.test(base)) {
      setUsageStatus("error");
      setUsageError("URL do backend deve começar com http:// ou https://");
      return;
    }

    setUsageStatus("loading");
    setUsageError(null);
    localStorage.setItem(USAGE_PREF_KEY, JSON.stringify({ apiBase: base, caseId: id }));

    try {
      const res = await fetch(`${base}/api/cases/${encodeURIComponent(id)}/usage`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const payload = await res.json() as Record<string, unknown>;
      const snapshot = usageFromApiPayload(payload, `api:${base}`);
      if (!snapshot) {
        throw new Error("Resposta sem currency=USD / label=estimate");
      }
      persistUsage(snapshot);
      setUsage(snapshot);
      setUsageStatus("idle");
    } catch (err) {
      setUsageStatus("error");
      setUsageError(err instanceof Error ? err.message : "Falha ao carregar uso");
    }
  }

  function clearUsage() {
    localStorage.removeItem(USAGE_KEY);
    setUsage(null);
    setUsageError(null);
    setUsageStatus("idle");
  }

  return (
    <div className="workspace admin-page">
      <SiteHeader />
      <main className="admin-main">
        <section className="admin-hero">
          <div className="admin-hero-copy">
            <p className="eyebrow"><Radio size={13} /> VISÃO DA EMPRESA · DEMO</p>
            <h1>Métricas em movimento<span className="title-dot">.</span></h1>
            <p>
              Painel do quadro local, agora com custo LLM em USD quando o backend
              ResolveQA expõe <code>/api/cases/&lt;id&gt;/usage</code>. Sem inventar números.
            </p>
            <p className="admin-source"><span className="live-dot" /> {source}</p>
          </div>
          <div className="admin-hero-visual" aria-hidden="true">
            <img src="/landing/admin.jpg" alt="" />
          </div>
        </section>

        <section className="admin-kpis" aria-label="Indicadores">
          <article className="admin-kpi">
            <span className="admin-kpi-label"><Activity size={14} /> Em andamento</span>
            <strong>{metrics.doing.toString().padStart(2, "0")}</strong>
            <em>tarefas ativas</em>
          </article>
          <article className="admin-kpi">
            <span className="admin-kpi-label"><CheckCheck size={14} /> Conclusão</span>
            <strong>{metrics.completion}%</strong>
            <em>{metrics.done} de {metrics.total} feitas</em>
          </article>
          <article className="admin-kpi">
            <span className="admin-kpi-label"><Clock3 size={14} /> A fazer</span>
            <strong>{metrics.todo.toString().padStart(2, "0")}</strong>
            <em>na fila</em>
          </article>
          <article className="admin-kpi">
            <span className="admin-kpi-label"><Users size={14} /> Prioridade alta</span>
            <strong>{metrics.high.toString().padStart(2, "0")}</strong>
            <em>ainda abertas</em>
          </article>
          <article className="admin-kpi admin-kpi-cost">
            <span className="admin-kpi-label"><DollarSign size={14} /> Custo LLM</span>
            {usage ? (
              <>
                <strong>USD {usage.estimated_usd.toFixed(6)}</strong>
                <em>
                  estimate · {usage.llm_calls} calls · {usage.tokens_in}/{usage.tokens_out} tok
                </em>
              </>
            ) : (
              <>
                <strong>—</strong>
                <em>sem dados · carregue um case abaixo</em>
              </>
            )}
          </article>
        </section>

        <section className="admin-panel admin-cost" aria-label="Custo LLM por caso">
          <div className="admin-panel-head">
            <h2>Custo LLM por caso (USD)</h2>
            <span className="mono">ESTIMATE · NÃO É FATURA</span>
          </div>
          <p className="admin-cost-copy">
            Lê o endpoint real do backend. Se a API estiver offline, o KPI fica vazio —
            não fabricamos tokens nem dólares.
          </p>
          <div className="admin-cost-form">
            <label>
              Backend
              <input
                value={apiBase}
                onChange={(e) => setApiBase(e.target.value)}
                placeholder={DEFAULT_API_BASE}
                autoComplete="off"
              />
            </label>
            <label>
              case_id
              <input
                value={caseId}
                onChange={(e) => setCaseId(e.target.value)}
                placeholder="case-…"
                autoComplete="off"
              />
            </label>
            <div className="admin-cost-actions">
              <button type="button" className="admin-cost-btn" onClick={loadUsageFromApi} disabled={usageStatus === "loading"}>
                {usageStatus === "loading" ? "Carregando…" : "Carregar uso"}
              </button>
              <button type="button" className="admin-cost-btn ghost" onClick={clearUsage}>
                Limpar
              </button>
            </div>
          </div>
          {usageError ? <p className="admin-cost-error">{usageError}</p> : null}
          {usage ? (
            <dl className="admin-cost-stats">
              <div>
                <dt>Estimativa</dt>
                <dd>USD {usage.estimated_usd.toFixed(8)}</dd>
              </div>
              <div>
                <dt>Chamadas</dt>
                <dd>{usage.llm_calls}</dd>
              </div>
              <div>
                <dt>Tokens in / out</dt>
                <dd>{usage.tokens_in} / {usage.tokens_out}</dd>
              </div>
              <div>
                <dt>Fonte</dt>
                <dd>{usage.source || "localStorage"}{usage.case_id ? ` · ${usage.case_id}` : ""}</dd>
              </div>
            </dl>
          ) : (
            <p className="admin-empty">Nenhum custo carregado ainda.</p>
          )}
        </section>

        <section className="admin-grid">
          <div className="admin-panel">
            <div className="admin-panel-head">
              <h2>Fluxo do quadro</h2>
              <span className="mono">A FAZER · ANDAMENTO · CONCLUÍDO</span>
            </div>
            <div className="admin-bars" role="img" aria-label={`Todo ${metrics.todo}, doing ${metrics.doing}, done ${metrics.done}`}>
              {[
                { key: "todo", label: "A fazer", value: metrics.todo, tone: "todo" },
                { key: "doing", label: "Em andamento", value: metrics.doing, tone: "doing" },
                { key: "done", label: "Concluído", value: metrics.done, tone: "done" },
              ].map(row => (
                <div className="admin-bar-row" key={row.key}>
                  <span>{row.label}</span>
                  <div className="admin-bar-track">
                    <i className={`admin-bar-fill tone-${row.tone}`} style={{ width: `${metrics.total ? (row.value / metrics.total) * 100 : 0}%` }} />
                  </div>
                  <strong>{row.value}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-panel">
            <div className="admin-panel-head">
              <h2>Agentes ilustrativos</h2>
              <span className="mono">CARGA POR RESPONSÁVEL</span>
            </div>
            <ul className="admin-agents">
              {metrics.byAgent.map(row => (
                <li key={row.agent}>
                  <div>
                    <strong>{row.agent}</strong>
                    <span>{row.open} abertas · {row.done} feitas</span>
                  </div>
                  <div className="admin-agent-meter" aria-hidden="true">
                    <i style={{ width: `${row.total ? (row.done / row.total) * 100 : 0}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="admin-panel admin-activity">
          <div className="admin-panel-head">
            <h2>Atividade recente</h2>
            <Link className="text-link" href="/quadro">Ir ao quadro <ArrowRight size={14} /></Link>
          </div>
          {events.length ? (
            <div className="admin-log">
              {events.slice(0, 6).map((event, i) => (
                <div className="activity-row" key={event.id}>
                  <span className={`event-dot ${i === 0 ? "latest" : ""}`} />
                  <p>{event.text}</p>
                  <time dateTime={event.time}>{new Date(event.time).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</time>
                </div>
              ))}
            </div>
          ) : (
            <p className="admin-empty">Ainda sem eventos nesta sessão. Avance uma tarefa no quadro para popular este painel.</p>
          )}
        </section>
      </main>
      <footer className="site-footer">
        <Link className="brand" href="/"><span className="brand-symbol">▥</span>MOLA</Link>
        <span>Custo LLM só com dados reais da API · estimate em USD.</span>
        <span className="footer-credit">ADMIN LOCAL</span>
      </footer>
    </div>
  );
}
