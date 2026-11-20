import { useState } from "react";
import { createPortal } from "react-dom";
import { ShieldCheck } from "lucide-react";
import NavBar from "../componentes/navBar";
import GuardarDinheiro from "../componentes/GuardarDinheiro";
import RetirarDinheiro from "../componentes/RetirarDinheiro";
import AvisoRetirada from "../componentes/AvisoRetirada";
import "../estilos/ReservaEmergencia.css";

/* ---------- Constantes ---------- */
const NOME_META = "Reserva de emergência";
const SALDO_DISPONIVEL = 0; // ← AJUSTADO (só vale se a tela não receber o saldo do App)
const APORTE_MAXIMO = 1500;
const APORTE_EXTRA = 100;

const CHAVE_RESERVA = "estagCash:reserva";

// ← AJUSTADO: lê o que foi salvo (ou um objeto vazio)
const lerReserva = () => {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE_RESERVA));
    return salvo && typeof salvo === "object" ? salvo : {};
  } catch {
    return {};
  }
};

// ← AJUSTADO: salva mesclando com o que já existe (guardado + despesa média)
const salvarReserva = (parcial) => {
  try {
    localStorage.setItem(CHAVE_RESERVA, JSON.stringify({ ...lerReserva(), ...parcial }));
  } catch {
    /* sem espaço ou bloqueado: ignora */
  }
};

const numeroSalvo = (v) => (typeof v === "number" && v >= 0 ? v : 0); // ← AJUSTADO

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const MES_INICIAL = 10; // novembro
const ANO_INICIAL = 2026;

// "Personalizado" usa 12 meses por enquanto; depois você pode trocar por um campo
const PERIODOS = [
  { id: 3, rotulo: "3 meses", meses: 3 },
  { id: 6, rotulo: "6 meses", meses: 6 },
  { id: "personalizado", rotulo: "Personalizado", meses: 12 },
];

/* ---------- Funções auxiliares ---------- */
const moeda = (valor) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const formatarPercentual = (valor) =>
  valor.toLocaleString("pt-BR", { maximumFractionDigits: 1 });

// meses a partir de nov/2026: 13 -> { mes: "dez", ano: 2027, texto: "dez 2027" }
const dataApos = (n) => {
  const total = MES_INICIAL + n;
  const mes = MESES[total % 12];
  const ano = ANO_INICIAL + Math.floor(total / 12);
  return { mes, ano, texto: `${mes} ${ano}` };
};

// quantos meses faltam para atingir a meta com um aporte mensal (null = não dá para calcular)
const calcularMeses = (guardado, meta, aporte) => {
  if (meta <= 0) return null; // ← AJUSTADO: sem despesa média informada, não há meta
  if (guardado >= meta) return 0;
  if (aporte <= 0) return null;
  return Math.ceil(Math.round((meta - guardado) * 100) / Math.round(aporte * 100));
};

/* ---------- Gráfico de projeção ---------- */
const PASSOS = 13; // nov/2026 até dez/2027 (14 pontos)
const X0 = 56;
const X1 = 730;
const Y_TOPO = 52;
const Y_BASE = 243;
const PASSO = (X1 - X0) / PASSOS;
const LARGURA_BALAO = 202;

