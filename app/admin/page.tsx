"use client";
import { useCallback, useMemo, useState, type FormEvent } from "react";
import {
  Activity,
  ArrowDownToLine,
  ArrowRight,
  BookOpen,
  Bot,
  Check,
  Clock3,
  FileText,
  GitBranch,
  Pause,
  Play,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { WorkspaceShell, adminViews } from "@/components/workspace/shell";
import {
  CaseDetail,
  Clock,
  Empty,
  EventRows,
  LatencyChart,
  SearchBox,
  Status,
  TraceWaterfall,
} from "@/components/workspace/ui";
import { ConnectionForm, NewCaseForm } from "@/components/workspace/forms";
import { useRuntime } from "@/components/workspace/runtime";
import {
  agentOf,
  duration,
  elapsed,
  laneOf,
  percentile,
  playbookSchema,
  terminal,
  type Playbook,
  type Run,
} from "@/lib/resolveqa/domain";

export default function AdminPage() {
  const r = useRuntime();
  const [now, setNow] = useState(() => Date.now());
  const [view, setView] = useState("overview");
  const [query, setQuery] = useState("");
  const [state, setState] = useState("all");
  const [source, setSource] = useState("all");
  const [period, setPeriod] = useState("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [traceCase, setTraceCase] = useState("");
  const closeDetails = useCallback(() => setSelected(null), []);
  const filtered = useMemo(
    () =>
      r.snapshot.cases.filter(
        (c) =>
          `${c.case_id} ${c.report_text} ${c.repo_ref} ${c.client_id}`
            .toLowerCase()
            .includes(query.toLowerCase()) &&
          (state === "all" || laneOf(c.state) === state) &&
          (period === "all" ||
            Date.parse(c.updated_at) >= now - Number(period) * 86400000),
      ),
    [r.snapshot.cases, query, state, period, now],
  );
  const ids = new Set(filtered.map((c) => c.case_id));
  const events = r.snapshot.events.filter(
    (e) => ids.has(e.case_id) && (source === "all" || e.source === source),
  );
  const finished = filtered.filter((c) => terminal(c.state));
  const verified = filtered.filter((c) => c.state === "verified");
  const attention = filtered.filter((c) => laneOf(c.state) === "attention");
  const active = filtered.filter((c) => !terminal(c.state));
  const detail = r.snapshot.cases.find((c) => c.case_id === selected);
  const traceIds = [
    ...new Set(
      r.snapshot.spans.filter((s) => ids.has(s.case_id)).map((s) => s.case_id),
    ),
  ];
  const chosenTrace = traceIds.includes(traceCase) ? traceCase : traceIds[0];
  const spans = r.snapshot.spans.filter((s) => s.case_id === chosenTrace);
  const navigate = (v: string) => {
    setView(v);
    setQuery("");
    setState("all");
    setSelected(null);
  };
  const runTable = (rows: Run[]) =>
    rows.length ? (
      <div className="table-scroll">
        <table className="run-table">
          <thead>
            <tr>
              <th>Caso / relato</th>
              <th>Etapa</th>
              <th>Última atualização</th>
              <th>Estado</th>
              <th>
                <span className="sr-only">Detalhes</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.case_id}>
                <td>
                  <button
                    className="run-title"
                    onClick={() => setSelected(c.case_id)}
                  >
                    <code>{c.case_id}</code>
                    <span>{c.report_text}</span>
                  </button>
                  <small>{c.repo_ref}</small>
                </td>
                <td>
                  <span className="agent-label">
                    <Bot size={14} />
                    {agentOf(c.state)}
                  </span>
                </td>
                <td>
                  <Clock value={c.updated_at} date />
                </td>
                <td>
                  <Status run={c} />
                </td>
                <td>
                  <button
                    className="rq-icon-button"
                    onClick={() => setSelected(c.case_id)}
                    aria-label={`Detalhes de ${c.case_id}`}
                  >
                    <ArrowRight size={17} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <Empty title="Nenhuma execução encontrada">
        Ajuste os filtros ou crie um relato. Em produção, configure a conexão e
        os IDs dos casos.
      </Empty>
    );
  function exportLogs() {
    const url = URL.createObjectURL(
      new Blob(
        [
          JSON.stringify(
            { mode: r.mode, exported_at: new Date().toISOString(), events },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `resolveqa-${r.mode}-eventos.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <WorkspaceShell view={view} onView={navigate}>
      <main className="admin-content">
        <div className="page-heading">
          <div>
            <h1>{adminViews.find((v) => v.id === view)?.label}</h1>
            <p>
              {
                (
                  {
                    overview: "O que está acontecendo. E o contexto para agir.",
                    runs: "Do relato à verificação, cada execução tem uma história.",
                    logs: "Eventos estruturados, com origem e evidências.",
                    traces: "Veja onde cada etapa consome tempo.",
                    agents: "O trabalho distribuído pelas etapas do pipeline.",
                    playbooks:
                      "Os procedimentos da sua empresa, no contexto dos agentes.",
                    documents: "O conhecimento que acompanha cada correção.",
                    connection: "Escolha de onde o workspace recebe os dados.",
                  } as Record<string, string>
                )[view]
              }
            </p>
          </div>
          <div className="heading-actions">
            {r.mode === "demo" && (
              <button
                className="rq-button small"
                onClick={() => r.setPlaying(!r.playing)}
              >
                {r.playing ? <Pause size={14} /> : <Play size={14} />}
                {r.playing ? "Pausar demo" : "Executar demo"}
              </button>
            )}
            {["overview", "runs"].includes(view) && (
              <button
                className="rq-button primary small"
                onClick={() => setAdding(true)}
              >
                <Plus size={15} />
                Novo relato
              </button>
            )}
          </div>
        </div>
        {r.mode === "production" &&
          !r.config.baseUrl &&
          view !== "connection" && (
            <div className="rq-alert">
              Conecte seu backend para receber dados reais.{" "}
              <button
                className="inline-action"
                onClick={() => navigate("connection")}
              >
                Configurar conexão <ArrowRight size={14} />
              </button>
            </div>
          )}
        {["overview", "runs", "logs", "traces", "agents"].includes(view) && (
          <div className="admin-filters">
            <SearchBox value={query} onChange={setQuery} />
            <label className="filter-control">
              <Clock3 size={14} />
              <span className="sr-only">Período</span>
              <select
                value={period}
                onChange={(e) => {
                  setNow(Date.now());
                  setPeriod(e.target.value);
                }}
              >
                <option value="all">Todo o período</option>
                <option value="1">Últimas 24 horas</option>
                <option value="7">Últimos 7 dias</option>
              </select>
            </label>
            <label className="filter-control">
              <span className="sr-only">Estado</span>
              <select value={state} onChange={(e) => setState(e.target.value)}>
                <option value="all">Todos os estados</option>
                <option value="intake">Entrada</option>
                <option value="active">Em execução</option>
                <option value="review">Verificação</option>
                <option value="done">Concluído</option>
                <option value="attention">Atenção</option>
              </select>
            </label>
          </div>
        )}
        {view === "overview" && (
          <>
            <section
              className="metric-strip"
              aria-label="Indicadores das execuções"
            >
              <div>
                <span>
                  <Activity size={15} />
                  Em execução
                </span>
                <strong>{active.length}</strong>
                <small>{filtered.length} casos no período</small>
              </div>
              <div>
                <span>
                  <Check size={15} />
                  Verificadas
                </span>
                <strong>{verified.length}</strong>
                <small>
                  {finished.length
                    ? `${Math.round((verified.length / finished.length) * 100)}% dos casos terminais`
                    : "Aguardando resultados"}
                </small>
              </div>
              <div>
                <span>
                  <Pause size={15} />
                  Precisam de atenção
                </span>
                <strong>{attention.length}</strong>
                <small>Bloqueios, falhas ou informação</small>
              </div>
              <div>
                <span>
                  <Clock3 size={15} />
                  Duração p95
                </span>
                <strong className="metric-duration">
                  {finished.length
                    ? elapsed(percentile(finished.map(duration), 0.95))
                    : "—"}
                </strong>
                <small>{finished.length} amostras · casos terminais</small>
              </div>
            </section>
            <div className="overview-grid">
              <section className="data-panel">
                <div className="panel-heading">
                  <h2>Duração das execuções</h2>
                  <span className="muted">Criação → estado terminal</span>
                </div>
                <LatencyChart runs={finished} />
              </section>
              <section className="data-panel pipeline-panel">
                <div className="panel-heading">
                  <h2>Fluxo dos agentes</h2>
                  <Bot size={17} />
                </div>
                {["Triage", "Reproducer", "Fixer", "Verifier"].map((agent) => {
                  const n = active.filter(
                    (c) => agentOf(c.state) === agent,
                  ).length;
                  return (
                    <div className="agent-pipeline-row" key={agent}>
                      <span>
                        <Bot size={14} />
                        {agent}
                      </span>
                      <div>
                        <i
                          style={{
                            width: `${(n / Math.max(1, active.length)) * 100}%`,
                          }}
                        />
                      </div>
                      <strong>{n}</strong>
                    </div>
                  );
                })}
                <p className="panel-footnote">
                  Casos não terminais por etapa. Não representa heartbeat dos
                  agentes.
                </p>
              </section>
            </div>
            <section className="data-panel runs-panel">
              <div className="panel-heading">
                <h2>Execuções recentes</h2>
                <button
                  className="rq-text-link"
                  onClick={() => navigate("runs")}
                >
                  Ver todas
                  <ArrowRight size={15} />
                </button>
              </div>
              {runTable(
                [...filtered]
                  .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
                  .slice(0, 5),
              )}
            </section>
            <div className="overview-grid bottom-grid">
              <section className="data-panel">
                <div className="panel-heading">
                  <h2>Eventos recentes</h2>
                  <button
                    className="rq-text-link"
                    onClick={() => navigate("logs")}
                  >
                    Abrir logs
                    <ArrowRight size={15} />
                  </button>
                </div>
                {events.length ? (
                  <EventRows events={events} limit={4} />
                ) : (
                  <Empty title="Nenhum evento recebido">
                    O stream ou snapshot configurado fornece a trilha de
                    eventos.
                  </Empty>
                )}
              </section>
              <section className="data-panel">
                <div className="panel-heading">
                  <h2>Conhecimento da empresa</h2>
                  <BookOpen size={17} />
                </div>
                <button
                  className="knowledge-row"
                  onClick={() => navigate("playbooks")}
                >
                  <BookOpen size={21} />
                  <span>
                    <strong>{r.playbooks.length} playbooks cadastrados</strong>
                    <small>Procedimentos por empresa e repositório</small>
                  </span>
                  <ArrowRight size={17} />
                </button>
                <button
                  className="knowledge-row"
                  onClick={() => navigate("documents")}
                >
                  <FileText size={21} />
                  <span>
                    <strong>
                      {r.snapshot.documents.length} referências de documentação
                    </strong>
                    <small>Alterações registradas pelos agentes</small>
                  </span>
                  <ArrowRight size={17} />
                </button>
              </section>
            </div>
          </>
        )}
        {view === "runs" && (
          <section className="data-panel">{runTable(filtered)}</section>
        )}
        {view === "logs" && (
          <section className="data-panel">
            <div className="panel-heading">
              <h2>
                Trilha de eventos{" "}
                <span className="count-badge">{events.length}</span>
              </h2>
              <div className="heading-actions">
                <label className="filter-control">
                  <span className="sr-only">Origem do evento</span>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                  >
                    <option value="all">Todas as origens</option>
                    {[
                      "intake",
                      "orchestrator",
                      "triage",
                      "reproduction",
                      "fix",
                      "verification",
                      "delivery",
                      "reply",
                    ].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
                <button
                  className="rq-button small"
                  disabled={!events.length}
                  onClick={exportLogs}
                >
                  <ArrowDownToLine size={14} />
                  Exportar JSON
                </button>
              </div>
            </div>
            {events.length ? (
              <div className="table-scroll">
                <table className="log-table">
                  <thead>
                    <tr>
                      <th>Horário / seq.</th>
                      <th>Caso</th>
                      <th>Origem / tipo</th>
                      <th>Evento</th>
                      <th>Evidências</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((e) => (
                      <tr key={e.event_id}>
                        <td>
                          <Clock value={e.ts} date />
                          <small>seq. {e.seq}</small>
                        </td>
                        <td>
                          <button
                            className="inline-action"
                            onClick={() => setSelected(e.case_id)}
                          >
                            <code>{e.case_id}</code>
                          </button>
                        </td>
                        <td>
                          <code>{e.source}</code>
                          <small>{e.type}</small>
                        </td>
                        <td>
                          {e.reason || e.type}
                          {e.to_state && (
                            <small>
                              {e.from_state} → {e.to_state}
                            </small>
                          )}
                          {e.replay_of && (
                            <small>
                              Replay · origem {e.replay_of.original_ts}
                            </small>
                          )}
                        </td>
                        <td>
                          <code>{e.evidence_refs.join(", ") || "—"}</code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty title="Sem logs neste filtro">
                Eventos do backend aparecem aqui com a origem e o horário
                recebidos.
              </Empty>
            )}
          </section>
        )}
        {view === "traces" && (
          <section className="data-panel">
            <div className="panel-heading">
              <h2>Trace da execução</h2>
              {traceIds.length > 0 && (
                <label className="filter-control">
                  <span className="sr-only">Caso do trace</span>
                  <select
                    value={chosenTrace}
                    onChange={(e) => setTraceCase(e.target.value)}
                  >
                    {traceIds.map((id) => (
                      <option key={id}>{id}</option>
                    ))}
                  </select>
                </label>
              )}
            </div>
            {spans.length ? (
              <>
                <p className="muted">
                  {chosenTrace} · {spans.length} spans ·{" "}
                  {r.mode === "demo"
                    ? "tempos ilustrativos"
                    : "spans recebidos do backend"}
                </p>
                <TraceWaterfall spans={spans} />
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Span</th>
                        <th>Início</th>
                        <th>Duração</th>
                        <th>Resultado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {spans.map((s) => (
                        <tr key={s.id}>
                          <td>
                            {s.name}
                            <small>
                              <code>{s.id}</code>
                            </small>
                          </td>
                          <td>{elapsed(s.start_ms)}</td>
                          <td>{elapsed(s.duration_ms)}</td>
                          <td>{s.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <Empty
                title="Nenhum span recebido"
                icon={<GitBranch size={28} />}
              >
                Configure um snapshot com spans para investigar a duração de
                cada etapa. Eventos de estado não são spans.
              </Empty>
            )}
          </section>
        )}
        {view === "agents" && (
          <section className="data-panel">
            <div className="panel-heading">
              <h2>Distribuição por etapa</h2>
              <span className="sample-label">Estado dos casos</span>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Agente / etapa</th>
                    <th>Responsabilidade</th>
                    <th>Casos na etapa</th>
                    <th>Em atividade</th>
                  </tr>
                </thead>
                <tbody>
                  {["Triage", "Reproducer", "Fixer", "Verifier"].map((a, i) => (
                    <tr key={a}>
                      <td>
                        <span className="agent-label">
                          <Bot size={18} />
                          {a}
                        </span>
                      </td>
                      <td>
                        {
                          [
                            "Classificar relatos e coletar contexto",
                            "Criar teste que reproduz o defeito",
                            "Propor correção mínima",
                            "Verificar RED, GREEN e a suíte",
                          ][i]
                        }
                      </td>
                      <td>
                        {filtered.filter((c) => agentOf(c.state) === a).length}
                      </td>
                      <td>
                        {active.filter((c) => agentOf(c.state) === a).length}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="panel-footnote">
              A presença online dos agentes depende de telemetria de heartbeat,
              ainda não fornecida pelo backend base.
            </p>
          </section>
        )}
        {view === "playbooks" && <Playbooks />}
        {view === "documents" && (
          <section className="data-panel">
            <div className="panel-heading">
              <h2>Documentação atualizada</h2>
              <FileText size={18} />
            </div>
            <p className="muted">
              Referências enviadas pelos agentes. A atualização dos arquivos
              acontece no repositório, pelo backend.
            </p>
            {r.snapshot.documents.length ? (
              r.snapshot.documents.map((d) => (
                <article className="document-entry" key={d.id}>
                  <FileText size={22} />
                  <div>
                    <h3>{d.title}</h3>
                    <code>{d.path}</code>
                    <p>{d.summary}</p>
                    <span>
                      <button
                        className="inline-action"
                        onClick={() => setSelected(d.case_id)}
                      >
                        {d.case_id}
                      </button>{" "}
                      · <Clock value={d.updated_at} date />
                    </span>
                  </div>
                </article>
              ))
            ) : (
              <Empty title="Nenhuma referência de documentação">
                O snapshot de produção pode enviar os documentos alterados e o
                caso que originou a atualização.
              </Empty>
            )}
          </section>
        )}
        {view === "connection" && <ConnectionForm />}
        <footer className="app-footnote">
          <span>
            <span className="live-dot" />
            {r.mode === "demo" ? "Dados de demonstração" : r.connection}
          </span>
          <span>Horários em Fortaleza (UTC−3) · Merge com revisão humana</span>
        </footer>
      </main>
      {detail && (
        <CaseDetail run={detail} snapshot={r.snapshot} onClose={closeDetails} />
      )}
      {adding && <NewCaseForm onClose={() => setAdding(false)} />}
    </WorkspaceShell>
  );
}
function Playbooks() {
  const r = useRuntime();
  const [editing, setEditing] = useState<Playbook | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const writable = r.mode === "demo" || !!r.config.playbooksPath;
  const start = () => {
    setError("");
    setEditing({
      id: crypto.randomUUID(),
      name: "",
      company: "",
      repository: "",
      instructions: "",
      enabled: true,
      updated_at: new Date().toISOString(),
    });
  };
  async function save(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    setError("");
    try {
      const parsed = playbookSchema.parse({
        ...editing,
        name: editing.name.trim(),
        company: editing.company.trim(),
        repository: editing.repository.trim(),
        instructions: editing.instructions.trim(),
        updated_at: new Date().toISOString(),
      });
      await r.savePlaybook(parsed);
      setEditing(null);
      setMessage(
        r.mode === "demo"
          ? "Playbook salvo na demonstração local."
          : "Playbook confirmado pela API.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setBusy(false);
    }
  }
  async function remove(id: string) {
    setBusy(true);
    try {
      await r.removePlaybook(id);
      setDeleting(null);
      setMessage("Playbook excluído.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Não foi possível excluir.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="section-actions">
        <SearchBox
          value={query}
          onChange={setQuery}
          placeholder="Buscar playbook ou empresa…"
        />
        <button
          className="rq-button primary"
          disabled={!writable}
          onClick={start}
        >
          <Plus size={16} />
          Novo playbook
        </button>
      </div>
      {!writable && (
        <p className="rq-alert">
          A API de playbooks não está configurada. Configure o serviço em
          Conexão para cadastrar em produção.
        </p>
      )}
      {message && (
        <p className="form-success" role="status">
          <Check size={16} />
          {message}
        </p>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className={`playbook-layout ${editing ? "has-editor" : ""}`}>
        <section className="data-panel">
          <div className="panel-heading">
            <h2>Procedimentos da empresa</h2>
            <span className="count-badge">{r.playbooks.length}</span>
          </div>
          {r.playbooks
            .filter((p) =>
              `${p.name} ${p.company} ${p.repository}`
                .toLowerCase()
                .includes(query.toLowerCase()),
            )
            .map((p) => (
              <article className="playbook-entry" key={p.id}>
                <BookOpen size={22} />
                <div>
                  <h3>{p.name}</h3>
                  <p>
                    {p.company} · <code>{p.repository}</code>
                  </p>
                  <small>
                    {p.enabled ? "Ativo" : "Pausado"} ·{" "}
                    <Clock value={p.updated_at} date />
                  </small>
                  <p className="playbook-excerpt">{p.instructions}</p>
                  <div className="heading-actions">
                    <button
                      className="rq-button small"
                      disabled={!writable}
                      onClick={() => {
                        setEditing(p);
                        setError("");
                      }}
                    >
                      Editar playbook
                    </button>
                    {deleting === p.id ? (
                      <>
                        <span>Excluir este playbook?</span>
                        <button
                          className="rq-button danger small"
                          disabled={busy}
                          onClick={() => remove(p.id)}
                        >
                          Confirmar exclusão
                        </button>
                        <button
                          className="rq-button small"
                          onClick={() => setDeleting(null)}
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <button
                        className="rq-icon-button"
                        disabled={!writable}
                        aria-label={`Excluir ${p.name}`}
                        onClick={() => setDeleting(p.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          {!r.playbooks.length && (
            <Empty
              title="Seu primeiro playbook começa aqui"
              icon={<BookOpen size={28} />}
            >
              Cadastre o contexto e os procedimentos que os agentes devem seguir
              em cada repositório.
            </Empty>
          )}
        </section>
        {editing && (
          <form className="rq-form playbook-editor" onSubmit={save}>
            <div className="panel-heading">
              <h2>
                {r.playbooks.some((p) => p.id === editing.id)
                  ? "Editar playbook"
                  : "Novo playbook"}
              </h2>
              <button
                type="button"
                className="rq-icon-button"
                onClick={() => setEditing(null)}
                aria-label="Fechar editor"
              >
                <X size={19} />
              </button>
            </div>
            {(
              [
                ["name", "Nome"],
                ["company", "Empresa"],
                ["repository", "Repositório"],
              ] as const
            ).map(([key, label]) => (
              <label key={key}>
                {label}
                <input
                  required
                  maxLength={key === "name" ? 120 : 240}
                  value={editing[key]}
                  onChange={(e) =>
                    setEditing({ ...editing, [key]: e.target.value })
                  }
                />
              </label>
            ))}
            <label>
              Instruções
              <textarea
                required
                rows={10}
                maxLength={20000}
                value={editing.instructions}
                onChange={(e) =>
                  setEditing({ ...editing, instructions: e.target.value })
                }
                placeholder="Inclua como reproduzir, verificar e atualizar a documentação…"
              />
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={editing.enabled}
                onChange={(e) =>
                  setEditing({ ...editing, enabled: e.target.checked })
                }
              />
              Playbook ativo
            </label>
            <button className="rq-button primary" disabled={busy || !writable}>
              <Save size={16} />
              {busy ? "Salvando…" : "Salvar playbook"}
            </button>
          </form>
        )}
      </div>
    </>
  );
}
