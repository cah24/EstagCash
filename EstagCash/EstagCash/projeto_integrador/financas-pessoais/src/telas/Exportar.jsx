// src/telas/Exportar.jsx
import { useState, useMemo } from "react";
import { ChevronDown, Download, Table } from "lucide-react";
import {
  filtrarLancamentos,
  formatarMoedaExibicao,
  gerarCSV,
  gerarJSON,
  baixarArquivo,
} from "../logica/exportar";
import NavBar from "../componentes/navBar";
import { CATEGORIAS as CATS } from "../dados/categorias";
import "../estilos/Exportar.css";

// ─── Constantes ────────────────────────────────────────────────────────────────

const CATEGORIAS_FILTRO = ["Todas", ...CATS.map((c) => c.nome ?? c)];

/** Retorna "AAAA-MM-DD" do primeiro dia do mês atual. */
function primeiroDiaDoMes() {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-01`;
}

/** Retorna "AAAA-MM-DD" do último dia do mês atual. */
function ultimoDiaDoMes() {
  const hoje = new Date();
  const ultimo = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
  return `${ultimo.getFullYear()}-${String(ultimo.getMonth() + 1).padStart(2, "0")}-${String(ultimo.getDate()).padStart(2, "0")}`;
}

/** Formata "AAAA-MM-DD" para "DD/MM/AAAA". */
function formatarData(dataISO) {
  if (!dataISO) return "";
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
}

/**
 * Normaliza o array de lançamentos do App para o formato que a lógica
 * de exportação espera: { id, nome, categoria, tipo, valor, data }
 *
 * O App guarda tudo num array único (CHAVES.lancamentos). Cada item já
 * tem subtipo ("entrada", "despesaFixa", "saida") e os campos do App.
 */
function normalizarLancamentos(lancamentos) {
  return lancamentos.map((l) => {
    const tipo =
      l.subtipo === "entrada" || l.tipo === "entrada" ? "Entrada" : "Saída";
    return {
      id:        l.id,
      nome:      l.nome ?? l.descricao ?? "",
      categoria: l.categoria ?? "",
      tipo,
      valor:     l.valor ?? 0,
      data:      l.data ?? "",
    };
  });
}

// ─── Componente ────────────────────────────────────────────────────────────────

export default function Exportar({
  telaAtiva = "exportar",
  lancamentos = [],
  onNavegar = () => {},
}) {
  const [dataInicio, setDataInicio] = useState(primeiroDiaDoMes);
  const [dataFim, setDataFim]       = useState(ultimoDiaDoMes);
  const [categoria, setCategoria]   = useState("Todas");

  const todosNormalizados = useMemo(
    () => normalizarLancamentos(lancamentos),
    [lancamentos]
  );

  const lancamentosFiltrados = useMemo(
    () => filtrarLancamentos(todosNormalizados, dataInicio, dataFim, categoria),
    [todosNormalizados, dataInicio, dataFim, categoria]
  );

  function handleExportarJSON() {
    const conteudo = gerarJSON(lancamentosFiltrados, dataInicio, dataFim, categoria);
    baixarArquivo(conteudo, "dados.json", "application/json");
  }

  function handleExportarCSV() {
    const conteudo = gerarCSV(lancamentosFiltrados);
    baixarArquivo(conteudo, "extrato.csv", "text/csv");
  }

  return (
    <div className="exportar-pagina">
      <NavBar telaAtiva={telaAtiva} onNavegar={onNavegar} />

      <main className="exportar-conteudo">

      {/* ── Cabeçalho ── */}
      <header className="exportar-cabecalho">
        <h1 className="exportar-titulo">Exportar Extrato</h1>
        <p className="exportar-subtitulo">
          Seus lançamentos organizados, prontos para levar com você.
        </p>
      </header>

      {/* ── Seção 1: Período e categoria ── */}
      <section className="exportar-card">
        <h2 className="exportar-secao-titulo">Período e categoria</h2>

        <div className="exportar-filtros">
          <div className="exportar-campo">
            <label htmlFor="dataInicio" className="exportar-label">De</label>
            <div className="exportar-input-wrapper">
              <input
                id="dataInicio"
                type="date"
                className="exportar-input"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
          </div>

          <div className="exportar-campo">
            <label htmlFor="dataFim" className="exportar-label">Até</label>
            <div className="exportar-input-wrapper">
              <input
                id="dataFim"
                type="date"
                className="exportar-input"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
          </div>

          <div className="exportar-campo exportar-campo--categoria">
            <label htmlFor="categoria" className="exportar-label">Categoria</label>
            <div className="exportar-input-wrapper exportar-input-wrapper--select">
              <select
                id="categoria"
                className="exportar-input exportar-select"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
              >
                {CATEGORIAS_FILTRO.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <ChevronDown className="exportar-chevron" size={16} aria-hidden="true" />
            </div>
          </div>
        </div>

        <p className="exportar-hint">
          Selecione o período e a categoria para exportar.
        </p>
      </section>

      {/* ── Seção 2: Pré-visualização ── */}
      <section className="exportar-card">
        <div className="exportar-previsualicao-header">
          <h2 className="exportar-secao-titulo">Pré-visualização</h2>
          {lancamentosFiltrados.length > 0 && (
            <span className="exportar-badge">
              {new Date(dataInicio + "T00:00:00").toLocaleDateString("pt-BR", {
                month: "long",
                year: "numeric",
              })}
            </span>
          )}
        </div>

        {lancamentosFiltrados.length === 0 ? (
          <p className="exportar-vazio">
            Nenhum lançamento encontrado para o período selecionado.
          </p>
        ) : (
          <div className="exportar-tabela-wrapper">
            <table className="exportar-tabela">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Descrição</th>
                  <th>Categoria</th>
                  <th>Tipo</th>
                  <th className="exportar-tabela-valor">Valor</th>
                </tr>
              </thead>
              <tbody>
                {lancamentosFiltrados.map((l, i) => (
                  <tr key={l.id ?? i} className={i % 2 === 0 ? "par" : "impar"}>
                    <td className="exportar-tabela-data">{formatarData(l.data)}</td>
                    <td className="exportar-tabela-descricao">{l.nome}</td>
                    <td className="exportar-tabela-categoria">{l.categoria}</td>
                    <td>
                      <span className={`exportar-tipo-badge exportar-tipo-badge--${l.tipo === "Entrada" ? "entrada" : "saida"}`}>
                        {l.tipo}
                      </span>
                    </td>
                    <td className={`exportar-tabela-valor exportar-tabela-valor--${l.tipo === "Entrada" ? "positivo" : "negativo"}`}>
                      {formatarMoedaExibicao(l.valor, l.tipo)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="exportar-hint exportar-hint--tabela">
          Exibindo {lancamentosFiltrados.length} lançamento
          {lancamentosFiltrados.length !== 1 ? "s" : ""} no período selecionado.
        </p>
      </section>

      {/* ── Seção 3: Botões de exportação ── */}
      <section className="exportar-card">
        <h2 className="exportar-secao-titulo">Escolha o formato</h2>

        <div className="exportar-botoes">
          <button
            className="exportar-btn exportar-btn--primario"
            onClick={handleExportarJSON}
            disabled={lancamentosFiltrados.length === 0}
          >
            <Download size={18} aria-hidden="true" />
            Exportar JSON
          </button>

          <button
            className="exportar-btn exportar-btn--secundario"
            onClick={handleExportarCSV}
            disabled={lancamentosFiltrados.length === 0}
          >
            <Table size={18} aria-hidden="true" />
            Exportar CSV
          </button>
        </div>

        <p className="exportar-instrucao">
          Para gerar o relatório completo, baixe o JSON e execute no terminal:{" "}
          <code>python relatorio.py</code>
        </p>
      </section>

      </main>
    </div>
  );
}