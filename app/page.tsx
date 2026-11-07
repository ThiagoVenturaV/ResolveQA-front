import Link from "next/link";
import { ArrowRight, Columns3, LineChart } from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";

export default function LandingPage() {
  return (
    <div className="workspace landing-page">
      <SiteHeader />
      <main>
        <section className="landing-hero" aria-label="Mola">
          <div className="landing-hero-media" aria-hidden="true">
            <img src="/landing/hero.jpg" alt="" className="landing-hero-still" />
            <video
              className="landing-hero-video"
              autoPlay
              muted
              loop
              playsInline
              poster="/landing/hero.jpg"
            >
              <source src="/landing/mola-motion.mp4" type="video/mp4" />
            </video>
            <div className="landing-hero-veil" />
          </div>
          <div className="landing-hero-copy">
            <p className="landing-kicker">MOLA · ResolveQA</p>
            <h1 className="landing-brand">MOLA</h1>
            <p className="landing-tagline">Trabalho em movimento.</p>
            <p className="landing-lead">
              Uma mola arco-íris leva cada tarefa pelo fluxo. Escolha o quadro dos agentes ou o painel da empresa.
            </p>
            <div className="landing-cta-row">
              <Link className="landing-cta landing-cta-primary" href="/quadro">
                Abrir quadro <ArrowRight size={16} />
              </Link>
              <Link className="landing-cta landing-cta-secondary" href="/admin">
                Área admin <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        <section className="landing-gates" aria-label="Interfaces">
          <Link className="landing-gate" href="/quadro">
            <div className="landing-gate-media">
              <img src="/landing/quadro.jpg" alt="" />
              <video autoPlay muted loop playsInline poster="/landing/quadro.jpg">
                <source src="/landing/mola-motion.mp4" type="video/mp4" />
              </video>
            </div>
            <div className="landing-gate-copy">
              <span className="landing-gate-icon" aria-hidden="true"><Columns3 size={18} /></span>
              <h2>Quadro</h2>
              <p>Kanban vivo com a mola transportando cards entre colunas. Demo local no navegador.</p>
              <span className="landing-gate-go">Entrar no quadro <ArrowRight size={14} /></span>
            </div>
          </Link>

          <Link className="landing-gate landing-gate-admin" href="/admin">
            <div className="landing-gate-media">
              <img src="/landing/admin.jpg" alt="" />
            </div>
            <div className="landing-gate-copy">
              <span className="landing-gate-icon" aria-hidden="true"><LineChart size={18} /></span>
              <h2>Admin</h2>
              <p>Métricas ilustrativas para a empresa acompanhar ritmo, conclusões e agentes em demonstração.</p>
              <span className="landing-gate-go">Ver métricas <ArrowRight size={14} /></span>
            </div>
          </Link>
        </section>
      </main>
      <footer className="site-footer">
        <Link className="brand" href="/"><span className="brand-symbol">▥</span>MOLA</Link>
        <span>Landing, quadro e admin no mesmo workspace.</span>
        <span className="footer-credit">MODO DEMONSTRAÇÃO · DADOS LOCAIS</span>
      </footer>
    </div>
  );
}
