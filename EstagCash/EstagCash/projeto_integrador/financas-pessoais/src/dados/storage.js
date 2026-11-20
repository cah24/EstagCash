/**
 * Carrega um valor salvo no localStorage.
 * Retorna null se a chave não existir (primeira vez que o app abre).
 *
 * @param {string} chave - Nome da chave (ex: "lancamentos")
 * @returns {any|null}
 */
export function carregar(chave) {
  try {
    const texto = localStorage.getItem(chave);
    if (texto === null) return null;
    return JSON.parse(texto);
  } catch {
    return null;
  }
}

/**
 * Salva um valor no localStorage.
 * O valor pode ser qualquer coisa: array, objeto, número, string.
 *
 * @param {string} chave - Nome da chave (ex: "lancamentos")
 * @param {any} valor - Dado a salvar
 */
export function salvar(chave, valor) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    console.error("Erro ao salvar no localStorage:", chave);
  }
}

/**
 * Remove um item do localStorage pela chave.
 * Útil para resetar os dados do app.
 *
 * @param {string} chave - Nome da chave a remover
 */
export function remover(chave) {
  try {
    localStorage.removeItem(chave);
  } catch {
    console.error("Erro ao remover do localStorage:", chave);
  }
}

// Chaves usadas no app — defina aqui para não escrever a string em vários lugares.
// Importem CHAVES onde precisarem salvar ou carregar.
export const CHAVES = {
  lancamentos:   "lancamentos",
  metas:         "metas",
  limites:       "limites",
  nomeUsuario:   "nomeUsuario",
  salario:       "salario",
  mesEntrada:    "mesEntrada",   // "AAAA-MM": mês em que o usuário entrou (fixo)
};