function GraficoProjecao({ guardado, meta, aporte, mesesPrincipal, mesesComparacao }) {
  const semMeta = meta <= 0; // ← AJUSTADO
  const escala = semMeta ? 3000 : meta; // ← AJUSTADO

  const x = (i) => X0 + i * PASSO;
  const y = (valor) => Y_BASE - (Math.min(valor, escala) / escala) * (Y_BASE - Y_TOPO);

  const serie = (ap) =>
    Array.from({ length: PASSOS + 1 }, (_, i) => ({ x: x(i), y: y(guardado + ap * i) }));

  const principal = serie(aporte);
  const comparacao = serie(aporte + APORTE_EXTRA);

  const caminho = (pontos) =>
    pontos.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

  const area = `${caminho(principal)} L${X1} ${Y_BASE} L${X0} ${Y_BASE} Z`;

  const alcancaPrincipal = mesesPrincipal !== null && mesesPrincipal <= PASSOS;
  const alcancaComparacao =
    mesesComparacao !== null && mesesComparacao <= PASSOS && mesesComparacao !== mesesPrincipal;

  const linhasHorizontais = [0, 1, 2, 3].map((k) => ({
    k,
    valor: (escala * k) / 3,
    y: Y_BASE - (k * (Y_BASE - Y_TOPO)) / 3,
  }));

  const baloonX = alcancaPrincipal ? Math.max(X0, x(mesesPrincipal) - LARGURA_BALAO) : 0;

  return (
    <svg
      className="res-grafico"
      viewBox="0 0 744 290"
      role="img"
      aria-label="Projeção da reserva de emergência mês a mês"
    >
      {/* linhas horizontais e rótulos do eixo Y */}
      {linhasHorizontais.map(({ k, valor, y: posY }) => (
        <g key={k}>
          <text x="0" y={posY + 4} className="res-grafico__eixo">
            R$ {Math.round(valor)}
          </text>
          <line
            x1={X0}
            x2={X1}
            y1={posY}
            y2={posY}
            className={k === 3 && !semMeta ? "res-grafico__meta" : "res-grafico__grade"}
          />
        </g>
      ))}

      {/* ← AJUSTADO: sem meta, mostra uma mensagem em vez das linhas */}
      {semMeta && (
        <text x={(X0 + X1) / 2} y="135" textAnchor="middle" className="res-grafico__vazio">
          Informe sua despesa média mensal para ver a projeção.
        </text>
      )}

      {!semMeta && (
        <>
          {/* área sob a linha principal */}
          <path d={area} className="res-grafico__area" />

          {/* linha de comparação (tracejada) e linha principal */}
          <path d={caminho(comparacao)} className="res-grafico__comparacao" />
          <path d={caminho(principal)} className="res-grafico__principal" />

          {/* pontos */}
          <circle cx={x(0)} cy={principal[0].y} r="3.5" className="res-grafico__ponto" />
          {alcancaComparacao && (
            <circle cx={x(mesesComparacao)} cy={Y_TOPO} r="3" className="res-grafico__ponto-claro" />
          )}
          {alcancaPrincipal && (
            <circle cx={x(mesesPrincipal)} cy={Y_TOPO} r="5" className="res-grafico__ponto-final" />
          )}

          {/* balão "Meta atingida" */}
          {alcancaPrincipal && (
            <g>
              <rect x={baloonX} y="8" width={LARGURA_BALAO} height="29" rx="8" className="res-grafico__balao" />
              <text
                x={baloonX + LARGURA_BALAO / 2}
                y="26"
                textAnchor="middle"
                className="res-grafico__balao-texto"
              >
                Meta atingida em {dataApos(mesesPrincipal).texto}
              </text>
              <path
                d={`M${x(mesesPrincipal) - 6} 37 L${x(mesesPrincipal)} 46`}
                className="res-grafico__conector"
              />
            </g>
          )}
        </>
      )}

      {/* rótulos do eixo X */}
      {Array.from({ length: PASSOS + 1 }, (_, i) => {
        const { mes, ano } = dataApos(i);
        return (
          <g key={i}>
            <text x={x(i)} y="266" textAnchor="middle" className="res-grafico__eixo">
              {mes}
            </text>
            <text x={x(i)} y="281" textAnchor="middle" className="res-grafico__eixo">
              {ano}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ---------- Tela ---------- */
export default function ReservaEmergencia({
  telaAtiva       = "reserva",
  onNavegar,
  saldoDisponivel = 0,
  guardado        = 0,
  onGuardar       = () => {},
  onRetirar       = () => {},
}) {
  const [periodoId, setPeriodoId] = useState(6);
  const [despesaMedia, setDespesaMedia] = useState(() => numeroSalvo(lerReserva().despesaMedia));
  const [aporte, setAporte] = useState(0);

  const [guardarAberto, setGuardarAberto] = useState(false);
  const [avisoAberto, setAvisoAberto] = useState(false);
  const [retirarAberto, setRetirarAberto] = useState(false);


  const periodo = PERIODOS.find((p) => p.id === periodoId);
  const meta = despesaMedia * periodo.meses; // ← AJUSTADO
  const faltam = Math.max(meta - guardado, 0);
  const percentual = meta > 0 ? Math.min((guardado / meta) * 100, 100) : 0; // ← AJUSTADO

  const mesesParaAlcancar = calcularMeses(guardado, meta, aporte);
  const mesesComparacao = calcularMeses(guardado, meta, aporte + APORTE_EXTRA);
  const dataAlcance = mesesParaAlcancar ? dataApos(mesesParaAlcancar).texto : null;
  const textoComparacao =
    mesesComparacao !== null ? dataApos(mesesComparacao).texto : "—";

  const aporteSlider = Math.min(aporte, APORTE_MAXIMO);
  
  const guardarDinheiro = ({ valor }) => onGuardar(valor);
  const retirarDinheiro = ({ valor }) => onRetirar(valor);

  const mudarAporteDigitado = (e) => {
    const digitos = e.target.value.replace(/\D/g, "").slice(0, 8);
    setAporte(digitos ? parseInt(digitos, 10) / 100 : 0);
  };

  // ← AJUSTADO: campo da despesa média mensal
  const mudarDespesaDigitada = (e) => {
    const digitos = e.target.value.replace(/\D/g, "").slice(0, 8);
    const novoValor = digitos ? parseInt(digitos, 10) / 100 : 0;
    setDespesaMedia(novoValor);
    salvarReserva({ despesaMedia: novoValor });
  };

  // ← AJUSTADO: textos conforme o que falta o usuário informar
  let textoPrazo = "No seu ritmo, a tranquilidade chega.";
  if (meta <= 0) textoPrazo = "Informe sua despesa média acima.";
  else if (mesesParaAlcancar === null) textoPrazo = "Defina um aporte para ver a previsão.";
  else if (mesesParaAlcancar === 0) textoPrazo = "Você já alcançou a meta. Parabéns!";

  return (
    <div className="tela-reserva">
      <NavBar telaAtiva={telaAtiva} onNavegar={onNavegar} />

      <main className="res-conteudo">
        {/* cabeçalho */}
        <header className="res-cabecalho">
          <div>
            <h1>Reserva de emergência</h1>
            <p>Sua tranquilidade para os imprevistos.</p>
          </div>

        </header>

        {/* card principal */}
        <section className="res-card res-hero">
          <div className="res-hero__topo">
            <span className="res-icone">
              <ShieldCheck size={20} />
            </span>
            <div className="res-hero__titulo">
              <h2>Sua reserva</h2>
              <p>Um cuidado hoje, mais tranquilidade amanhã.</p>
            </div>

            <div className="res-segmento" role="group" aria-label="Período da reserva">
              {PERIODOS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={p.id === periodoId}
                  className={p.id === periodoId ? "res-segmento__ativo" : ""}
                  onClick={() => setPeriodoId(p.id)}
                >
                  {p.rotulo}
                </button>
              ))}
            </div>
          </div>

          <span className="res-hero__rotulo">Você já tem</span>

          <div className="res-hero__linha">
            <strong className="res-hero__valor">{moeda(guardado)}</strong>

            <div className="res-hero__acoes">
              <button
                type="button"
                className="res-botao res-botao--primario"
                onClick={() => setGuardarAberto(true)}
              >
                Guardar dinheiro
              </button>
              <button
                type="button"
                className="res-botao res-botao--secundario"
                onClick={() => setAvisoAberto(true)}
              >
                Retirar dinheiro
              </button>
            </div>
          </div>

          <span className="res-hero__alvo">
            de {moeda(meta)} ({periodo.meses} meses de despesas)
          </span>

          <div
            className="res-barra"
            role="progressbar"
            aria-valuenow={Math.round(percentual)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="res-barra__preenchimento" style={{ width: `${percentual}%` }} />
          </div>

          <div className="res-hero__rodape">
            <span className="res-hero__realizado">
              {formatarPercentual(percentual)}% do seu plano realizado
            </span>
            <span>Faltam {moeda(faltam)}</span>
          </div>
        </section>

        {/* projeção + simulador */}
        <div className="res-grade">
          <section className="res-card res-card--alto res-projecao">
            <h3>Projeção</h3>
            <p className="res-subtitulo">Sua reserva crescendo, mês a mês.</p>

            <ul className="res-legenda">
              <li>
                <span className="res-legenda__linha" />
                R$ {aporte.toLocaleString("pt-BR")}/mês
              </li>
              <li>
                <span className="res-legenda__linha res-legenda__linha--tracejada" />
                Com +R$ {APORTE_EXTRA}/mês: {textoComparacao}
              </li>
            </ul>

            <GraficoProjecao
              guardado={guardado}
              meta={meta}
              aporte={aporte}
              mesesPrincipal={mesesParaAlcancar}
              mesesComparacao={mesesComparacao}
            />

            <p className="res-nota">Projeção sem rendimentos, com aportes a partir de dez 2026.</p>
          </section>

          <section className="res-card res-card--alto res-simulador">
            <h3>Simule seu aporte</h3>

            <label className="res-simulador__rotulo" htmlFor="res-aporte">
              Aporte mensal
            </label>
            <input
              id="res-aporte"
              className="res-campo"
              type="text"
              inputMode="numeric"
              value={moeda(aporte)}
              onChange={mudarAporteDigitado}
              autoComplete="off"
            />

            <div className="res-slider-area">
              <input
                className="res-slider"
                type="range"
                min="0"
                max={APORTE_MAXIMO}
                step="50"
                value={aporteSlider}
                onChange={(e) => setAporte(Number(e.target.value))}
                style={{ "--pct": `${(aporteSlider / APORTE_MAXIMO) * 100}%` }}
                aria-label="Aporte mensal"
              />
              <div className="res-slider-limites">
                <span>R$ 0</span>
                <span>R$ {APORTE_MAXIMO.toLocaleString("pt-BR")}</span>
              </div>
            </div>

            <label
              className="res-simulador__rotulo res-simulador__rotulo--despesa"
              htmlFor="res-despesa"
            >
              Despesa média mensal
            </label>
            {/* ← AJUSTADO: agora é um campo editável (mesma aparência do texto do design) */}
            <input
              id="res-despesa"
              className="res-despesa"
              type="text"
              inputMode="numeric"
              value={moeda(despesaMedia)}
              onChange={mudarDespesaDigitada}
              autoComplete="off"
            />

            <hr className="res-divisor" />

            <span className="res-simulador__rotulo res-simulador__rotulo--meses">
              Meses para alcançar:
            </span>
            <div className="res-simulador__resultado">
              <strong>{mesesParaAlcancar === null ? "—" : mesesParaAlcancar}</strong>
              {dataAlcance && <span className="res-selo">{dataAlcance}</span>}
            </div>
            <p className="res-simulador__texto">{textoPrazo}</p>
          </section>
        </div>
      </main>

      {/* modais (desenhados no body, por cima de tudo) */}
      {createPortal(
        <>
          <GuardarDinheiro
            aberto={guardarAberto}
            nomeMeta={NOME_META}
            guardadoAtual={guardado}
            saldoDisponivel={saldoDisponivel}
            onFechar={() => setGuardarAberto(false)}
            onConfirmar={guardarDinheiro}
          />

          <AvisoRetirada
            aberto={avisoAberto}
            nomeMeta={NOME_META}
            guardadoAtual={guardado}
            onFechar={() => setAvisoAberto(false)}
            onConfirmar={() => {
              setAvisoAberto(false);
              setRetirarAberto(true);
            }}
          />

          <RetirarDinheiro
            aberto={retirarAberto}
            nomeMeta={NOME_META}
            guardadoAtual={guardado}
            onFechar={() => setRetirarAberto(false)}
            onConfirmar={retirarDinheiro}
          />
        </>,
        document.body
      )}
    </div>
  );
}