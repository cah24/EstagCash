import { useState } from "react";
import NavBar          from "../componentes/navBar";
import GuardarDinheiro from "../componentes/GuardarDinheiro";
import RetirarDinheiro from "../componentes/RetirarDinheiro";
import AvisoRetirada   from "../componentes/AvisoRetirada";
import "../estilos/MetaDetalhe.css";

const Icone = ({ children, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const IconeVoltar   = () => <Icone size={16}><path d="M19 12H5M11 6l-6 6 6 6"/></Icone>;
const IconeEntrada  = () => <Icone size={16}><path d="M17 7 7 17M7 17h8M7 17V9"/></Icone>;
const IconeSaida    = () => <Icone size={16}><path d="M7 17 17 7M17 7H9M17 7v8"/></Icone>;
const IconeBandeira = () => (
  <Icone><path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/></Icone>
);

const moeda = (valor) =>
  Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const porcentagem = (guardado, alvo) =>
  `${((guardado / alvo) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
               "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

function formatarDataCurta(dataStr) {
  if (!dataStr) return "";
  const [ano, mesNum, dia] = dataStr.split("-");
  return `${dia} ${MESES[Number(mesNum) - 1].slice(0, 3).toLowerCase()} ${ano}`;
}

function calcularGuardado(movimentos) {
  return (movimentos ?? []).reduce((soma, m) => {
    return soma + (m.tipo === "deposito" ? m.valor : -m.valor);
  }, 0);
}

export default function MetaDetalhe({
  meta            = { id: null, nome: "", alvo: 0, movimentos: [] },
  saldo           = 0,
  telaAtiva       = "meta-detalhe",
  onNavegar       = () => {},
  onVoltar        = () => {},
  onIrParaLimites = () => {},
  onGuardar       = () => {},
  onRetirar       = () => {},
  onExcluir       = () => {},
}) {
  const [modalGuardarAberto, setModalGuardarAberto] = useState(false);
  const [avisoAberto,        setAvisoAberto]        = useState(false);
  const [modalRetirarAberto, setModalRetirarAberto] = useState(false);
  const [confirmarExclusao,  setConfirmarExclusao]  = useState(false);

  const movimentos = meta.movimentos ?? [];
  const guardado   = calcularGuardado(movimentos);
  const percentual = meta.alvo > 0 ? Math.min((guardado / meta.alvo) * 100, 100) : 0;
  const faltam     = Math.max(meta.alvo - guardado, 0);

  const handleGuardar = ({ valor }) => { onGuardar(meta.id, valor, ""); };
  const handleRetirar = ({ valor }) => { onRetirar(meta.id, valor, ""); };

  const handleExcluir = () => {
    onExcluir(meta.id);
    onVoltar();
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

        <div className="abas" role="tablist">
          <button role="tab" aria-selected={true} className="aba aba--ativa">
            Metas de economia
          </button>
          <button role="tab" aria-selected={false} className="aba"
            onClick={onIrParaLimites}>
            Limites por categoria
          </button>
        </div>

        <button className="voltar" onClick={onVoltar}>
          <IconeVoltar />
          <span>Todas as metas</span>
        </button>

        <section className="meta-hero">
          <header className="meta-hero__topo">
            <span className="icone-caixa icone-caixa--hero">
              <IconeBandeira />
            </span>
            <div className="meta-hero__titulo">
              <h2>{meta.nome}</h2>
              <p>Em andamento</p>
            </div>
            <span className="selo">Em andamento</span>
          </header>

          <span className="meta-hero__rotulo">Você já juntou</span>

          <div className="meta-hero__linha">
            <strong className="meta-hero__valor">{moeda(guardado)}</strong>

            <div className="meta-hero__acoes">
              <button className="btn btn--primario"
                onClick={() => setModalGuardarAberto(true)}>
                Guardar dinheiro
              </button>
              <button className="btn btn--secundario"
                onClick={() => setAvisoAberto(true)}>
                Retirar dinheiro
              </button>

              {!confirmarExclusao ? (
                <button className="btn btn--excluir"
                  onClick={() => setConfirmarExclusao(true)}>
                  Excluir meta
                </button>
              ) : (
                <div className="excluir-confirmacao">
                  <span>Tem certeza?</span>
                  <button className="btn btn--excluir-confirmar" onClick={handleExcluir}>
                    Sim, excluir
                  </button>
                  <button className="btn btn--excluir-cancelar"
                    onClick={() => setConfirmarExclusao(false)}>
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          </div>

          <span className="meta-hero__alvo">de {moeda(meta.alvo)}</span>

          <div className="barra barra--larga" role="progressbar"
            aria-valuenow={Math.round(percentual)} aria-valuemin={0} aria-valuemax={100}>
            <div className="barra__preenchimento" style={{ width: `${percentual}%` }} />
          </div>

          <div className="meta-hero__rodape">
            <span className="meta-hero__realizado">
              {meta.alvo > 0 ? porcentagem(guardado, meta.alvo) : "0%"} do seu plano realizado
            </span>
            <span>Faltam {moeda(faltam)}</span>
          </div>
        </section>

        <section className="movimentos">
          <header className="movimentos__topo">
            <h3>Aportes e retiradas</h3>
            <span>{movimentos.length} movimentações</span>
          </header>

          {movimentos.length === 0 ? (
            <p style={{ marginTop: 16, fontSize: 13, color: "var(--texto-suave, #6b7090)" }}>
              Nenhuma movimentação ainda. Guarde dinheiro para começar.
            </p>
          ) : (
            <div className="tabela" role="table">
              <div className="tabela__linha tabela__linha--cabecalho" role="row">
                <span role="columnheader">Data</span>
                <span role="columnheader">Descrição</span>
                <span role="columnheader">Tipo</span>
                <span role="columnheader" className="col-valor">Valor</span>
              </div>

              {[...movimentos].reverse().map((mov) => {
                const aporte = mov.tipo === "deposito";
                return (
                  <div className="tabela__linha" role="row" key={mov.id}>
                    <span role="cell" className="col-data">
                      {formatarDataCurta(mov.data)}
                    </span>
                    <span role="cell" className="col-descricao">
                      <span className={`mov-icone ${aporte ? "mov-icone--aporte" : "mov-icone--retirada"}`}>
                        {aporte ? <IconeEntrada /> : <IconeSaida />}
                      </span>
                      {mov.descricao || (aporte ? "Aporte" : "Retirada")}
                    </span>
                    <span role="cell" className={`col-tipo ${aporte ? "col-tipo--aporte" : ""}`}>
                      {aporte ? "Aporte" : "Retirada"}
                    </span>
                    <span role="cell" className={`col-valor col-valor--${aporte ? "aporte" : "retirada"}`}>
                      {aporte ? "+" : "−"} {moeda(mov.valor)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <GuardarDinheiro
        aberto={modalGuardarAberto}
        onFechar={() => setModalGuardarAberto(false)}
        onConfirmar={handleGuardar}
        nomeMeta={meta.nome}
        guardadoAtual={guardado}
        saldoDisponivel={saldo}
      />

      <AvisoRetirada
        aberto={avisoAberto}
        onFechar={() => setAvisoAberto(false)}
        onConfirmar={() => {
          setAvisoAberto(false);
          setModalRetirarAberto(true);
        }}
        nomeMeta={meta.nome}
        guardadoAtual={guardado}
      />

      <RetirarDinheiro
        aberto={modalRetirarAberto}
        onFechar={() => setModalRetirarAberto(false)}
        onConfirmar={handleRetirar}
        nomeMeta={meta.nome}
        guardadoAtual={guardado}
      />
    </div>
  );
}