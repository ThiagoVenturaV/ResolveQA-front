import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  BarChart3,
  CheckCheck,
  Code2,
  Columns3,
  FileText,
  Play,
} from "lucide-react";
import {
  AdminPreview,
  BoardPreview,
  Logo,
  SiteNav,
} from "@/components/workspace/ui";

export default function LandingPage() {
  return (
    <div className="rq-landing">
      <SiteNav />
      <main id="produto">
        <section className="rq-hero">
          <div className="rq-hero-copy">
            <h1>
              <span className="hero-line">Do relato à</span>
              <span className="hero-line">correção.</span>
              <span className="hero-line">Com evidências.</span>
            </h1>
            <p>
              Acompanhe seus agentes trabalhando.
              <br />
              Investigue cada execução.
            </p>
            <div className="rq-actions">
              <Link href="/quadro" className="rq-button primary">
                <Columns3 size={21} />
                Abrir Mola
                <ArrowRight size={17} />
              </Link>
              <Link href="/admin" className="rq-button">
                <BarChart3 size={21} />
                Acessar Admin
                <ArrowRight size={17} />
              </Link>
            </div>
            <span className="hero-footnote">
              <BookOpen size={14} />
              Documentação atualizada e playbooks da sua empresa.
            </span>
          </div>
          <div className="rq-hero-product">
            <BoardPreview hero />
          </div>
        </section>
        <section
          className="rq-flow"
          id="como-funciona"
          aria-label="Fluxo de resolução"
        >
          <div>
            <FileText />
            <span>Relato</span>
            <ArrowRight />
          </div>
          <div>
            <Play />
            <span>Reprodução</span>
            <ArrowRight />
          </div>
          <div>
            <Code2 />
            <span>Correção</span>
            <ArrowRight />
          </div>
          <div>
            <CheckCheck />
            <span>Verificação</span>
          </div>
          <strong>A evidência acompanha cada etapa.</strong>
        </section>
        <section className="rq-gateways" aria-label="Escolha seu ambiente">
          <article>
            <header>
              <div>
                <h2>
                  <Columns3 size={24} />
                  Mola
                </h2>
                <p>
                  O trabalho dos agentes, em movimento. Cada evento encontra seu
                  lugar no quadro.
                </p>
              </div>
              <Link className="rq-button small" href="/quadro">
                Abrir Mola
                <ArrowRight size={15} />
              </Link>
            </header>
            <Link
              href="/quadro"
              className="preview-link"
              aria-label="Entrar no Kanban da Mola"
            >
              <BoardPreview />
            </Link>
          </article>
          <article>
            <header>
              <div>
                <h2>
                  <BarChart3 size={24} />
                  Admin
                </h2>
                <p>
                  Execuções, logs, traces e playbooks. O contexto para decidir
                  com segurança.
                </p>
              </div>
              <Link className="rq-button small" href="/admin">
                Acessar Admin
                <ArrowRight size={15} />
              </Link>
            </header>
            <Link
              href="/admin"
              className="preview-link"
              aria-label="Entrar no painel Admin"
            >
              <AdminPreview />
            </Link>
          </article>
        </section>
        <section className="rq-knowledge">
          <div>
            <h2>
              A correção fica.
              <br />O conhecimento também.
            </h2>
            <p>
              Documentação que acompanha a evolução do projeto. Playbooks que
              levam o contexto da sua empresa para o fluxo dos agentes.
            </p>
            <Link href="/admin" className="rq-text-link">
              Gerenciar no Admin
              <ArrowRight size={17} />
            </Link>
          </div>
          <div className="knowledge-notes">
            <article>
              <FileText size={20} />
              <div>
                <h3>Documentação atualizada</h3>
                <p>
                  Registre o comportamento corrigido, os testes e as evidências
                  para a próxima pessoa que precisar entender o projeto.
                </p>
              </div>
            </article>
            <article>
              <BookOpen size={20} />
              <div>
                <h3>Playbooks da sua empresa</h3>
                <p>
                  Cadastre procedimentos por empresa e repositório, com
                  instruções para reprodução, correção, verificação e
                  documentação.
                </p>
              </div>
            </article>
          </div>
        </section>
        <div className="landing-disclosure">
          <span className="sample-label">
            Prévias com dados de demonstração
          </span>
          <p>
            Explore o produto no modo demo. A conexão de produção usa os
            serviços configurados no painel.
          </p>
        </div>
      </main>
      <footer className="rq-footer">
        <Logo />
        <span>Autonomia para executar. Clareza para operar.</span>
        <a
          href="https://github.com/moouraajv/ResolveQA"
          target="_blank"
          rel="noreferrer"
        >
          Projeto no GitHub
          <ArrowRight size={14} />
        </a>
      </footer>
    </div>
  );
}
