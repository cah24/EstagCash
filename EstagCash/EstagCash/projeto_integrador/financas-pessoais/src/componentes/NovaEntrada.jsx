import { useEffect, useRef, useState } from "react";
import SeletorData from "./SeletorData";
import "../estilos/NovaEntrada.css";

const IconeEntrada = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true">
    <line x1="7" y1="17" x2="17" y2="7" />
    <polyline points="7 7 17 7 17 17" />
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

const hojeLocal = () => {
  const hoje = new Date();
  const ano  = hoje.getFullYear();
  const mes  = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia  = String(hoje.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
};

export default function NovaEntradaModal({
  aberto       = true,
  limiteMaximo = 50000,
  onFechar     = () => {},
  onConfirmar  = () => {},
}) {
  const [tipoEntrada,    setTipoEntrada]    = useState("renda_extra");
  const [nome,           setNome]           = useState("");
  const [valor,          setValor]          = useState("");
  const [data,           setData]           = useState(hojeLocal);
  const [erroTentativa,  setErroTentativa]  = useState(false);
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
  const dataInvalida  = !data || Number.isNaN(Date.parse(`${data}T00:00:00`));
  const acimaDoLimite = valorNumerico > limiteMaximo;
  const podeConfirmar =
    nome.trim() !== "" && valorNumerico > 0 && !acimaDoLimite && !dataInvalida;

  const enviar = (e) => {
    e.preventDefault();
    if (!podeConfirmar) { setErroTentativa(true); return; }
    onConfirmar({
      tipoEntrada,          // "renda_extra" | "outros"
      nome: nome.trim(),
      valor: valorNumerico,
      diaRecebimento: null, // não usado mais, mantido para compatibilidade
      data,                 // "AAAA-MM-DD"
    });
    onFechar();
  };

  return (
    <div className="nova-entrada__overlay"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onFechar(); }}>
      <div className="nova-entrada" role="dialog" aria-modal="true"
        aria-labelledby="nova-entrada-titulo">

        <header className="nova-entrada__topo">
          <span className="nova-entrada__icone"><IconeEntrada /></span>
          <button type="button" className="nova-entrada__fechar"
            onClick={onFechar} aria-label="Fechar">
            <IconeFechar />
          </button>
        </header>

        <h2 id="nova-entrada-titulo" className="nova-entrada__titulo">
          Nova entrada
        </h2>
        <p className="nova-entrada__subtitulo">
          Mais um passo para organizar seu dinheiro.
        </p>

        <form className="nova-entrada__form" onSubmit={enviar}>
          {/* Tipo */}
          <div className="nova-entrada__campo">
            <label>Tipo de entrada</label>
            <div className="nova-entrada__toggle">
              <button type="button"
                className={`nova-entrada__toggle-btn ${tipoEntrada === "renda_extra" ? "nova-entrada__toggle-btn--ativo" : ""}`}
                onClick={() => setTipoEntrada("renda_extra")}>
                Renda extra
              </button>
              <button type="button"
                className={`nova-entrada__toggle-btn ${tipoEntrada === "outros" ? "nova-entrada__toggle-btn--ativo" : ""}`}
                onClick={() => setTipoEntrada("outros")}>
                Outros
              </button>
            </div>
          </div>

          {/* Nome */}
          <div className="nova-entrada__campo">
            <label htmlFor="entrada-nome">Nome</label>
            <input id="entrada-nome" ref={campoNome}
              className={`nova-entrada__input ${erroTentativa && !nome.trim() ? "nova-entrada__input--erro" : ""}`}
              type="text" placeholder="Ex: Freelance de design" value={nome}
              onChange={(e) => setNome(e.target.value)} autoComplete="off" />
          </div>

          {/* Valor */}
          <div className="nova-entrada__campo">
            <label htmlFor="entrada-valor">Valor</label>
            <div className={`nova-entrada__valor ${acimaDoLimite || (erroTentativa && valorNumerico <= 0) ? "nova-entrada__valor--erro" : ""}`}>
              <span className="nova-entrada__moeda">R$</span>
              <input id="entrada-valor" className="nova-entrada__valor-input"
                type="text" inputMode="numeric" placeholder="0,00" value={valor}
                onChange={(e) => setValor(mascararValor(e.target.value))}
                autoComplete="off" />
            </div>
            {acimaDoLimite && (
              <p className="nova-entrada__ajuda nova-entrada__ajuda--erro">
                Valor acima do limite permitido de R$ {limiteMaximo.toLocaleString("pt-BR")},00
              </p>
            )}
          </div>

          {/* Data */}
          <div className="nova-entrada__campo">
            <label htmlFor="entrada-data">Data do recebimento</label>
            <SeletorData id="entrada-data" valor={data} onChange={setData}
              invalido={erroTentativa && dataInvalida} />
          </div>

          <button type="submit" className="nova-entrada__botao" disabled={!podeConfirmar}>
            Cadastrar
          </button>
        </form>
      </div>
    </div>
  );
}