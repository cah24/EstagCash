import { useState } from "react";
import NavBar   from "../componentes/navBar";
import NovaMeta from "../componentes/NovaMeta";
import "../estilos/Metas.css";

// ─────────────────────────────────────────────
// ÍCONES
// ─────────────────────────────────────────────
const Icone = ({ children, size = 20, className = "" }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const IconeBandeira = () => <Icone><path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/></Icone>;
const IconeSeta     = () => <Icone size={18}><path d="m9 6 6 6-6 6"/></Icone>;
const IconeInfo     = () => (
  <Icone size={16}><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></Icone>
);
const IconeMais = ({ size = 20 }) => <Icone size={size}><path d="M12 5v14M5 12h14"/></Icone>;

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const moeda = (valor) =>
  Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const porcentagem = (guardado, alvo) =>
  `${((guardado / alvo) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;

function totalGuardadoMeta(meta) {
  return (meta.movimentos ?? []).reduce((soma, m) => {
    return soma + (m.tipo === "deposito" ? m.valor : -m.valor);
  }, 0);
}

// ─────────────────────────────────────────────
// CARD DE META
// ─────────────────────────────────────────────
function CardMeta({ meta, onAbrir }) {
  const guardado   = totalGuardadoMeta(meta);
  const percentual = meta.alvo > 0 ? Math.min((guardado / meta.alvo) * 100, 100) : 0;
  const faltam     = Math.max(meta.alvo - guardado, 0);

  return (
    <article className="card-meta" onClick={onAbrir} style={{ cursor: "pointer" }}>
      <header className="card-meta__topo">
        <div className="card-meta__titulo">
          <span className="icone-caixa"><IconeBandeira /></span>
          <h3>{meta.nome}</h3>
        </div>
        <button className="card-meta__seta" aria-label={`Abrir ${meta.nome}`}
          onClick={(e) => { e.stopPropagation(); onAbrir(); }}>
          <IconeSeta />
        </button>
      </header>

      <div className="card-meta__valores">
        <strong className="card-meta__guardado">{moeda(guardado)}</strong>
        <span className="card-meta__alvo">de {moeda(meta.alvo)}</span>
      </div>

      <div className="card-meta__rodape">
        <div className="barra" role="progressbar"
          aria-valuenow={Math.round(percentual)} aria-valuemin={0} aria-valuemax={100}>
          <div className="barra__preenchimento" style={{ width: `${percentual}%` }} />
        </div>
        <div className="card-meta__info">
          <span>Faltam {moeda(faltam)}</span>
          <span className="card-meta__percentual">
            {meta.alvo > 0 ? porcentagem(guardado, meta.alvo) : "0%"}
          </span>
        </div>
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────
export default function Metas({
  telaAtiva   = "metas",
  onNavegar   = () => {},
  metas       = [],
  onCriarMeta = () => {},
}) {
  const [modalAberto, setModalAberto] = useState(false);

  const totalGuardado = metas.reduce((soma, m) => soma + totalGuardadoMeta(m), 0);

  const handleCriar = ({ nome, valorTotal }) => {
    onCriarMeta(nome, valorTotal);
  };

  return (
    <div className="metas-app">
      <NavBar telaAtiva={telaAtiva} onNavegar={onNavegar} />

      <main className="conteudo">
        <header className="conteudo__cabecalho">
          <div>
            <h1>Metas</h1>
            <p>Pequenos passos hoje, grandes planos amanhã.</p>
          </div>
        </header>

        {/* Abas */}
        <div className="abas" role="tablist">
          <button role="tab" aria-selected={true} className="aba aba--ativa">
            Metas de economia
          </button>
          <button role="tab" aria-selected={false} className="aba"
            onClick={() => onNavegar("limites")}>
            Limites por categoria
          </button>
        </div>

        {/* Resumo */}
        <section className="resumo">
          <div>
            <h2>Seus planos estão crescendo</h2>
            <p>{metas.length} {metas.length === 1 ? "meta" : "metas"} em andamento. Cada pouquinho conta.</p>
          </div>
          <div className="resumo__total">
            <span>Total guardado nas metas</span>
            <strong>{moeda(totalGuardado)}</strong>
          </div>
        </section>

        {/* Grade de metas */}
        <section className="grade-metas">
          {metas.map((meta) => (
            <CardMeta
              key={meta.id}
              meta={meta}
              onAbrir={() => onNavegar("meta-detalhe", meta)}
            />
          ))}

          <button className="card-nova" onClick={() => setModalAberto(true)}>
            <span className="icone-caixa icone-caixa--grande">
              <IconeMais />
            </span>
            <strong>+ Nova meta</strong>
            <span>Dê um nome ao seu próximo plano.</span>
          </button>
        </section>

        <p className="aviso">
          <IconeInfo />
          O dinheiro guardado nas metas fica separado do seu saldo disponível.
        </p>
      </main>

      <button className="fab" aria-label="Adicionar" onClick={() => setModalAberto(true)}>
        <IconeMais size={24} />
      </button>

      <NovaMeta
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        onCriar={handleCriar}
      />
    </div>
  );
}