export const CATEGORIAS = [
  // ── Necessidades (meta: 50% da renda) ──────────────────────────────
  { id: "moradia",           nome: "Moradia",              grupo: "necessidade" },
  { id: "luz",               nome: "Luz",                  grupo: "necessidade" },
  { id: "agua",              nome: "Água",                 grupo: "necessidade" },
  { id: "internet_telefone", nome: "Internet e telefone",  grupo: "necessidade" },
  { id: "mercado",           nome: "Mercado",              grupo: "necessidade" },
  { id: "transporte",        nome: "Transporte",           grupo: "necessidade" },
  { id: "saude",             nome: "Saúde",                grupo: "necessidade" },
  { id: "educacao",          nome: "Educação",             grupo: "necessidade" },

  // ── Desejos (meta: 30% da renda) ───────────────────────────────────
  { id: "restaurante",       nome: "Restaurante e delivery", grupo: "desejo" },
  { id: "lazer",             nome: "Lazer",                grupo: "desejo" },
  { id: "compras",           nome: "Compras",              grupo: "desejo" },
  { id: "assinaturas",       nome: "Assinaturas",          grupo: "desejo" },
  { id: "outros",            nome: "Outros",               grupo: "desejo" },

  // ── Poupança (meta: 20% da renda) ──────────────────────────────────
  // Investimento não é lançamento comum — o dinheiro entra pelas metas.
  // Está aqui para a regra 50/30/20 contabilizar o total guardado nas metas.
  { id: "investimento",      nome: "Investimento",         grupo: "poupanca" },
];

/**
 * Retorna o objeto de uma categoria pelo id.
 * Retorna null se não encontrar.
 *
 * @param {string} id - Ex: "moradia"
 * @returns {{ id: string, nome: string, grupo: string }|null}
 */
export function buscarCategoria(id) {
  return CATEGORIAS.find((c) => c.id === id) ?? null;
}

/**
 * Retorna todas as categorias de um grupo específico.
 *
 * @param {"necessidade"|"desejo"|"poupanca"} grupo
 * @returns {Array}
 */
export function categoriasPorGrupo(grupo) {
  return CATEGORIAS.filter((c) => c.grupo === grupo);
}