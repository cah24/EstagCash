/**
 * Filtra os lançamentos pelo período e pela categoria informados.
 *
 * @param {Array}  lancamentos  - Array de objetos de lançamento do app
 * @param {string} dataInicio   - "AAAA-MM-DD"
 * @param {string} dataFim      - "AAAA-MM-DD"
 * @param {string} categoria    - Nome da categoria ou "Todas"
 * @returns {Array} Lançamentos filtrados, ordenados do mais recente ao mais antigo
 */
export function filtrarLancamentos(lancamentos, dataInicio, dataFim, categoria) {
  if (!Array.isArray(lancamentos)) return [];

  return lancamentos
    .filter((l) => {
      const dentroDoperiodo = l.data >= dataInicio && l.data <= dataFim;
      const dentroDaCategoria =
        categoria === "Todas" || l.categoria === categoria;
      return dentroDoperiodo && dentroDaCategoria;
    })
    .sort((a, b) => b.data.localeCompare(a.data));
}

/**
 * Formata um valor numérico como moeda brasileira para exibição.
 * Ex.: 1035 → "+ R$ 1.035,00"  |  86.4 → "– R$ 86,40"
 *
 * @param {number}  valor  - Valor numérico
 * @param {string}  tipo   - "Entrada" ou "Saída"
 * @returns {string}
 */
export function formatarMoedaExibicao(valor, tipo) {
  const sinal = tipo === "Entrada" ? "+ " : "– ";
  const formatado = Number(valor).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${sinal}R$ ${formatado}`;
}

/**
 * Gera uma string CSV a partir dos lançamentos filtrados.
 * Separador: vírgula. Valores com vírgula são entre aspas.
 *
 * @param {Array} lancamentos - Resultado de filtrarLancamentos()
 * @returns {string} Conteúdo do arquivo CSV
 */
export function gerarCSV(lancamentos) {
  const cabecalho = ["Data", "Descrição", "Categoria", "Tipo", "Valor (R$)"];

  const linhas = lancamentos.map((l) => {
    const valor = Number(l.valor).toFixed(2).replace(".", ",");
    // Envolve campos que possam ter vírgula em aspas duplas
    const descricao = `"${String(l.nome ?? l.descricao ?? "").replace(/"/g, '""')}"`;
    const categoria = `"${String(l.categoria ?? "").replace(/"/g, '""')}"`;
    return [l.data, descricao, categoria, l.tipo, valor].join(",");
  });

  return [cabecalho.join(","), ...linhas].join("\n");
}

/**
 * Gera um objeto JSON pronto para download, com metadados e os lançamentos.
 *
 * @param {Array}  lancamentos - Resultado de filtrarLancamentos()
 * @param {string} dataInicio
 * @param {string} dataFim
 * @param {string} categoria
 * @returns {string} JSON formatado (string)
 */
export function gerarJSON(lancamentos, dataInicio, dataFim, categoria) {
  const payload = {
    exportadoEm: new Date().toISOString(),
    filtros: { dataInicio, dataFim, categoria },
    totalLancamentos: lancamentos.length,
    lancamentos,
  };
  return JSON.stringify(payload, null, 2);
}

/**
 * Dispara o download de um arquivo no navegador.
 *
 * @param {string} conteudo   - Conteúdo do arquivo
 * @param {string} nomeArquivo - Ex.: "extrato.csv" ou "dados.json"
 * @param {string} tipo       - MIME type. Ex.: "text/csv" ou "application/json"
 */
export function baixarArquivo(conteudo, nomeArquivo, tipo) {
  const blob = new Blob([conteudo], { type: `${tipo};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}