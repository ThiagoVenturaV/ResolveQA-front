"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Activity, ArrowRight, CheckCheck, Clock3, Radio, Users } from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";

type Status = "todo" | "doing" | "done";
type Agent = "Codex" | "cursor" | "Antigravity";
type Task = { id: string; title: string; status: Status; agent: Agent; priority: "Alta" | "Normal" };
type Event = { id: string; text: string; time: string };

const KEY = "mola.workspace.v1";
const agents: Agent[] = ["Codex", "cursor", "Antigravity"];

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

  return (
    <div className="workspace admin-page">
      <SiteHeader />
      <main className="admin-main">
        <section className="admin-hero">
          <div className="admin-hero-copy">
            <p className="eyebrow"><Radio size={13} /> VISÃO DA EMPRESA · DEMO</p>
            <h1>Métricas em movimento<span className="title-dot">.</span></h1>
            <p>
              Painel ilustrativo alimentado pelo mesmo playground local do quadro.
              Não há conexão com agentes externos nem status inventado de backend.
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
        <span>Métricas de demonstração · sem backend inventado.</span>
        <span className="footer-credit">ADMIN LOCAL</span>
      </footer>
    </div>
  );
}
