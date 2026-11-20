import { useEffect, useState } from "react";
import "../estilos/AlterarSalario.css";

/* ---------- Ícones ---------- */
const IconeCarteira = () => (
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
    <path d="M4 7a2 2 0 0 1 2-2h11a1 1 0 0 1 1 1v2" />
    <rect x="4" y="7" width="16" height="12" rx="2" />
    <path d="M16 13h4v3h-4a1.5 1.5 0 0 1 0-3z" />
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
const formatarValor = (numero) =>
  numero.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// Máscara de moeda: digitou 180000 -> "1.800,00"
const mascararValor = (texto) => {
  const digitos = texto.replace(/\D/g, "").slice(0, 12);
  if (!digitos) return "";
  return formatarValor(parseInt(digitos, 10) / 100);
};

// "1.800,00" -> 1800
const valorParaNumero = (texto) =>
  texto ? parseFloat(texto.replace(/\./g, "").replace(",", ".")) : 0;

/* ---------- Componente ---------- */
export default function AlterarSalario({
  aberto = false,
  salarioAtual = 1800,
  diaAtual = 5,
  onFechar = () => {},
  onSalvar = () => {},
}) {
  const [salario, setSalario] = useState("");
  const [dia, setDia] = useState("");

  // Quando abrir: preenche os campos com os valores atuais
  useEffect(() => {
    if (!aberto) return;
    setSalario(formatarValor(salarioAtual));
    setDia(String(diaAtual));
  }, [aberto]);

  // Esc fecha
  useEffect(() => {
    if (!aberto) return;

    const aoPressionar = (e) => {
      if (e.key === "Escape") onFechar();
    };
    document.addEventListener("keydown", aoPressionar);
    return () => document.removeEventListener("keydown", aoPressionar);
  }, [aberto, onFechar]);

  if (!aberto) return null;

  const salarioNumerico = valorParaNumero(salario);
  const diaNumerico = parseInt(dia, 10);
  const diaValido = diaNumerico >= 1 && diaNumerico <= 31;
  const diaComErro = dia !== "" && !diaValido;
  const podeSalvar = salarioNumerico > 0 && diaValido;

  const enviar = (e) => {
    e.preventDefault();
    if (!podeSalvar) return;

    onSalvar({ salario: salarioNumerico, dia: diaNumerico });
    onFechar();
  };

  return (
    <div
      className="alterar-salario__overlay"
      onMouseDown={(e) => {
        // fecha ao clicar fora do card
        if (e.target === e.currentTarget) onFechar();
      }}
    >
      <div
        className="alterar-salario"
        role="dialog"
        aria-modal="true"
        aria-labelledby="alterar-salario-titulo"
      >
        <header className="alterar-salario__topo">
          <span className="alterar-salario__icone">
            <IconeCarteira />
          </span>
          <button
            type="button"
            className="alterar-salario__fechar"
            onClick={onFechar}
            aria-label="Fechar"
          >
            <IconeFechar />
          </button>
        </header>

        <h2 id="alterar-salario-titulo" className="alterar-salario__titulo">
          Alterar salário
        </h2>
        <p className="alterar-salario__subtitulo">
          Atualize quando seu salário mudar. Vale a partir deste mês.
        </p>

        <form className="alterar-salario__form" onSubmit={enviar}>
          <div className="alterar-salario__grupo">
            <label htmlFor="alterar-salario-valor">Novo salário</label>
            <div className="alterar-salario__valor">
              <span className="alterar-salario__moeda">R$</span>
              <input
                id="alterar-salario-valor"
                className="alterar-salario__valor-input"
                type="text"
                inputMode="numeric"
                placeholder="0,00"
                value={salario}
                onChange={(e) => setSalario(mascararValor(e.target.value))}
                autoComplete="off"
              />
            </div>
          </div>

          <div className="alterar-salario__grupo alterar-salario__grupo--dia">
            <label htmlFor="alterar-salario-dia">Dia do recebimento</label>
            <input
              id="alterar-salario-dia"
              className={`alterar-salario__input ${
                diaComErro ? "alterar-salario__input--erro" : ""
              }`}
              type="text"
              inputMode="numeric"
              placeholder="Ex.: 5"
              value={dia}
              onChange={(e) => setDia(e.target.value.replace(/\D/g, "").slice(0, 2))}
              autoComplete="off"
            />
          </div>

          <button type="submit" className="alterar-salario__botao" disabled={!podeSalvar}>
            Salvar
          </button>
          <button
            type="button"
            className="alterar-salario__botao alterar-salario__botao--cancelar"
            onClick={onFechar}
          >
            Cancelar
          </button>
        </form>
      </div>
    </div>
  );
}