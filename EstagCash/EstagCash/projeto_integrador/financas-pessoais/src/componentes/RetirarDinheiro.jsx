import { useEffect, useRef, useState } from "react";
import "../estilos/RetirarDinheiro.css";

/* ---------- Ícones ---------- */
const IconeCofrinho = () => (
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
    <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2V5z" />
    <path d="M2 9v1c0 1.1.9 2 2 2h1" />
    <path d="M16 11h.01" />
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
const moeda = (valor) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Máscara de moeda: digitou 10000 -> "100,00"
const mascararValor = (texto) => {
  const digitos = texto.replace(/\D/g, "").slice(0, 12);
  if (!digitos) return "";
  return (parseInt(digitos, 10) / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// "1.240,00" -> 1240
const valorParaNumero = (texto) =>
  texto ? parseFloat(texto.replace(/\./g, "").replace(",", ".")) : 0;

/* ---------- Componente ---------- */
export default function RetirarDinheiro({
  aberto = false,
  nomeMeta = "Viagem para a praia",
  guardadoAtual = 166.67,
  onFechar = () => {},
  onConfirmar = () => {},
}) {
  const [valor, setValor] = useState("");
  const campoValor = useRef(null);

  // Quando abrir: limpa o campo e foca nele. Esc fecha.
  useEffect(() => {
    if (!aberto) return;

    setValor("");
    campoValor.current?.focus();

    const aoPressionar = (e) => {
      if (e.key === "Escape") onFechar();
    };
    document.addEventListener("keydown", aoPressionar);
    return () => document.removeEventListener("keydown", aoPressionar);
  }, [aberto, onFechar]);

  if (!aberto) return null;

  const valorNumerico = valorParaNumero(valor);
  // arredonda para evitar erros de centavos (ex.: 166.67 - 100)
  const acimaDoGuardado = Math.round(valorNumerico * 100) > Math.round(guardadoAtual * 100);
  const podeConfirmar = valorNumerico > 0 && !acimaDoGuardado;
  const novoTotal = acimaDoGuardado
    ? guardadoAtual
    : Math.round((guardadoAtual - valorNumerico) * 100) / 100;

  const enviar = (e) => {
    e.preventDefault();
    if (!podeConfirmar) return;

    onConfirmar({ valor: valorNumerico });
    onFechar();
  };

  return (
    <div
      className="retirar-dinheiro__overlay"
      onMouseDown={(e) => {
        // fecha ao clicar fora do card
        if (e.target === e.currentTarget) onFechar();
      }}
    >
      <div
        className="retirar-dinheiro"
        role="dialog"
        aria-modal="true"
        aria-labelledby="retirar-dinheiro-titulo"
      >
        <header className="retirar-dinheiro__topo">
          <span className="retirar-dinheiro__icone">
            <IconeCofrinho />
          </span>
          <button
            type="button"
            className="retirar-dinheiro__fechar"
            onClick={onFechar}
            aria-label="Fechar"
          >
            <IconeFechar />
          </button>
        </header>

        <h2 id="retirar-dinheiro-titulo" className="retirar-dinheiro__titulo">
          Retirar dinheiro
        </h2>
        <p className="retirar-dinheiro__subtitulo">Da meta {nomeMeta}</p>

        <form className="retirar-dinheiro__form" onSubmit={enviar}>
          <label htmlFor="retirar-dinheiro-valor">Quanto você quer retirar?</label>

          <div
            className={`retirar-dinheiro__valor ${
              acimaDoGuardado ? "retirar-dinheiro__valor--erro" : ""
            }`}
          >
            <span className="retirar-dinheiro__moeda">R$</span>
            <input
              id="retirar-dinheiro-valor"
              ref={campoValor}
              className="retirar-dinheiro__valor-input"
              type="text"
              inputMode="numeric"
              placeholder="0,00"
              value={valor}
              onChange={(e) => setValor(mascararValor(e.target.value))}
              autoComplete="off"
            />
          </div>

          <p
            className={`retirar-dinheiro__disponivel ${
              acimaDoGuardado ? "retirar-dinheiro__disponivel--erro" : ""
            }`}
          >
            {acimaDoGuardado
              ? `Valor maior que o disponível na meta: ${moeda(guardadoAtual)}`
              : `Disponível na meta: ${moeda(guardadoAtual)}`}
          </p>

          <div className="retirar-dinheiro__resumo">
            <span>Sua meta vai ficar com</span>
            <strong>{moeda(novoTotal)}</strong>
          </div>

          <button type="submit" className="retirar-dinheiro__botao" disabled={!podeConfirmar}>
            Confirmar
          </button>
        </form>
      </div>
    </div>
  );
}