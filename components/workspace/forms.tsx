"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Cable, Check, Save, X } from "lucide-react";
import { apiUrl, type ConnectionConfig } from "@/lib/resolveqa/client";
import { useRuntime } from "./runtime";

export function NewCaseForm({ onClose }: { onClose: () => void }) {
  const r = useRuntime();
  const dialog = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    const before = document.activeElement as HTMLElement;
    const element = dialog.current;
    element?.showModal();
    return () => {
      element?.close();
      before?.focus();
    };
  }, []);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setSaving(true);
    setError("");
    try {
      await r.addCase({
        client_id: String(f.get("company")).trim(),
        repo_ref: String(f.get("repo")).trim(),
        report_text: String(f.get("report")).trim(),
      });
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Não foi possível criar o caso.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <dialog
      className="rq-dialog"
      ref={dialog}
      onCancel={onClose}
      aria-labelledby="new-case-title"
    >
      <header>
        <h2 id="new-case-title">Novo relato</h2>
        <button
          className="rq-icon-button"
          onClick={onClose}
          aria-label="Fechar formulário"
        >
          <X size={20} />
        </button>
      </header>
      <p>Conte o que aconteceu. A triagem começa com o contexto.</p>
      <form className="rq-form" onSubmit={submit}>
        <label>
          Empresa
          <input
            name="company"
            required
            maxLength={120}
            defaultValue={r.mode === "demo" ? "Acme Commerce" : ""}
            placeholder="Identificador da empresa"
          />
        </label>
        <label>
          Repositório
          <input
            name="repo"
            required
            maxLength={240}
            defaultValue={r.mode === "demo" ? "acme/checkout" : ""}
            placeholder="organização/repositório"
          />
        </label>
        <label>
          Relato
          <textarea
            name="report"
            required
            minLength={10}
            maxLength={4000}
            rows={5}
            placeholder="Passos, resultado esperado e resultado observado…"
          />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <p className="form-note">
          {r.mode === "demo"
            ? "Este caso ficará apenas na demonstração local."
            : "O relato será enviado à API de casos configurada."}
        </p>
        <button
          className="rq-button primary"
          disabled={saving || (r.mode === "production" && !r.config.baseUrl)}
        >
          {saving ? "Enviando…" : "Criar caso"}
        </button>
      </form>
    </dialog>
  );
}
export function ConnectionForm() {
  const r = useRuntime();
  const [draft, setDraft] = useState<ConnectionConfig>(r.config);
  const [ids, setIds] = useState(r.config.caseIds.join("\n"));
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const field = (key: keyof ConnectionConfig, value: string) =>
    setDraft((d) => ({ ...d, [key]: value }));
  function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      apiUrl(draft, "/health");
      for (const path of [
        draft.snapshotPath,
        draft.streamPath,
        draft.playbooksPath,
      ])
        if (path) apiUrl(draft, path);
      const next = {
        ...draft,
        baseUrl: draft.baseUrl.replace(/\/$/, ""),
        caseIds: [
          ...new Set(
            ids
              .split(/[\n,]/)
              .map((x) => x.trim())
              .filter(Boolean),
          ),
        ],
      };
      r.configure(next);
      setMessage(
        "Configuração salva. Selecione Produção para receber os dados reais.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Configuração inválida.");
    }
  }
  return (
    <div className="connection-layout">
      <form className="rq-form connection-form" onSubmit={submit}>
        <h2>Conecte seu backend</h2>
        <p>
          Use a API de casos existente ou informe os serviços adicionais da sua
          instalação.
        </p>
        <label>
          URL do backend
          <input
            type="url"
            required
            placeholder="https://api.sua-empresa.com"
            value={draft.baseUrl}
            onChange={(e) => field("baseUrl", e.target.value.trim())}
          />
          <small>
            Sem chaves ou segredos. A API deve permitir a origem deste front via
            CORS.
          </small>
        </label>
        <label>
          IDs dos casos acompanhados
          <textarea
            rows={3}
            placeholder="Um case_id por linha"
            value={ids}
            onChange={(e) => setIds(e.target.value)}
          />
          <small>
            A API atual consulta casos por ID. Novos casos criados por este
            front entram nesta lista.
          </small>
        </label>
        <details>
          <summary>Serviços adicionais (opcional)</summary>
          <p>
            Preencha apenas rotas implementadas pelo seu gateway. Esses
            endpoints não existem no backend base consultado.
          </p>
          <label>
            Snapshot de operação
            <input
              placeholder="/caminho-do-snapshot"
              value={draft.snapshotPath}
              onChange={(e) => field("snapshotPath", e.target.value.trim())}
            />
            <small>
              Retorna casos, eventos, spans e referências de documentação.
            </small>
          </label>
          <label>
            Stream de eventos SSE
            <input
              placeholder="/caminho-dos-eventos"
              value={draft.streamPath}
              onChange={(e) => field("streamPath", e.target.value.trim())}
            />
            <small>
              Criação e transições dos agentes acionam os movimentos da Mola.
            </small>
          </label>
          <label>
            API de playbooks
            <input
              placeholder="/caminho-dos-playbooks"
              value={draft.playbooksPath}
              onChange={(e) => field("playbooksPath", e.target.value.trim())}
            />
            <small>
              Lista e grava os procedimentos da empresa. Contrato em
              docs/production-connection.md.
            </small>
          </label>
        </details>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="form-success" role="status">
            <Check size={16} />
            {message}
          </p>
        )}
        <button className="rq-button primary">
          <Save size={16} />
          Salvar conexão
        </button>
      </form>
      <aside className="connection-explainer">
        <Cable size={28} />
        <h3>Uma interface. Duas fontes.</h3>
        <p>
          <strong>Demo</strong> gera casos e transições sintéticos, com animação
          e armazenamento local.
        </p>
        <p>
          <strong>Produção</strong> lê a API configurada. Sem stream, consulta
          os casos conhecidos a cada 5 segundos.
        </p>
        <ul>
          <li>
            Somente <code>verified</code> entra em Concluído.
          </li>
          <li>Bloqueios e falhas ficam em Atenção.</li>
          <li>Sem telemetria recebida, os gráficos ficam vazios.</li>
          <li>Tokens de origem permanecem no servidor.</li>
        </ul>
        <a
          href="https://github.com/moouraajv/ResolveQA"
          target="_blank"
          rel="noreferrer"
        >
          Consultar o backend no GitHub
        </a>
      </aside>
    </div>
  );
}
