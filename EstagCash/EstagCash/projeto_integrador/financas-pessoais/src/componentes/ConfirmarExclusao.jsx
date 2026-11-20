import { useEffect, useRef } from "react";
import "../estilos/ConfirmarExclusao.css";

const moeda = (valor) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/* ---------- Componente ---------- */
export default function ConfirmarExclusao({
  aberto = false,
  lancamento = {
    nome: "Mercado",
    data: "06 de novembro",
    categoria: "Alimentação",
    valor: 120,
  },
  onFechar = () => {},
  onConfirmar = () => {},
}) {
  const botaoCancelar = useRef(null);

  // Quando abrir: foca em "Cancelar" (opção mais segura). Esc fecha.
  useEffect(() => {
    if (!aberto) return;

    botaoCancelar.current?.focus();

    const aoPressionar = (e) => {
      if (e.key === "Escape") onFechar();
    };
    document.addEventListener("keydown", aoPressionar);
    return () => document.removeEventListener("keydown", aoPressionar);
  }, [aberto, onFechar]);

  if (!aberto) return null;

  return (
    <div
      className="confirmar-exclusao__overlay"
      onMouseDown={(e) => {
        // fecha ao clicar fora do card
        if (e.target === e.currentTarget) onFechar();
      }}
    >
      <div
        className="confirmar-exclusao"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmar-exclusao-titulo"
        aria-describedby="confirmar-exclusao-texto"
      >
        <h2 id="confirmar-exclusao-titulo" className="confirmar-exclusao__titulo">
          Excluir este lançamento?
        </h2>

        <p id="confirmar-exclusao-texto" className="confirmar-exclusao__texto">
          O lançamento será removido do seu extrato.
          <br />
          Essa ação não pode ser desfeita.
        </p>

        <div className="confirmar-exclusao__resumo">
          <div className="confirmar-exclusao__resumo-info">
            <strong>{lancamento.nome}</strong>
            <span>
              {lancamento.data} · {lancamento.categoria}
            </span>
          </div>
          <strong className="confirmar-exclusao__resumo-valor">
            {moeda(lancamento.valor)}
          </strong>
        </div>

        <div className="confirmar-exclusao__acoes">
          <button
            type="button"
            ref={botaoCancelar}
            className="confirmar-exclusao__botao confirmar-exclusao__botao--cancelar"
            onClick={onFechar}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="confirmar-exclusao__botao confirmar-exclusao__botao--excluir"
            onClick={onConfirmar}
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}