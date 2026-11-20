import { useState } from "react";
import { createPortal } from "react-dom";
import ConfirmarExclusao from "./ConfirmarExclusao";
import { valorNoMes }   from "../logica/saldo";
import { CATEGORIAS }   from "../dados/categorias";
import "../estilos/DetalhesLancamento.css";

const moeda = (valor) =>
  Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
               "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

function formatarDataLonga(dataStr) {
  if (!dataStr) return "—";
  const [ano, mesNum, dia] = dataStr.split("-");
  return `${dia} de ${MESES[Number(mesNum) - 1]} de ${ano}`;
}

function tipoRotulo(l) {
  if (l.tipo === "despesa_fixa")  return "Despesa fixa";
  if (l.tipo === "entrada" && l.subtipo === "salario")     return "Salário";
  if (l.tipo === "entrada" && l.subtipo === "renda_extra") return "Renda extra";
  if (l.tipo === "saida" && l.parcelas > 1) return "Saída parcelada";
  return "Saída";
}

function situacaoRotulo(l, mes) {
  if (l.tipo === "entrada")      return "Recebido";
  if (l.tipo === "despesa_fixa") return l.pagoNoMes?.[mes] ? "Pago" : "Pendente";
  return "Pago";
}

export default function DetalhesLancamento({
  lancamento  = null,
  mes         = "",
  onFechar    = () => {},
  onEncerrar  = () => {},  // (id) → só para despesa_fixa
  onExcluir   = () => {},  // (id)
}) {
  const [excluirAberto,   setExcluirAberto]   = useState(false);
  const [encerrarAberto,  setEncerrarAberto]  = useState(false);

  if (!lancamento) return null;

  const cat       = CATEGORIAS.find((c) => c.id === lancamento.categoria);
  const valor     = valorNoMes(lancamento);
  const situacao  = situacaoRotulo(lancamento, mes);
  const pago      = situacao === "Pago" || situacao === "Recebido";
  const ehFixa    = lancamento.tipo === "despesa_fixa";

  // Dados resumidos para o modal de confirmação de exclusão
  const dataExibicao = lancamento.data
    ? formatarDataLonga(lancamento.data)
    : lancamento.diaVencimento
      ? `Vence dia ${lancamento.diaVencimento}`
      : "—";

  return (
    <aside className="detalhes">
      <header className="detalhes-topo">
        <h2 className="detalhes-titulo">Detalhes do lançamento</h2>
        <button type="button" className="detalhes-fechar"
          aria-label="Fechar" onClick={onFechar}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            strokeLinejoin="round" aria-hidden="true">
            <path d="M18 6 6 18" /><path d="m6 6 12 12" />
          </svg>
        </button>
      </header>

      <div className="detalhes-corpo">
        {/* Selos */}
        <div className="detalhes-selos">
          <span className="det-selo det-selo-tipo">{tipoRotulo(lancamento)}</span>
          <span className={pago ? "det-selo det-selo-pago" : "det-selo det-selo-pendente"}>
            {situacao}
          </span>
        </div>

        {/* Nome e valor */}
        <div className="detalhes-resumo">
          <h3 className="detalhes-nome">{lancamento.nome}</h3>
          <p className="detalhes-valor">{moeda(valor)}</p>
        </div>

        {/* Informações */}
        <dl className="detalhes-lista">
          {cat && (
            <div className="det-linha">
              <dt>Categoria</dt>
              <dd>{cat.nome}</dd>
            </div>
          )}

          {ehFixa && (
            <>
              <div className="det-linha">
                <dt>Vencimento</dt>
                <dd>Todo dia {lancamento.diaVencimento}</dd>
              </div>
              <div className="det-linha">
                <dt>Repetição</dt>
                <dd>Mensal · todo dia {lancamento.diaVencimento}</dd>
              </div>
              <div className="det-linha">
                <dt>Situação</dt>
                <dd>{situacao}</dd>
              </div>
            </>
          )}

          {lancamento.tipo === "saida" && lancamento.parcelas > 1 && (
            <div className="det-linha">
              <dt>Parcela</dt>
              <dd>{lancamento.parcelaAtual} de {lancamento.parcelas}</dd>
            </div>
          )}

          {lancamento.data && (
            <div className="det-linha">
              <dt>Data</dt>
              <dd>{formatarDataLonga(lancamento.data)}</dd>
            </div>
          )}

          {lancamento.tipo === "entrada" && lancamento.diaRecebimento && (
            <div className="det-linha">
              <dt>Recebimento</dt>
              <dd>Todo dia {lancamento.diaRecebimento}</dd>
            </div>
          )}
        </dl>

        {/* Aviso para despesa fixa */}
        {ehFixa && (
          <div className="detalhes-aviso">
            <p className="det-aviso-titulo">Uma despesa que se repete</p>
            <p className="det-aviso-texto">
              Ao encerrar, os próximos meses deixam de ser gerados. O histórico é mantido.
            </p>
          </div>
        )}

        {/* Ações */}
        <div className="detalhes-acoes">
          {ehFixa && (
            <div className="detalhes-acoes-linha">
              <button type="button" className="det-botao-contorno"
                onClick={() => setEncerrarAberto(true)}>
                Encerrar despesa
              </button>
            </div>
          )}
        </div>

        {/* Rodapé — excluir */}
        <footer className="detalhes-rodape">
          <button type="button" className="detalhes-excluir"
            onClick={() => setExcluirAberto(true)}>
            Excluir
          </button>
          <p className="detalhes-dica">Remove apenas este lançamento.</p>
        </footer>
      </div>

      {/* Modal: confirmar exclusão */}
      {createPortal(
        <ConfirmarExclusao
          aberto={excluirAberto}
          lancamento={{
            nome:      lancamento.nome,
            data:      dataExibicao,
            categoria: cat?.nome ?? "—",
            valor,
          }}
          onFechar={() => setExcluirAberto(false)}
          onConfirmar={() => {
            setExcluirAberto(false);
            onExcluir(lancamento.id);
          }}
        />,
        document.body
      )}

      {/* Modal: confirmar encerramento */}
      {createPortal(
        <ConfirmarExclusao
          aberto={encerrarAberto}
          lancamento={{
            nome:      lancamento.nome,
            data:      `Vence dia ${lancamento.diaVencimento}`,
            categoria: cat?.nome ?? "—",
            valor,
          }}
          onFechar={() => setEncerrarAberto(false)}
          onConfirmar={() => {
            setEncerrarAberto(false);
            onEncerrar(lancamento.id);
          }}
        />,
        document.body
      )}
    </aside>
  );
}