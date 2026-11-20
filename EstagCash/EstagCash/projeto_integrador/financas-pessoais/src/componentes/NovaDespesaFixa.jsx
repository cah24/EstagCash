import { useEffect, useRef, useState } from "react";
import { CATEGORIAS } from "../dados/categorias";
import "../estilos/NovaDespesaFixa.css";

const IconeRelogio = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true">
    <path d="M16 14v2.2l1.6 1" />
    <path d="M16 2v4" />
    <path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5" />
    <path d="M3 10h5" />
    <path d="M8 2v4" />
    <circle cx="16" cy="16" r="6" />
  </svg>
);

const IconeFechar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconeBaixo = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const mascararValor = (texto) => {
  const digitos = texto.replace(/\D/g, "").slice(0, 12);
  if (!digitos) return "";
  return (parseInt(digitos, 10) / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const valorParaNumero = (texto) =>
  texto ? parseFloat(texto.replace(/\./g, "").replace(",", ".")) : 0;

// Despesa fixa faz sentido só para necessidades (aluguel, luz, água...)
// mas deixamos todas disponíveis exceto "investimento"
const CATS_DESPESA_FIXA = CATEGORIAS.filter((c) => c.id !== "investimento");

export default function NovaDespesaFixaModal({
  aberto       = true,
  limiteMaximo = 50000,
  onFechar     = () => {},
  onConfirmar  = () => {},
}) {
  const [nome,          setNome]          = useState("");
  const [valor,         setValor]         = useState("");
  const [categoria,     setCategoria]     = useState(CATS_DESPESA_FIXA[0]?.id ?? "");
  const [diaVencimento, setDiaVencimento] = useState("");
  const [erroTentativa, setErroTentativa] = useState(false);
  const campoNome = useRef(null);

  useEffect(() => {
    if (!aberto) return;
    campoNome.current?.focus();
    const aoPressionar = (e) => { if (e.key === "Escape") onFechar(); };
    document.addEventListener("keydown", aoPressionar);
    return () => document.removeEventListener("keydown", aoPressionar);
  }, [aberto, onFechar]);

  if (!aberto) return null;

  const valorNumerico = valorParaNumero(valor);
  const diaNumerico   = parseInt(diaVencimento, 10);
  const acimaDoLimite = valorNumerico > limiteMaximo;
  const diaInvalido   = diaVencimento !== "" &&
    (isNaN(diaNumerico) || diaNumerico < 1 || diaNumerico > 31);
  const camposPreenchidos =
    nome.trim() !== "" && valor.trim() !== "" && diaVencimento.trim() !== "";
  const podeConfirmar =
    camposPreenchidos && valorNumerico > 0 && !acimaDoLimite && !diaInvalido;

  const enviar = (e) => {
    e.preventDefault();
    if (!podeConfirmar) { setErroTentativa(true); return; }
    onConfirmar({
      nome:         nome.trim(),
      valor:        valorNumerico,
      categoria,                    // ← id da categoria (ex: "moradia")
      diaVencimento: diaNumerico,
    });
    onFechar();
  };

  return (
    <div className="despesa-fixa__overlay"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onFechar(); }}>
      <div className="despesa-fixa" role="dialog" aria-modal="true"
        aria-labelledby="despesa-fixa-titulo">

        <header className="despesa-fixa__topo">
          <span className="despesa-fixa__icone"><IconeRelogio /></span>
          <button type="button" className="despesa-fixa__fechar"
            onClick={onFechar} aria-label="Fechar">
            <IconeFechar />
          </button>
        </header>

        <h2 id="despesa-fixa-titulo" className="despesa-fixa__titulo">
          Nova despesa fixa
        </h2>
        <p className="despesa-fixa__subtitulo">Deixe as contas do mês no seu radar.</p>

        <form className="despesa-fixa__form" onSubmit={enviar}>
          {/* Nome */}
          <div className="despesa-fixa__campo">
            <label htmlFor="despesa-nome">Nome</label>
            <input id="despesa-nome" ref={campoNome}
              className={`despesa-fixa__input ${erroTentativa && !nome.trim() ? "despesa-fixa__input--erro" : ""}`}
              type="text" placeholder="Ex: Aluguel" value={nome}
              onChange={(e) => setNome(e.target.value)} autoComplete="off" />
          </div>

          {/* Valor */}
          <div className="despesa-fixa__campo">
            <label htmlFor="despesa-valor">Valor</label>
            <div className={`despesa-fixa__valor ${acimaDoLimite || (erroTentativa && (!valor || valorNumerico === 0)) ? "despesa-fixa__valor--erro" : ""}`}>
              <span className="despesa-fixa__moeda">R$</span>
              <input id="despesa-valor" className="despesa-fixa__valor-input"
                type="text" inputMode="numeric" placeholder="0,00" value={valor}
                onChange={(e) => setValor(mascararValor(e.target.value))} autoComplete="off" />
            </div>
            {acimaDoLimite && (
              <p className="despesa-fixa__ajuda despesa-fixa__ajuda--erro">
                Valor acima do limite permitido de R$ {limiteMaximo.toLocaleString("pt-BR")},00
              </p>
            )}
          </div>

          {/* Categoria — gerada dinamicamente de CATEGORIAS */}
          <div className="despesa-fixa__campo">
            <label htmlFor="despesa-categoria">Categoria</label>
            <div className="despesa-fixa__select-wrapper">
              <select id="despesa-categoria" className="despesa-fixa__select"
                value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                {CATS_DESPESA_FIXA.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
              <span className="despesa-fixa__select-icone"><IconeBaixo /></span>
            </div>
          </div>

          {/* Dia do vencimento */}
          <div className="despesa-fixa__campo">
            <label htmlFor="despesa-dia">Dia do vencimento (1 a 31)</label>
            <input id="despesa-dia"
              className={`despesa-fixa__input ${diaInvalido || (erroTentativa && !diaVencimento) ? "despesa-fixa__input--erro" : ""}`}
              type="number" min="1" max="31" placeholder="10"
              value={diaVencimento} onChange={(e) => setDiaVencimento(e.target.value)} />
            {diaInvalido ? (
              <p className="despesa-fixa__ajuda despesa-fixa__ajuda--erro">
                Informe um dia válido entre 1 e 31.
              </p>
            ) : (
              <p className="despesa-fixa__ajuda">Aparece todo mês até você encerrar</p>
            )}
          </div>

          <button type="submit" className="despesa-fixa__botao" disabled={!podeConfirmar}>
            Cadastrar
          </button>
        </form>
      </div>
    </div>
  );
}