import { useState } from "react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import NavBar               from "../componentes/navBar";
import MenuNovoLancamento   from "../componentes/NovoLancamento";
import NovaEntradaModal     from "../componentes/NovaEntrada";
import NovaDespesaFixaModal from "../componentes/NovaDespesaFixa";
import NovaSaida            from "../componentes/NovaSaida";
import SeletorMes from "../componentes/SeletorMes";
import { valorNoMes } from "../logica/saldo";
import "../estilos/Inicio.css";

// ─────────────────────────────────────────────
// ÍCONES
// ─────────────────────────────────────────────
const ICONES = {
  alerta: (<><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></>),
  seta:   (<><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></>),
  calendario: (<><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></>),
  baixo:    <path d="m6 9 6 6 6-6" />,
  entrada:  (<><path d="M17 7 7 17"/><path d="M17 17H7V7"/></>),
  saida:    (<><path d="M7 7h10v10"/><path d="M7 17 17 7"/></>),
  relogio:  (<><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></>),
  cofrinho: (<><path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2V5z"/><path d="M2 9v1c0 1.1.9 2 2 2h1"/><path d="M16 11h.01"/></>),
  pizza:    (<><path d="M21 12c.552 0 1.005-.449.95-.998a10 10 0 0 0-8.953-8.951c-.55-.055-.998.398-.998.95v8a1 1 0 0 0 1 1z"/><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/></>),
  ajuda:    (<><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></>),
  cesta:    (<><path d="m15 11-1 9"/><path d="m19 11-4-7"/><path d="M2 11h20"/><path d="m3.5 11 1.6 7.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6l1.7-7.4"/><path d="M4.5 15.5h15"/><path d="m5 11 4-7"/><path d="m9 11 1 9"/></>),
  calendarioRelogio: (<><path d="M16 14v2.2l1.6 1"/><path d="M16 2v4"/><path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5"/><path d="M3 10h5"/><path d="M8 2v4"/><circle cx="16" cy="16" r="6"/></>),
  mais:     (<><path d="M5 12h14"/><path d="M12 5v14"/></>),
};

function Icone({ nome, tamanho = 16 }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true">
      {ICONES[nome]}
    </svg>
  );
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const moeda = (valor) =>
  Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Ícone de movimento pelo tipo do lançamento
function iconeDoLancamento(lancamento) {
  if (lancamento.tipo === "entrada")     return "entrada";
  if (lancamento.tipo === "despesa_fixa") return "calendarioRelogio";
  return "saida";
}

// Tom de cor pelo tipo
function tomDoLancamento(lancamento, mes) {
  if (lancamento.tipo === "entrada") return "verde";
  if (lancamento.tipo === "despesa_fixa") {
    return lancamento.pagoNoMes?.[mes] ? "vermelho" : "ambar";
  }
  return "vermelho";
}

// Sinal de valor pelo tipo
function sinalDoLancamento(lancamento, mes) {
  if (lancamento.tipo === "entrada") return "+ ";
  if (lancamento.tipo === "despesa_fixa" && !lancamento.pagoNoMes?.[mes]) return "";
  return "− ";
}

// Data usada para ordenar e exibir cada movimento ("AAAA-MM-DD").
// Saída e renda extra têm "data". Salário e despesa fixa só têm o dia,
// então montamos a data com o mês atual.
function dataDoLancamento(lancamento, mes) {
  if (lancamento.data) return lancamento.data;
  const dia = lancamento.diaVencimento ?? lancamento.diaRecebimento;
  if (!dia) return "";
  return `${mes}-${String(dia).padStart(2, "0")}`;
}

// "2026-11-05" → "05/11"
function formatarDataCurta(dataStr) {
  if (!dataStr) return "";
  const [, mes, dia] = dataStr.split("-");
  return `${dia}/${mes}`;
}

// Rótulo do tipo do lançamento
function rotuloDoTipo(lancamento) {
  if (lancamento.tipo === "despesa_fixa") return "Despesa fixa";
  if (lancamento.tipo === "entrada") {
    return lancamento.subtipo === "salario" ? "Salário" : "Renda extra";
  }
  return "Saída";
}

// Cores do gráfico de rosca
const CORES_GRAFICO = ["#5157dc", "#8a90e0", "#a5a9e3", "#dcdef2", "#c5c8f0", "#b0b4eb"];

// ─────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────
export default function Inicio({
  telaAtiva = "inicio",
  onNavegar  = () => {},
  nomeUsuario       = "",
  mes               = "",
  onMudarMes        = () => {},    
  resumo            = { entradas: 0, saidas: 0, pendentes: 0, guardado: 0, saldo: 0 },
  lancamentosDoMes  = [],
  gastosPorCategoria = {},
  regra502030       = {},
  limites           = {},
  categorias        = [],
  onAdicionarEntrada     = () => {},
  onAdicionarDespesaFixa = () => {},
  onAdicionarSaida       = () => {},
}) {
  const [modalAtivo, setModalAtivo] = useState(null);
  const fecharModais = () => setModalAtivo(null);

  const handleEscolherMenu = (tipo) => {
    if (["entrada", "despesa-fixa", "saida"].includes(tipo)) setModalAtivo(tipo);
    else setModalAtivo(null);
  };

  // ── Alerta: categorias que passaram do limite ──
  const alertas = Object.entries(limites)
    .filter(([catId, limite]) => (gastosPorCategoria[catId] ?? 0) > limite)
    .map(([catId, limite]) => {
      const cat    = categorias.find((c) => c.id === catId);
      const gasto  = gastosPorCategoria[catId] ?? 0;
      return { catId, nome: cat?.nome ?? catId, excesso: gasto - limite };
    });

  // ── Dados do gráfico de rosca ──
  const totalGastos = Object.values(gastosPorCategoria).reduce((s, v) => s + v, 0);

  // Pega as 3 maiores categorias e agrupa o resto em "Outros"
  const categoriasOrdenadas = Object.entries(gastosPorCategoria)
    .map(([catId, valor]) => ({
      catId,
      nome:  categorias.find((c) => c.id === catId)?.nome ?? catId,
      valor,
    }))
    .sort((a, b) => b.valor - a.valor);

  const top3    = categoriasOrdenadas.slice(0, 3);
  const resto   = categoriasOrdenadas.slice(3).reduce((s, e) => s + e.valor, 0);
  const dadosGrafico = resto > 0
    ? [...top3, { catId: "outros_agrup", nome: "Demais categorias", valor: resto }]
    : top3;

  const maiorCategoria = categoriasOrdenadas[0] ?? null;

  // ── Regra 50/30/20 ──
  const grupos502030 = [
    { chave: "necessidade", nome: "Necessidades", referencia: 50 },
    { chave: "desejo",      nome: "Desejos",      referencia: 30 },
    { chave: "poupanca",    nome: "Poupança",      referencia: 20 },
  ].map(({ chave, nome, referencia }) => {
    const dado = regra502030[chave] ?? { referencia: 0, usado: 0, percentualUsado: 0 };
    const pctUsado = Math.round(dado.percentualUsado);
    const acima    = pctUsado > referencia;
    return { nome, referencia, pctUsado, usado: dado.usado, acima,
      tom: chave === "poupanca" ? "azul" : acima ? "ambar" : "verde" };
  });

  // ── Últimas movimentações (5 mais recentes) ──
  const ultimas = lancamentosDoMes
    .map((l) => ({ ...l, dataExibicao: dataDoLancamento(l, mes) }))
    .sort((a, b) => b.dataExibicao.localeCompare(a.dataExibicao))
    .slice(0, 5);

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <div className="tela-inicio">
      <NavBar telaAtiva={telaAtiva} onNavegar={onNavegar} />

      <main className="ini-conteudo">
        {/* Cabeçalho */}
        <header className="ini-cabecalho">
          <div>
            <h1 className="ini-titulo">
              Olá{nomeUsuario ? `, ${nomeUsuario}` : ""}!
            </h1>
            <p className="ini-subtitulo">Seu dinheiro em dia. Seus planos mais perto.</p>
          </div>
          <SeletorMes valor={mes} onChange={onMudarMes} className="ini-mes" />
        </header>

        {/* Alertas de limite */}
        {alertas.map((alerta) => (
          <div key={alerta.catId} className="ini-alerta" role="alert">
            <Icone nome="alerta" tamanho={18} />
            <p className="ini-alerta-texto">
              <strong>{alerta.nome} passou do limite do mês</strong>
              <span>{moeda(alerta.excesso)} acima do planejado</span>
            </p>
            <button type="button" className="ini-alerta-acao"
              onClick={() => onNavegar("limites")}>
              Revisar limite
              <Icone nome="seta" tamanho={16} />
            </button>
          </div>
        ))}

        {/* Card de saldo */}
        <section className="ini-cartao ini-saldo">
          <div className="ini-saldo-principal">
            <div className="ini-saldo-topo">
              <h2 className="ini-cartao-titulo ini-forte">Saldo do mês</h2>
              <span className="ini-selo">Livre para usar</span>
            </div>
            <p className="ini-saldo-valor">{moeda(resumo.saldo)}</p>
            <p className="ini-saldo-texto">
              Já descontadas despesas pendentes e valores guardados
            </p>
            <button type="button" className="ini-link"
              onClick={() => onNavegar("saldo")}>
              Ver extrato <Icone nome="seta" tamanho={15} />
            </button>
          </div>

          <ul className="ini-resumo">
            {[
              { rotulo: "Entrou",   valor: resumo.entradas,  icone: "entrada",  tom: "verde"   },
              { rotulo: "Saiu",     valor: resumo.saidas,    icone: "saida",    tom: "vermelho" },
              { rotulo: "Pendente", valor: resumo.pendentes, icone: "relogio",  tom: "ambar"   },
              { rotulo: "Guardado", valor: resumo.guardado,  icone: "cofrinho", tom: "azul"    },
            ].map((item) => (
              <li key={item.rotulo} className={`ini-resumo-linha ini-tom-${item.tom}`}>
                <span className="ini-icone">
                  <Icone nome={item.icone} tamanho={16} />
                </span>
                <span className="ini-resumo-rotulo">{item.rotulo}</span>
                <span className="ini-resumo-valor">{moeda(item.valor)}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="ini-duplo">
          {/* Gráfico de maior gasto */}
          <section className="ini-cartao ini-gasto">
            <div className="ini-cartao-topo">
              <h2 className="ini-cartao-titulo">Maior gasto do mês</h2>
              <span className="ini-icone-suave">
                <Icone nome="pizza" tamanho={18} />
              </span>
            </div>

            {totalGastos === 0 ? (
              <p style={{ marginTop: 16, fontSize: 13, color: "var(--texto-suave)" }}>
                Nenhum gasto registrado ainda.
              </p>
            ) : (
              <div className="ini-gasto-corpo">
                <div className="ini-donut">
                  <PieChart width={154} height={154} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
                  <Pie
                    data={dadosGrafico}
                    cx={75} cy={75}
                    innerRadius={49} outerRadius={73}
                    paddingAngle={2}
                    dataKey="valor"
                    startAngle={90}
                    endAngle={-270}
                  >
                      {dadosGrafico.map((_, i) => (
                        <Cell key={i} fill={CORES_GRAFICO[i % CORES_GRAFICO.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(valor, _, props) => [moeda(valor), props.payload.nome]}
                      contentStyle={{
                        borderRadius: 10,
                        border: "1px solid #dcdef2",
                        fontSize: 12,
                        boxShadow: "none",
                      }}
                    />
                  </PieChart>
                  <div className="ini-donut-centro">
                    <strong>
                      {totalGastos > 0
                        ? `${Math.round(((maiorCategoria?.valor ?? 0) / totalGastos) * 100)}%`
                        : "0%"}
                    </strong>
                    <span>dos gastos</span>
                  </div>
                </div>

                <div className="ini-gasto-info">
                  <p className="ini-gasto-categoria">{maiorCategoria?.nome ?? "—"}</p>
                  <p className="ini-gasto-valor">{moeda(maiorCategoria?.valor ?? 0)}</p>
                  <ul className="ini-legenda">
                    {dadosGrafico.map((g, i) => (
                      <li key={g.catId}>
                        <span className="ini-legenda-ponto"
                          style={{ background: CORES_GRAFICO[i % CORES_GRAFICO.length] }} />
                        <span>{g.nome}</span>
                        <span className="ini-legenda-pct">
                          {totalGastos > 0
                            ? `${((g.valor / totalGastos) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`
                            : "0%"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </section>

          {/* Regra 50/30/20 */}
          <section className="ini-cartao ini-regra">
            <div className="ini-cartao-topo">
              <h2 className="ini-cartao-titulo">Regra 50/30/20</h2>
              <button type="button" className="ini-chip-ajuda"
                onClick={() => onNavegar("regra")}>
                <Icone nome="ajuda" tamanho={14} />
                Entenda a regra
              </button>
            </div>

            <p className="ini-regra-base">
              Percentuais sobre o orçamento de {moeda(resumo.entradas)}
            </p>

            <div className="ini-regra-lista">
              {grupos502030.map((r) => (
                <div key={r.nome} className={`ini-regra-bloco ini-tom-${r.tom}`}>
                  <div className="ini-regra-linha">
                    <p>
                      <strong>{r.nome}</strong>
                      <span>Referência {r.referencia}%</span>
                    </p>
                    <span className="ini-regra-uso">Usado {r.pctUsado}%</span>
                  </div>
                  <div className="ini-barra">
                    <span className="ini-barra-preenchimento"
                      style={{ width: `${Math.min(r.pctUsado, 100)}%` }} />
                    <span className="ini-barra-marca"
                      style={{ left: `${r.referencia}%` }} />
                  </div>
                  <p className="ini-regra-legenda">
                    {moeda(r.usado)} usados
                    {r.acima ? " · acima da referência" : ""}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Últimas movimentações */}
        <section className="ini-cartao ini-ultimas">
          <div className="ini-ultimas-topo">
            <h2 className="ini-cartao-titulo">Últimas movimentações</h2>
            <button type="button" className="ini-link ini-link-pequeno"
              onClick={() => onNavegar("saldo")}>
              Ver todas <Icone nome="seta" tamanho={12} />
            </button>
          </div>

          {ultimas.length === 0 ? (
            <p style={{ marginTop: 12, fontSize: 13, color: "var(--texto-suave)" }}>
              Nenhuma movimentação ainda. Toque no + para começar.
            </p>
          ) : (
            <ul className="ini-movimentos">
              {ultimas.map((m) => {
                const tom   = tomDoLancamento(m, mes);
                const sinal = sinalDoLancamento(m, mes);
                const icone = iconeDoLancamento(m);
                const cat   = categorias.find((c) => c.id === m.categoria);
                const partes = [cat?.nome, rotuloDoTipo(m), formatarDataCurta(m.dataExibicao)];
                const detalhe = partes.filter(Boolean).join(" · ");
                return (
                  <li key={m.id} className={`ini-movimento ini-tom-${tom}`}>
                    <span className="ini-movimento-nome">
                      <span className="ini-icone ini-icone-pequeno">
                        <Icone nome={icone} tamanho={14} />
                      </span>
                      {m.nome}
                    </span>
                    <span className="ini-movimento-meta">{detalhe}</span>
                    <span className="ini-movimento-valor">
                      {sinal}{moeda(valorNoMes(m))}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>

      {/* Botão + */}
      <button type="button" className="ini-fab" aria-label="Novo lançamento"
        onClick={() => setModalAtivo("menu")}>
        <Icone nome="mais" tamanho={24} />
      </button>

      {/* Modais */}
      {modalAtivo === "menu" && (
        <MenuNovoLancamento onFechar={fecharModais} onEscolher={handleEscolherMenu} />
      )}
      {modalAtivo === "entrada" && (
        <NovaEntradaModal
          onFechar={fecharModais}
          onConfirmar={(dados) => {
            onAdicionarEntrada(
              dados.tipoEntrada,
              dados.nome,
              dados.valor,
              dados.diaRecebimento,
              dados.data ?? null,
            );
            fecharModais();
          }}
        />
      )}
      {modalAtivo === "despesa-fixa" && (
        <NovaDespesaFixaModal
          onFechar={fecharModais}
          onConfirmar={(dados) => {
            onAdicionarDespesaFixa(
              dados.nome,
              dados.valor,
              dados.categoria,
              dados.diaVencimento,
            );
            fecharModais();
          }}
        />
      )}
      {modalAtivo === "saida" && (
        <NovaSaida
          onFechar={fecharModais}
          onConfirmar={(dados) => {
            onAdicionarSaida(
              dados.nome,
              dados.valor,
              dados.categoria,
              dados.data,
              dados.parcelas ?? 1,
              dados.parcelaAtual ?? 1,
            );
            fecharModais();
          }}
        />
      )}
    </div>
  );
}