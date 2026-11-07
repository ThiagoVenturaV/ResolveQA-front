"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ArrowDown, ArrowDownToLine, ArrowRight, ArrowUpRight, Check, CheckCheck, Circle, Columns3, ExternalLink, CodeXml, Layers, MoreHorizontal, Pause, Play, Plus, Radio, Sparkles, Terminal, Upload, X } from "lucide-react";
import { HeroStage, skins, Spring, TransportLayer, prefersReducedMotion, runTransport, type TransportHandle } from "@/components/mola";

type Status = "todo" | "doing" | "done";
type Agent = "Codex" | "cursor" | "Antigravity";
type Task = { id: string; title: string; description: string; status: Status; agent: Agent; tag: string; priority: "Alta" | "Normal"; };
type Event = { id: string; text: string; time: string };
const columns: { id: Status; label: string; note: string }[] = [{ id: "todo", label: "A fazer", note: "Uma ideia esperando o primeiro salto." }, { id: "doing", label: "Em andamento", note: "Um pouquinho mais perto de acontecer." }, { id: "done", label: "Concluído", note: "Pequenas vitórias. Grandes pulos." }];
const agents: Agent[] = ["Codex", "cursor", "Antigravity"];
const initialTasks: Task[] = [
  { id: "MOL-004", title: "Dar vida aos pequenos detalhes", description: "Explorar microinterações e estados de foco para tornar cada clique uma pequena descoberta.", status: "todo", agent: "cursor", tag: "INTERAÇÃO", priority: "Normal" },
  { id: "MOL-005", title: "Um lugar para cada ideia", description: "Organizar a experiência do quadro para que o próximo passo esteja sempre claro.", status: "todo", agent: "Codex", tag: "EXPERIÊNCIA", priority: "Alta" },
  { id: "MOL-002", title: "Uma mola com personalidade", description: "Desenhar um personagem em pixel art com espiras, expressão e seis possibilidades de cor.", status: "doing", agent: "Antigravity", tag: "PIXEL ART", priority: "Alta" },
  { id: "MOL-003", title: "Fazer o trabalho se mover", description: "Levar os cards de uma coluna à outra em companhia de uma mola que nunca perde o ritmo.", status: "doing", agent: "cursor", tag: "FRONTEND", priority: "Normal" },
  { id: "MOL-001", title: "Encontrar nosso ponto de partida", description: "Reunir as referências, definir a direção visual e criar espaço para experimentar.", status: "done", agent: "Codex", tag: "DIREÇÃO", priority: "Normal" },
  { id: "MOL-006", title: "Escolher as cores da brincadeira", description: "Uma paleta de papel, verde lima e pequenos acentos para uma experiência acolhedora.", status: "done", agent: "Antigravity", tag: "IDENTIDADE", priority: "Normal" },
];
const KEY = "mola.workspace.v1";
function validTasks(value: unknown): value is Task[] {
  return Array.isArray(value) && value.length <= 100 && new Set(value.map(t => t?.id)).size === value.length && value.every(t => t && typeof t.id === "string" && t.id.length > 0 && t.id.length < 100 && typeof t.title === "string" && t.title.trim().length > 0 && t.title.length < 160 && typeof t.description === "string" && t.description.length < 4000 && ["todo", "doing", "done"].includes(t.status) && agents.includes(t.agent) && typeof t.tag === "string" && t.tag.length < 50 && ["Alta", "Normal"].includes(t.priority));
}
function AgentAvatar({ agent }: { agent: Agent }) { return <span className={`agent-avatar avatar-${agent.toLowerCase()}`} aria-hidden="true">{agent === "Codex" ? <Terminal size={11} /> : agent === "cursor" ? <ArrowUpRight size={12} /> : <Sparkles size={11} />}</span>; }
function Modal({ children, title, onClose, wide = false }: { children: ReactNode; title: string; onClose: () => void; wide?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { const el = dialog.current; el?.showModal(); return () => el?.close(); }, []);
  return <dialog aria-label={title} className={`modal ${wide ? "modal-wide" : ""}`} ref={dialog} onCancel={onClose} onClick={e => { if (e.target === e.currentTarget) onClose(); }}><div className="modal-head"><h2>{title}</h2><button className="icon-button" aria-label="Fechar janela" onClick={onClose}><X size={20} /></button></div>{children}</dialog>;
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [events, setEvents] = useState<Event[]>([]);
  const [skin, setSkin] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState("Todos os agentes");
  const [autoplay, setAutoplay] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Task | null>(null);
  const [adding, setAdding] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [source, setSource] = useState("Exemplo local");
  const [notice, setNotice] = useState("");
  const [activeNav, setActiveNav] = useState("quadro");
  const lock = useRef(false);
  const tasksRef = useRef(tasks);
  const skinRef = useRef(skin);
  const stopTransport = useRef<(() => void) | null>(null);
  const transportRef = useRef<TransportHandle>(null);
  const upload = useRef<HTMLInputElement>(null);
  tasksRef.current = tasks;
  skinRef.current = skin;

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "null");
      if (saved?.version === 1 && validTasks(saved.tasks)) {
        setTasks(saved.tasks); if (Number.isInteger(saved.skin) && saved.skin >= 0 && saved.skin < skins.length) setSkin(saved.skin);
        if (Array.isArray(saved.events)) setEvents(saved.events.filter((e: Event) => typeof e?.text === "string" && typeof e?.time === "string" && typeof e?.id === "string").slice(0, 40));
        if (typeof saved.source === "string") setSource(saved.source.slice(0, 160));
      }
    } catch { /* A fresh workspace also works when browser storage is unavailable. */ }
    setLoaded(true);
    return () => { stopTransport.current?.(); };
  }, []);
  useEffect(() => { if (loaded) { try { localStorage.setItem(KEY, JSON.stringify({ version: 1, tasks, events, skin, source })); } catch { /* Private browser/storage quota can disable persistence. */ } } }, [tasks, events, skin, source, loaded]);
  useEffect(() => { if (notice) { const t = setTimeout(() => setNotice(""), 6000); return () => clearTimeout(t); } }, [notice]);
  const log = useCallback((text: string) => setEvents(old => [{ id: crypto.randomUUID(), text, time: new Date().toISOString() }, ...old].slice(0, 40)), []);

  const move = useCallback((id?: string, target?: Status) => {
    if (lock.current) return;
    const visible = tasksRef.current.filter(t => filter === "Todos os agentes" || t.agent === filter);
    const task = id ? tasksRef.current.find(t => t.id === id) : visible.find(t => t.status === "doing") || visible.find(t => t.status === "todo");
    if (!task) { setAutoplay(false); setNotice("Tudo em dia! Adicione uma tarefa para a próxima aventura."); return; }
    const next: Status = target || (task.status === "todo" ? "doing" : "done");
    if (next === task.status) return;

    const cardSel = `[data-task-id="${CSS.escape(task.id)}"]`;
    const colSel = `[data-column="${next}"]`;
    const prepareViewport = () => {
      const card = document.querySelector<HTMLElement>(cardSel);
      const col = document.querySelector<HTMLElement>(colSel);
      const probe = card?.getBoundingClientRect();
      if (card && probe && (probe.left < 0 || probe.right > window.innerWidth || probe.top < 20 || probe.top > window.innerHeight - 170)) {
        card.scrollIntoView({ behavior: "instant", block: "center", inline: "center" });
      }
      const lane = col?.parentElement;
      if (col && lane && lane.scrollWidth > lane.clientWidth + 5) {
        const laneRect = lane.getBoundingClientRect();
        const colRect = col.getBoundingClientRect();
        lane.scrollTo({ left: lane.scrollLeft + colRect.left - laneRect.left - 20, behavior: "instant" });
      }
      const dest = col?.getBoundingClientRect();
      if (dest && (dest.top < 20 || dest.top > window.innerHeight - 250)) {
        window.scrollBy({ top: dest.top - 100, behavior: "instant" });
      }
    };

    const readFrom = () => {
      const card = document.querySelector<HTMLElement>(cardSel);
      if (!card) return null;
      const r = card.getBoundingClientRect();
      if (r.width < 1 && r.height < 1) return null;
      return { x: r.left + r.width / 2, y: r.top + 26 };
    };
    const readTo = () => {
      const col = document.querySelector<HTMLElement>(colSel);
      if (!col) return null;
      const r = col.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + 76 };
    };

    // Prepare viewport first, then measure origin/destination (never use pre-scroll rects).
    prepareViewport();
    const a = readFrom();
    const b = readTo();

    lock.current = true;
    setBusyId(task.id);
    let delivered = false;
    // Frozen origin after pickup — source card fades; DOM from becomes unreliable mid-flight.
    let frozenFrom = a;

    const deliver = () => {
      if (delivered) return;
      delivered = true;
      setTasks(old => [{ ...task, status: next }, ...old.filter(t => t.id !== task.id)]);
      log(`${task.agent} moveu “${task.title}” para ${columns.find(c => c.id === next)?.label}.`);
    };

    const finish = () => {
      deliver();
      transportRef.current?.hide();
      setBusyId(null);
      lock.current = false;
      stopTransport.current = null;
    };

    if (prefersReducedMotion() || !a || !b) {
      finish();
      return;
    }

    transportRef.current?.show({ id: task.id, title: task.title }, skinRef.current);
    transportRef.current?.paint({ phase: "compress", x: a.x, y: a.y, clipFrame: 0 });

    stopTransport.current?.();
    stopTransport.current = runTransport({
      getFrom: () => {
        // Prefer live source while still in origin column; else frozen pickup point.
        const live = !delivered ? readFrom() : null;
        if (live) frozenFrom = live;
        return frozenFrom;
      },
      getTo: () => readTo(),
      onFrame: snap => {
        transportRef.current?.paint({
          phase: snap.phase,
          x: snap.x,
          y: snap.y,
          clipFrame: snap.clipFrame,
        });
        // Commit only after delivery completes — celebrate is post-drop.
        if (snap.phase === "celebrate") deliver();
      },
      onComplete: () => finish(), // finish() also calls deliver() with guard if aborted mid-flight
    });
  }, [filter, log]);

  useEffect(() => { if (!autoplay || busyId) return; const t = setTimeout(() => move(), 4200); return () => clearTimeout(t); }, [autoplay, busyId, move, tasks]);

  function addTask(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (tasksRef.current.length >= 100) { setAdding(false); setNotice("Seu quadro chegou ao limite de 100 tarefas. Exporte o snapshot para guardar suas ideias."); return; } const data = new FormData(e.currentTarget); const title = String(data.get("title") || "").trim(); if (!title) return;
    const task: Task = { id: `MOL-${crypto.randomUUID()}`, title, description: String(data.get("description") || ""), agent: data.get("agent") as Agent, status: "todo", tag: "NOVA IDEIA", priority: "Normal" };
    setTasks(old => [...old, task]); log(`Nova tarefa criada: “${title}”.`); setAdding(false); setNotice("Ideia no quadro. Agora é colocar em movimento.");
  }
  async function importSnapshot(file?: File) {
    if (!file) return;
    if (lock.current) { setNotice("Aguarde a mola terminar o movimento antes de importar."); return; }
    try {
      if (file.size > 2 * 1024 * 1024) throw new Error("Arquivo muito grande. Limite: 2 MB.");
      const json = JSON.parse(await file.text());
      if (lock.current) throw new Error("Aguarde a mola terminar o movimento antes de importar.");
      if (!validTasks(json.tasks)) throw new Error("Snapshot inválido. Use o formato do arquivo exportado.");
      setAutoplay(false); setTasks(json.tasks); setSource(`Snapshot: ${file.name}`); log(`Snapshot importado: ${file.name} (${json.tasks.length} tarefas).`); setNotice("Snapshot importado. Os dados continuam locais neste navegador.");
    } catch (e) { setNotice(e instanceof Error ? e.message : "Não foi possível ler esse arquivo."); }
    if (upload.current) upload.current.value = "";
  }
  function exportSnapshot() {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ version: 1, tasks }, null, 2)], { type: "application/json" })); const a = document.createElement("a"); a.href = url; a.download = "mola-snapshot.json"; a.click(); URL.revokeObjectURL(url); setNotice("Snapshot exportado com as tarefas do seu quadro.");
  }
  const completed = tasks.filter(t => t.status === "done").length;
  const moving = !!busyId;

  return <div className="workspace">
    <header className="site-header"><a className="brand" href="#" aria-label="Mola, início"><span className="brand-symbol">▥</span>MOLA<span className="brand-sub">agent workspace</span></a><nav aria-label="Navegação principal">{[{ id: "quadro", label: "Quadro" }, { id: "pranchas", label: "Pranchas" }, { id: "atividade", label: "Atividade" }].map(n => <a key={n.id} className={activeNav === n.id ? "active" : ""} onClick={() => setActiveNav(n.id)} href={`#${n.id}`}>{n.label}</a>)}</nav><div className="header-end"><span className="demo-badge"><span />Modo demonstração</span><a className="github-link" href="https://github.com/ThiagoVenturaV/ResolveQA-front" target="_blank" rel="noreferrer" aria-label="Abrir ResolveQA no GitHub"><CodeXml size={19} /></a></div></header>
    <main>
      <section className="hero"><div className="hero-copy"><div className="eyebrow"><span className="small-star">✳</span> MENOS STATUS. MAIS MOVIMENTO.</div><h1>Trabalho em<br /><span>movimento.</span><svg viewBox="0 0 350 15" aria-hidden="true"><path d="M2 10 Q115 -2 345 7" fill="none" stroke="currentColor" strokeWidth="5" /></svg></h1><p>Ideias ganham forma. Agentes entram em ação.<br className="desktop-break" /> E uma pequena mola conecta tudo.</p><a className="text-link" href="#quadro" onClick={() => setActiveNav("quadro")}>Acompanhe o próximo salto <ArrowDown size={16} /></a></div><div className="hero-art" aria-label="Palco interativo da mola arco-íris"><HeroStage skin={skin} /></div></section>
      <section className="character-strip" aria-label="Personalizar personagem"><div className="strip-title"><span className="pixel-mini">✳</span><div><strong>Uma mola arco-íris.</strong><span>Desenho da prancha 01, cores em movimento.</span></div></div><div className="skin-options">{skins.map((s, i) => <button key={s.name} className={`skin-button ${skin === i ? "selected" : ""}`} onClick={() => setSkin(i)} aria-pressed={skin === i} title={`Usar matiz ${s.name}`}><span className="skin-swatch" style={{ background: s.color }}>{skin === i && <Check size={12} />}</span><span>{s.name}</span></button>)}</div><span className="strip-index">ARCO-ÍRIS / 0{skin + 1}</span></section>
      <section className="board-section" id="quadro"><div className="section-top"><div><div className="eyebrow section-eyebrow"><Columns3 size={13} /> O FLUXO ACONTECE AQUI</div><h2>Do pensamento ao feito<span className="title-dot">.</span></h2><p>Cada card, um próximo passo. Cada salto, um avanço.</p></div><button className="button button-dark" onClick={() => { if (tasksRef.current.length >= 100) { setNotice("Seu quadro chegou ao limite de 100 tarefas."); return; } setAdding(true); }}><Plus size={16} /> Nova tarefa</button></div>
        <div className="board-toolbar"><div className="toolbar-left"><span className="workspace-label"><span className="square-dot" /> Workspace criativo</span><span className="toolbar-divider" /><label className="agent-filter"><span className="sr-only">Filtrar por agente</span><select value={filter} onChange={e => setFilter(e.target.value)}><option>Todos os agentes</option>{agents.map(a => <option key={a}>{a}</option>)}</select></label></div><div className="toolbar-right"><span className="session-label"><span /> {autoplay ? "DEMO EM MOVIMENTO" : "NO SEU RITMO"}</span><button className={`icon-button play-button ${autoplay ? "playing" : ""}`} aria-label={autoplay ? "Pausar demonstração" : "Iniciar demonstração automática"} aria-pressed={autoplay} onClick={() => setAutoplay(a => !a)}>{autoplay ? <Pause size={15} /> : <Play size={15} />}</button><button className="button button-outline advance-button" disabled={moving} onClick={() => move()}>Avançar tarefa <ArrowRight size={15} /></button></div></div>
        <div className="kanban">{columns.map((col, index) => { const items = tasks.filter(t => t.status === col.id && (filter === "Todos os agentes" || t.agent === filter)); return <div className={`kanban-column column-${col.id}`} key={col.id} data-column={col.id} onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }} onDrop={e => { e.preventDefault(); move(e.dataTransfer.getData("text/plain"), col.id); }}><div className="column-title"><span className={`status-icon status-${col.id}`}>{col.id === "done" ? <CheckCheck size={15} /> : col.id === "doing" ? <span className="progress-pixel" /> : <Circle size={12} />}</span><h3>{col.label}</h3><span className="column-count">{items.length.toString().padStart(2, "0")}</span><span className="column-number">0{index + 1}</span></div><div className="cards">{items.map(task => <article key={task.id} data-task-id={task.id} className={`task-card ${busyId === task.id ? "in-transit" : ""}`} draggable={!moving} onDragStart={e => { e.dataTransfer.setData("text/plain", task.id); e.dataTransfer.effectAllowed = "move"; }}><div className="card-top"><span className={`task-tag tag-${task.tag === "PIXEL ART" ? "art" : task.tag === "FRONTEND" ? "code" : "default"}`}>{task.tag}</span><button className="card-details" aria-label={`Detalhes: ${task.title}`} onClick={() => setSelected(task)}><MoreHorizontal size={17} /></button></div><button className="task-title" onClick={() => setSelected(task)}>{task.title}</button><div className="task-id">{task.id}<span className={task.priority === "Alta" ? "priority-high" : "priority-normal"}>{task.priority === "Alta" ? "↑" : "−"} {task.priority}</span></div><div className="card-footer"><span className="agent-name"><AgentAvatar agent={task.agent} />{task.agent}</span>{task.status === "done" ? <span className="done-label"><Check size={12} /> Feito</span> : <button className="card-move" disabled={moving} onClick={() => move(task.id)} aria-label={`Avançar ${task.title}`}><ArrowRight size={15} /></button>}</div></article>)}{!items.length && <div className="empty-column"><span>＋</span><p>Espaço para o próximo salto.</p></div>}</div><button className="add-in-column" onClick={() => { if (tasksRef.current.length >= 100) { setNotice("Seu quadro chegou ao limite de 100 tarefas."); return; } setAdding(true); }}><Plus size={13} /> Adicionar uma ideia</button><p className="column-note">{col.note}</p></div>; })}</div>
        <div className="board-foot"><span><span className="live-dot" /> {tasks.length} tarefas · {agents.length} agentes ilustrativos · infinitas possibilidades</span><span><CheckCheck size={13} /> {completed} de {tasks.length} concluídas <span className="tiny-progress"><i style={{ width: `${tasks.length ? completed / tasks.length * 100 : 0}%` }} /></span></span></div><div className="demo-note"><Radio size={13} /><span>Este é um playground. A atividade dos agentes é demonstrativa e seus dados ficam neste navegador.</span></div>
      </section>
      <section className="moodboard-section" id="pranchas"><div className="section-top"><div><div className="eyebrow section-eyebrow"><Layers size={13} /> UNIVERSO VISUAL</div><h2>Ideias que dão mola<span className="title-dot">.</span></h2><p>Duas atmosferas. A mesma vontade de colocar tudo em movimento.</p></div><span className="edition-label">PRANCHAS EXPLORATÓRIAS / 01—02</span></div><div className="moodboard-grid">{[{ path: "/moodboards/mola-paper.png", title: "Dias de papel", note: "Orgânico, leve e cheio de possibilidades.", number: "01", theme: "paper" }, { path: "/moodboards/mola-night.png", title: "Depois do último pixel", note: "Neon, nostalgia e ideias que não dormem.", number: "02", theme: "night" }].map(m => <button className={`moodboard moodboard-${m.theme}`} key={m.path} onClick={() => setImage(m.path)}><div className="moodboard-image"><div className="moodboard-placeholder"><Spring skin={m.theme === "paper" ? 0 : 4} showPlaceholder /><span>MOLA / {m.theme.toUpperCase()}</span></div><img src={m.path} alt={`Prancha de referências ${m.title}, com variantes de mola em pixel art`} onError={e => { e.currentTarget.style.opacity = "0"; }} loading="lazy" /><span className="expand-image"><ArrowUpRight size={18} /></span></div><div className="moodboard-caption"><span className="moodboard-number">{m.number}</span><div><h3>{m.title}</h3><p>{m.note}</p></div><span className="mono">VER PRANCHA <ArrowUpRight size={12} /></span></div></button>)}</div></section>
      <section className="activity-section" id="atividade"><div className="activity-intro"><div className="eyebrow section-eyebrow"><Radio size={13} /> RASTROS DO MOVIMENTO</div><h2>O que acabou<br />de acontecer<span className="title-dot">.</span></h2><p>Um registro de cada pequeno avanço<br />neste playground.</p><span className="source-label"><span className="live-dot" /> {source}</span><div className="snapshot-actions"><button className="text-link" onClick={() => upload.current?.click()} disabled={moving}><Upload size={13} /> Importar snapshot</button><button className="text-link" onClick={exportSnapshot}><ArrowDownToLine size={13} /> Exportar JSON</button><input ref={upload} type="file" accept="application/json,.json" className="sr-only" aria-label="Importar snapshot JSON" onChange={e => importSnapshot(e.target.files?.[0])} /></div></div><div className="activity-log">{events.length ? events.slice(0, 5).map((event, i) => <div className="activity-row" key={event.id}><span className={`event-dot ${i === 0 ? "latest" : ""}`} /><p>{event.text}</p><time dateTime={event.time}>{new Date(event.time).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</time></div>) : <div className="activity-empty"><span className="empty-pixel">↗</span><h3>Todo movimento começa com um salto.</h3><p>Avance uma tarefa e acompanhe a história do seu quadro por aqui.</p><button className="text-link" onClick={() => { setActiveNav("quadro"); move(); }}>Vamos começar <ArrowRight size={14} /></button></div>}<span className="activity-footnote">REGISTRO LOCAL DA SESSÃO · SEM CONEXÃO COM AGENTES EXTERNOS</span></div></section>
    </main><footer className="site-footer"><a className="brand" href="#"><span className="brand-symbol">▥</span>MOLA</a><span>Um pequeno salto para cada grande ideia.</span><span className="footer-credit">FEITO DE PIXELS & POSSIBILIDADES <span>✳</span></span></footer>
    <TransportLayer ref={transportRef} />
    <div className="sr-only" aria-live="polite">{busyId ? `A mola está movendo uma tarefa` : events[0]?.text}</div>
    {notice && <div className="toast" role="status"><span>✳</span>{notice}<button aria-label="Fechar aviso" onClick={() => setNotice("")}><X size={15} /></button></div>}
    {adding && <Modal title="Toda ideia merece um começo." onClose={() => setAdding(false)}><p className="modal-copy">Dê um nome ao próximo salto. A mola cuida do caminho.</p><form className="task-form" onSubmit={addTask}><label>O que vamos fazer?<input name="title" required maxLength={150} placeholder="Uma pequena ideia, um grande próximo passo" autoFocus /></label><label>Um pouco mais de contexto<textarea name="description" maxLength={3000} rows={3} placeholder="O que precisa acontecer para essa ideia ganhar vida?" /></label><label>Quem entra em ação?<select name="agent">{agents.map(a => <option key={a}>{a}</option>)}</select></label><button className="button button-dark" type="submit">Colocar no quadro <Plus size={15} /></button></form></Modal>}
    {selected && <Modal title={selected.title} onClose={() => setSelected(null)}><div className="detail-meta"><span className="task-tag">{selected.tag}</span><span className="mono">{selected.id}</span></div><p className="detail-description">{selected.description || "Esta ideia ainda não tem descrição."}</p><div className="detail-row"><span>Responsável ilustrativo</span><span className="agent-name"><AgentAvatar agent={selected.agent} />{selected.agent}</span></div><div className="detail-row"><span>Etapa</span><strong>{columns.find(c => c.id === (tasks.find(t => t.id === selected.id)?.status || selected.status))?.label}</strong></div><div className="detail-row"><span>Prioridade</span><strong>{selected.priority}</strong></div><div className="modal-actions"><button className="button button-outline" onClick={() => setSelected(null)}>Voltar ao quadro</button>{tasks.find(t => t.id === selected.id)?.status !== "done" && <button className="button button-dark" disabled={moving} onClick={() => { move(selected.id); setSelected(null); }}>Avançar tarefa <ArrowRight size={15} /></button>}</div></Modal>}
    {image && <Modal title={image.includes("paper") ? "01 / Dias de papel" : "02 / Depois do último pixel"} onClose={() => setImage(null)} wide><img className="full-moodboard" src={image} alt="Moodboard ampliado de variantes da mola em pixel art" /><a className="text-link image-download" href={image} target="_blank" rel="noreferrer">Abrir imagem original <ExternalLink size={14} /></a></Modal>}
  </div>;
}
