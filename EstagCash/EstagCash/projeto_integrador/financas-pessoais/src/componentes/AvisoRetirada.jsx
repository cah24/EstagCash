import { useEffect, useRef } from "react";
import "../estilos/AvisoRetirada.css";

/* ---------- Ícones ---------- */
const IconeAlerta = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M10.3 4 2.7 17.5A2 2 0 0 0 4.4 20.5h15.2a2 2 0 0 0 1.7-3L13.7 4a2 2 0 0 0-3.4 0z" />
    <path d="M12 9v4M12 16.5h.01" />
  </svg>
);

const IconeFechar = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

const moeda = (valor) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/* ---------- Componente ---------- */
export default function AvisoRetirada({
  aberto = false,
  nomeMeta = "Viagem para a praia",
  guardadoAtual = 166.67,
  onFechar = () => {},
  onConfirmar = () => {},
}) {
  const botaoCancelar = useRef(null);

  // quando abrir: foca em "Cancelar" (opção mais segura). Esc fecha.
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
      className="aviso-retirada__overlay"
      onMouseDown={(e) => {
        // fecha ao clicar fora do card
        if (e.target === e.currentTarget) onFechar();
      }}
    >
      <div
        className="aviso-retirada"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="aviso-retirada-titulo"
        aria-describedby="aviso-retirada-texto"
      >
        <header className="aviso-retirada__topo">
          <span className="aviso-retirada__icone">
            <IconeAlerta />
          </span>
          <button
            type="button"
            className="aviso-retirada__fechar"
            onClick={onFechar}
            aria-label="Fechar"
          >
            <IconeFechar />
          </button>
        </header>

        <h2 id="aviso-retirada-titulo" className="aviso-retirada__titulo">
          Retirar dinheiro?
        </h2>

        <p id="aviso-retirada-texto" className="aviso-retirada__texto">
          Esse dinheiro está guardado para esta meta. Tem certeza que quer retirar?
        </p>

        <p className="aviso-retirada__detalhe">
          {nomeMeta} · {moeda(guardadoAtual)} guardados
        </p>

        <footer className="aviso-retirada__acoes">
          <button
            type="button"
            ref={botaoCancelar}
            className="aviso-retirada__botao aviso-retirada__botao--secundario"
            onClick={onFechar}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="aviso-retirada__botao aviso-retirada__botao--primario"
            onClick={onConfirmar}
          >
            Retirar mesmo assim
          </button>
        </footer>
      </div>
    </div>
  );
}