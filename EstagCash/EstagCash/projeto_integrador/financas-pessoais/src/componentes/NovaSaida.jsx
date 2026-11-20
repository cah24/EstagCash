import { useEffect, useRef, useState } from "react";
import { CATEGORIAS } from "../dados/categorias";
import SeletorData from "./SeletorData";
import "../estilos/NovaSaida.css";

const IconeSaida = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true">
    <path d="M7 7h10v10" />
    <path d="M7 17 17 7" />
  </svg>
);

const IconeFechar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true">
    <path d="m18 6-12 12M6 6l12 12" />
  </svg>
);

const IconeBaixo = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const hojeLocal = () => {
  const hoje = new Date();
  const ano  = hoje.getFullYear();
  const mes  = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia  = String(hoje.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
};

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

// Categorias disponíveis para saída: todas exceto "investimento"
// (investimento entra pelas metas, não por saída avulsa)
const CATS_SAIDA = CATEGORIAS.filter((c) => c.id !== "investimento");

export default function NovaSaida({
  aberto       = true,
  limiteMaximo = 50000,
  onFechar     = () => {},
  onConfirmar  = () => {},
}) {
  const [nome,          setNome]          = useState("");
  const [valor,         setValor]         = useState("");
  const [categoria,     setCategoria]     = useState(CATS_SAIDA[0]?.id ?? "");
  const [data,          setData]          = useState(hojeLocal);
  const [parcelas,      setParcelas]      = useState("");
  const [parcelaAtual,  setParcelaAtual]  = useState("1");
  const [erroTentativa, setErroTentativa] = useState(false);
  const campoNome = useRef(null);

  useEffect(() => {
    if (!aberto) return undefined;
    campoNome.current?.focus();
    const aoPressionar = (e) => { if (e.key === "Escape") onFechar(); };
    document.addEventListener("keydown", aoPressionar);
    return () => document.removeEventListener("keydown", aoPressionar);
  }, [aberto, onFechar]);

  if (!aberto) return null;

  const valorNumerico        = valorParaNumero(valor);
  const quantidadeParcelas   = parcelas === "" ? null : Number(parcelas);
  const numeroParcelaAtual   = Number(parcelaAtual);
  const acimaDoLimite        = valorNumerico > limiteMaximo;
  const parcelasInvalidas    = quantidadeParcelas !== null &&
    (!Number.isInteger(quantidadeParcelas) || quantidadeParcelas < 1);
  const parcelaAtualInvalida = !Number.isInteger(numeroParcelaAtual) ||
    numeroParcelaAtual < 1 ||
    (quantidadeParcelas !== null && Number.isInteger(quantidadeParcelas) &&
      numeroParcelaAtual > quantidadeParcelas);
  const dataInvalida = !data || Number.isNaN(Date.parse(`${data}T00:00:00`));

  const podeConfirmar =
    nome.trim() !== "" &&
    valorNumerico > 0 &&
    !acimaDoLimite &&
    !dataInvalida &&
    !parcelasInvalidas &&
    !parcelaAtualInvalida;

  const enviar = (e) => {
    e.preventDefault();
    if (!podeConfirmar) { setErroTentativa(true); return; }
    onConfirmar({
      tipo:         "saida",
      nome:         nome.trim(),
      valor:        valorNumerico,
      categoria,                    // ← id da categoria (ex: "mercado")
      data,
      parcelas:     quantidadeParcelas,
      parcelaAtual: numeroParcelaAtual,
    });
    onFechar();
  };

  return (
    <div className="nova-saida__overlay"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onFechar(); }}>
      <div className="nova-saida" role="dialog" aria-modal="true"
        aria-labelledby="nova-saida-titulo">

        <header className="nova-saida__topo">
          <span className="nova-saida__icone"><IconeSaida /></span>
          <button type="button" className="nova-saida__fechar"
            onClick={onFechar} aria-label="Fechar">
            <IconeFechar />
          </button>
        </header>

        <h2 id="nova-saida-titulo" className="nova-saida__titulo">Nova saída</h2>
        <p className="nova-saida__subtitulo">Registre um gasto e acompanhe seu mês.</p>

        <form className="nova-saida__form" onSubmit={enviar}>
          {/* Nome */}
          <div className="nova-saida__campo">
            <label htmlFor="saida-nome">Nome</label>
            <input id="saida-nome" ref={campoNome}
              className={`nova-saida__input ${erroTentativa && !nome.trim() ? "nova-saida__input--erro" : ""}`}
              type="text" placeholder="Ex: Mercado" value={nome}
              onChange={(e) => setNome(e.target.value)} autoComplete="off" />
          </div>

          {/* Valor */}
          <div className="nova-saida__campo">
            <label htmlFor="saida-valor">Valor Total</label>
            <div className={`nova-saida__valor ${acimaDoLimite || (erroTentativa && valorNumerico <= 0) ? "nova-saida__valor--erro" : ""}`}>
              <span className="nova-saida__moeda">R$</span>
              <input id="saida-valor" className="nova-saida__valor-input"
                type="text" inputMode="numeric" placeholder="0,00" value={valor}
                onChange={(e) => setValor(mascararValor(e.target.value))} autoComplete="off" />
            </div>
            {acimaDoLimite && (
              <p className="nova-saida__ajuda nova-saida__ajuda--erro">
                Valor acima do limite permitido de R$ {limiteMaximo.toLocaleString("pt-BR")},00.
              </p>
            )}
          </div>

          {/* Categoria — gerada dinamicamente de CATEGORIAS */}
          <div className="nova-saida__campo">
            <label htmlFor="saida-categoria">Categoria</label>
            <div className="nova-saida__select-wrapper">
              <select id="saida-categoria" className="nova-saida__select"
                value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                {CATS_SAIDA.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
              <span className="nova-saida__select-icone"><IconeBaixo /></span>
            </div>
          </div>

          {/* Data */}
          <div className="nova-saida__campo">
            <label htmlFor="saida-data">Data</label>
            <SeletorData id="saida-data" valor={data} onChange={setData}
              invalido={erroTentativa && dataInvalida} />
          </div>

          {/* Parcelas */}
          <div className="nova-saida__parcelamento">
            <div className="nova-saida__campo">
              <label htmlFor="saida-parcelas">Parcelas <span>(opcional)</span></label>
              <input id="saida-parcelas"
                className={`nova-saida__input ${parcelasInvalidas || (erroTentativa && parcelaAtualInvalida && parcelas !== "") ? "nova-saida__input--erro" : ""}`}
                type="number" min="1" step="1" value={parcelas}
                onChange={(e) => setParcelas(e.target.value)} />
            </div>
            <div className="nova-saida__campo">
              <label htmlFor="saida-parcela-atual">Parcela atual</label>
              <input id="saida-parcela-atual"
                className={`nova-saida__input ${(erroTentativa && parcelaAtualInvalida) || parcelasInvalidas ? "nova-saida__input--erro" : ""}`}
                type="number" min="1" step="1" value={parcelaAtual}
                onChange={(e) => setParcelaAtual(e.target.value)} />
            </div>
          </div>

          <p className="nova-saida__ajuda nova-saida__ajuda--parcelas">
            Vazio = à vista<br />Mostramos só a parcela do mês
          </p>
          {(parcelasInvalidas || parcelaAtualInvalida) && (
            <p className="nova-saida__ajuda nova-saida__ajuda--erro">
              Informe parcelas válidas e uma parcela atual dentro desse total.
            </p>
          )}

          <button type="submit" className="nova-saida__botao" disabled={!podeConfirmar}>
            Cadastrar
          </button>
        </form>
      </div>
    </div>
  );
}