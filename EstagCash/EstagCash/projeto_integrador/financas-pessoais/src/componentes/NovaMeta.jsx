import { useEffect, useRef, useState } from "react";
import "../estilos/NovaMeta.css";

/* ---------- Ícones ---------- */
const IconeBandeira = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M5 21V4" />
    <path d="M5 4h11l-2 4 2 4H5" />
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

/* ---------- Funções auxiliares ---------- */
// Máscara de moeda: digitou 2000000 -> "20.000,00"
const mascararValor = (texto) => {
  const digitos = texto.replace(/\D/g, "").slice(0, 12);
  if (!digitos) return "";
  return (parseInt(digitos, 10) / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// "20.000,00" -> 20000
const valorParaNumero = (texto) =>
  texto ? parseFloat(texto.replace(/\./g, "").replace(",", ".")) : 0;

/* ---------- Componente ---------- */
export default function NovaMeta({ aberto = false, onFechar = () => {}, onCriar = () => {} }) {
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");
  const campoNome = useRef(null);

  // Fecha com a tecla Esc e foca o campo "Nome" ao abrir
  useEffect(() => {
    if (!aberto) return;

    campoNome.current?.focus();

    const aoPressionar = (e) => {
      if (e.key === "Escape") onFechar();
    };
    document.addEventListener("keydown", aoPressionar);
    return () => document.removeEventListener("keydown", aoPressionar);
  }, [aberto, onFechar]);

  if (!aberto) return null;

  const valorNumerico = valorParaNumero(valor);
  const podeCriar = nome.trim().length > 0 && valorNumerico > 0;

  const enviar = (e) => {
    e.preventDefault();
    if (!podeCriar) return;

    onCriar({ nome: nome.trim(), valorTotal: valorNumerico });
    setNome("");
    setValor("");
    onFechar();
  };

  return (
    <div
      className="nova-meta__overlay"
      onMouseDown={(e) => {
        // fecha ao clicar fora do card
        if (e.target === e.currentTarget) onFechar();
      }}
    >
      <div
        className="nova-meta"
        role="dialog"
        aria-modal="true"
        aria-labelledby="nova-meta-titulo"
      >
        <header className="nova-meta__topo">
          <span className="nova-meta__icone">
            <IconeBandeira />
          </span>
          <button
            type="button"
            className="nova-meta__fechar"
            onClick={onFechar}
            aria-label="Fechar"
          >
            <IconeFechar />
          </button>
        </header>

        <h2 id="nova-meta-titulo" className="nova-meta__titulo">
          Nova meta
        </h2>
        <p className="nova-meta__subtitulo">Dê um nome ao seu próximo plano.</p>

        <form className="nova-meta__form" onSubmit={enviar}>
          <div className="nova-meta__grupo">
            <label htmlFor="nova-meta-nome">Nome</label>
            <input
              id="nova-meta-nome"
              ref={campoNome}
              className="nova-meta__input"
              type="text"
              placeholder="Ex.: Meu primeiro carro"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              maxLength={40}
              autoComplete="off"
            />
          </div>

          <div className="nova-meta__grupo nova-meta__grupo--valor">
            <label htmlFor="nova-meta-valor">Valor total</label>
            <div className="nova-meta__valor">
              <span className="nova-meta__moeda">R$</span>
              <input
                id="nova-meta-valor"
                className="nova-meta__valor-input"
                type="text"
                inputMode="numeric"
                placeholder="0,00"
                value={valor}
                onChange={(e) => setValor(mascararValor(e.target.value))}
                autoComplete="off"
              />
            </div>
          </div>

          <button type="submit" className="nova-meta__botao" disabled={!podeCriar}>
            Criar meta
          </button>
        </form>
      </div>
    </div>
  );
}