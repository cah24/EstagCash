import { useState } from "react";
import NavBar from "../componentes/navBar";
import "../estilos/LimitesCategoria.css";
import SeletorMes from "../componentes/SeletorMes";

const Icone = ({ children, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const IconeCasa       = () => <Icone><path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/></Icone>;
const IconeLuz        = () => <Icone><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6M10 22h4"/></Icone>;
const IconeAgua       = () => <Icone><path d="M12 2v1"/><path d="M5.6 5.6c3.9 1.3 6.3 5 5.8 9.1A6 6 0 0 1 6 20a6 6 0 0 1-1-11.9"/><path d="M17.5 7.5c1.3 2.1 1.3 4.9 0 7a7 7 0 0 1-5 3"/></Icone>;
const IconeInternet   = () => <Icone><circle cx="12" cy="12" r="9"/><path d="M3.6 9h16.8M3.6 15h16.8"/><path d="M12 3a14.5 14.5 0 0 1 0 18M12 3a14.5 14.5 0 0 0 0 18"/></Icone>;
const IconeMercado    = () => <Icone><path d="M3 10h18l-1.6 9a1 1 0 0 1-1 .8H5.6a1 1 0 0 1-1-.8z"/><path d="m8 10 4-6 4 6"/><path d="M10 14v3M14 14v3"/></Icone>;
const IconeOnibus     = () => <Icone><path d="M5 4h14a1 1 0 0 1 1 1v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a1 1 0 0 1 1-1z"/><path d="M4 11h16M8 15h.01M16 15h.01M7 18v2M17 18v2"/></Icone>;
const IconeCoracao    = () => <Icone><path d="M19.5 12.6 12 20l-7.5-7.4a4.5 4.5 0 0 1 7.5-5 4.5 4.5 0 0 1 7.5 5z"/><path d="M7 12h2l1.5-2.5 2 4L14 12h3"/></Icone>;
const IconeCapelo     = () => <Icone><path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/><path d="M22 9v6"/></Icone>;
const IconeGarfo      = () => <Icone><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></Icone>;
const IconePipoca     = () => <Icone><path d="M6 10l1.5 10h9L18 10z"/><path d="M10 10v10M14 10v10"/><path d="M6 10a2.5 2.5 0 0 1 2-4 2.5 2.5 0 0 1 4-1 2.5 2.5 0 0 1 4 1 2.5 2.5 0 0 1 2 4"/></Icone>;
const IconeSacola     = () => <Icone><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18M16 10a4 4 0 0 1-8 0"/></Icone>;
const IconePlay       = () => <Icone><rect x="2" y="7" width="20" height="15" rx="2"/><polyline points="17 2 12 7 7 2"/></Icone>;
const IconeOutros     = () => <Icone><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></Icone>;
const IconeCofrinho   = () => <Icone><path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2V5z"/><path d="M2 9v1c0 1.1.9 2 2 2h1"/><path d="M16 11h.01"/></Icone>;

const ICONE_CAT = {
  moradia:           <IconeCasa />,
  luz:               <IconeLuz />,
  agua:              <IconeAgua />,
  internet_telefone: <IconeInternet />,
  mercado:           <IconeMercado />,
  transporte:        <IconeOnibus />,
  saude:             <IconeCoracao />,
  educacao:          <IconeCapelo />,
  restaurante:       <IconeGarfo />,
  lazer:             <IconePipoca />,
  compras:           <IconeSacola />,
  assinaturas:       <IconePlay />,
  outros:            <IconeOutros />,
  investimento:      <IconeCofrinho />,
};

const IconeLapis      = () => <Icone size={16}><path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17z"/><path d="m14 7 3 3"/></Icone>;
const IconeAlerta     = () => <Icone size={16}><path d="M10.3 4 2.7 17.5A2 2 0 0 0 4.4 20.5h15.2a2 2 0 0 0 1.7-3L13.7 4a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 16.5h.01"/></Icone>;
const IconeInfo       = () => <Icone size={16}><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></Icone>;

const TOM_POR_GRUPO = { necessidade: "verde", desejo: "amarelo", poupanca: "azul" };

const moeda = (valor) =>
  Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const paraNumero = (texto) => {
  if (!texto) return null;
  const n = parseFloat(texto.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
};

const formatarCampo = (texto) => {
  const n = paraNumero(texto);
  return n === null ? "" : n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const calcularUso = (gasto, limite) => {
  if (limite === null)   return { status: "sem-limite", percentual: 0,   texto: "Sem limite" };
  if (gasto > limite)    return { status: "acima",      percentual: 100, texto: `${moeda(gasto - limite)} acima do limite` };
  const percentual  = (gasto / limite) * 100;
  const arredondado = Math.round(percentual);
  if (percentual >= 90)  return { status: "perto",  percentual, texto: `${arredondado}% · Perto do limite` };
  return                        { status: "dentro", percentual, texto: `${arredondado}% · Dentro do limite` };
};

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
               "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

function formatarMes(mesStr) {
  const [ano, mes] = mesStr.split("-");
  return `${MESES[Number(mes) - 1]} de ${ano}`;
}

function LinhaCategoria({ cat, gastoNoMes, limiteTexto, onChange, onBlur }) {
  const limiteNumerico = paraNumero(limiteTexto);
  const uso            = calcularUso(gastoNoMes, limiteNumerico);
  const tom            = TOM_POR_GRUPO[cat.grupo] ?? "cinza";
  const icone          = ICONE_CAT[cat.id] ?? <IconeOutros />;

  return (
    <div className="limites__linha" role="row">
      <div className="categoria" role="cell">
        <span className={`cat-icone cat-icone--${tom}`}>{icone}</span>
        <span className="categoria__nome">{cat.nome}</span>
      </div>

      <div role="cell">
        <label className="campo">
          {limiteTexto && <span className="campo__prefixo">R$</span>}
          <input
            className="campo__input"
            type="text"
            inputMode="decimal"
            placeholder="Sem limite"
            value={limiteTexto}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            aria-label={`Limite mensal de ${cat.nome}`}
          />
          <span className="campo__lapis"><IconeLapis /></span>
        </label>
      </div>

      <div className="gasto" role="cell">{moeda(gastoNoMes)}</div>

      <div className="uso" role="cell">
        <div className="uso__barra">
          <div
            className={`uso__preenchimento uso__preenchimento--${uso.status}`}
            style={{ width: `${uso.percentual}%` }}
          />
        </div>
        <span className={`uso__texto uso__texto--${uso.status}`}>{uso.texto}</span>
      </div>
    </div>
  );
}

export default function LimitesCategoria({
  telaAtiva          = "limites",
  onNavegar          = () => {},
  onIrParaEconomia   = () => {},
  mes                = "",
  onMudarMes         = () => {},   
  limites            = {},
  gastosPorCategoria = {},
  categorias         = [],
  onDefinirLimite    = () => {},
  onRemoverLimite    = () => {},
}) {
  // Rascunho: só guarda o texto enquanto o campo está sendo editado.
  // A fonte da verdade é sempre a prop `limites` do App — sem estado duplicado.
  const [rascunhos, setRascunhos] = useState({});

  const textoExibido = (catId) => {
    if (catId in rascunhos) return rascunhos[catId];
    const v = limites[catId];
    return v != null
      ? v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : "";
  };

  const handleChange = (catId, texto) => {
    const limpo = texto.replace(/[^\d,]/g, "");
    setRascunhos((prev) => ({ ...prev, [catId]: limpo }));
  };

  const handleBlur = (catId) => {
    const texto     = rascunhos[catId] ?? textoExibido(catId);
    const formatado = formatarCampo(texto);
    setRascunhos((prev) => {
      const copia = { ...prev };
      delete copia[catId];
      return copia;
    });
    const numero = paraNumero(formatado);
    if (numero !== null) {
      onDefinirLimite(catId, numero);
    } else {
      onRemoverLimite(catId);
    }
  };

  const acimaDoLimite = categorias.filter((c) => {
    const limite = limites[c.id];
    const gasto  = gastosPorCategoria[c.id] ?? 0;
    return limite != null && gasto > limite;
  }).length;

  const listaFiltrada = categorias.filter((c) => c.id !== "investimento");

  return (
    <div className="metas-app">
      <NavBar telaAtiva={telaAtiva} onNavegar={onNavegar} />

      <main className="conteudo">
        <header className="conteudo__cabecalho">
          <div>
            <h1>Metas</h1>
            <p>Pequenos passos hoje, grandes planos amanhã.</p>
          </div>
          <SeletorMes valor={mes} onChange={onMudarMes} />
        </header>

        <div className="abas" role="tablist">
          <button role="tab" aria-selected={false} className="aba"
            onClick={onIrParaEconomia}>
            Metas de economia
          </button>
          <button role="tab" aria-selected={true} className="aba aba--ativa">
            Limites por categoria
          </button>
        </div>

        <section className="resumo">
          <div>
            <h2>Planeje o mês, categoria por categoria</h2>
            <p>Defina um limite mensal se quiser. Você pode ajustar a qualquer momento.</p>
          </div>
          {acimaDoLimite > 0 && (
            <span className="selo-alerta">
              <IconeAlerta />
              {acimaDoLimite}{" "}
              {acimaDoLimite === 1 ? "categoria acima do limite" : "categorias acima do limite"}
            </span>
          )}
        </section>

        <section className="limites">
          <header className="limites__topo">
            <h3>Limites {mes ? `de ${formatarMes(mes)}` : "do mês"}</h3>
            <span>{listaFiltrada.length} categorias</span>
          </header>

          <div role="table">
            <div className="limites__linha limites__linha--cabecalho" role="row">
              <span role="columnheader">Categoria</span>
              <span role="columnheader">Limite mensal · opcional</span>
              <span role="columnheader">Gasto no mês</span>
              <span role="columnheader">Uso do limite</span>
            </div>

            {listaFiltrada.map((cat) => (
              <LinhaCategoria
                key={cat.id}
                cat={cat}
                gastoNoMes={gastosPorCategoria[cat.id] ?? 0}
                limiteTexto={textoExibido(cat.id)}
                onChange={(texto) => handleChange(cat.id, texto)}
                onBlur={() => handleBlur(cat.id)}
              />
            ))}
          </div>
        </section>

        <p className="aviso">
          <IconeInfo />
          Os limites ajudam a planejar seus gastos, mas não bloqueiam movimentações.
        </p>
      </main>
    </div>
  );
}