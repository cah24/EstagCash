// ─────────────────────────────────────────────
// AUXILIARES
// ─────────────────────────────────────────────

/**
 * Valor de um lançamento no mês.
 * Para saída parcelada: divide o valor total pelo número de parcelas.
 * Para todo o resto: devolve o valor direto.
 *
 * @param {object} lancamento
 * @returns {number}
 */
 export function valorNoMes(lancamento) {
  if (lancamento.tipo === "saida" && lancamento.parcelas > 1) {
    return lancamento.valor / lancamento.parcelas;
  }
  return lancamento.valor;
}

// ─────────────────────────────────────────────
// TOTAIS — usados pelo resumo e pelo saldo
// ─────────────────────────────────────────────

/**
 * Total que entrou no mês (salário + renda extra).
 *
 * @param {Array} lancamentosDoMes - Resultado de listarDoMes()
 * @returns {number}
 */
export function totalEntradas(lancamentosDoMes) {
  return lancamentosDoMes
    .filter((l) => l.tipo === "entrada")
    .reduce((soma, l) => soma + valorNoMes(l), 0);
}

/**
 * Total que saiu no mês.
 * Inclui: saídas avulsas + despesas fixas JÁ PAGAS no mês.
 *
 * @param {Array}  lancamentosDoMes
 * @param {string} mes - "AAAA-MM" (ex: "2026-11")
 * @returns {number}
 */
export function totalSaidas(lancamentosDoMes, mes) {
  return lancamentosDoMes
    .filter((l) => {
      if (l.tipo === "saida") return true;
      if (l.tipo === "despesa_fixa") return l.pagoNoMes?.[mes] === true;
      return false;
    })
    .reduce((soma, l) => soma + valorNoMes(l), 0);
}

/**
 * Total pendente no mês.
 * Inclui: despesas fixas ainda NÃO pagas no mês.
 *
 * @param {Array}  lancamentosDoMes
 * @param {string} mes - "AAAA-MM"
 * @returns {number}
 */
export function totalPendentes(lancamentosDoMes, mes) {
  return lancamentosDoMes
    .filter((l) => l.tipo === "despesa_fixa" && !l.pagoNoMes?.[mes])
    .reduce((soma, l) => soma + valorNoMes(l), 0);
}

/**
 * Total guardado nas metas no mês.
 * Soma todos os depósitos feitos nas metas, descontando as retiradas.
 * Recebe o array de metas (separado dos lançamentos).
 *
 * @param {Array}  metas - Array de metas com movimentos
 * @param {string} mes   - "AAAA-MM"
 * @returns {number}
 */
export function totalGuardado(metas, mes) {
  return metas.reduce((soma, meta) => {
    const movimentosDoMes = (meta.movimentos ?? []).filter((m) =>
      m.data?.startsWith(mes)
    );
    const depositos  = movimentosDoMes
      .filter((m) => m.tipo === "deposito")
      .reduce((s, m) => s + m.valor, 0);
    const retiradas  = movimentosDoMes
      .filter((m) => m.tipo === "retirada")
      .reduce((s, m) => s + m.valor, 0);
    return soma + depositos - retiradas;
  }, 0);
}

/**
 * Total gasto por categoria no mês.
 * Inclui saídas + despesas fixas (pagas ou pendentes).
 * Usado pelos limites por categoria e pela regra 50/30/20.
 *
 * @param {Array}  lancamentosDoMes
 * @returns {Object} - Ex: { moradia: 600, mercado: 300 }
 */
export function totalPorCategoria(lancamentosDoMes) {
  const totais = {};
  lancamentosDoMes.forEach((l) => {
    if (l.tipo !== "saida" && l.tipo !== "despesa_fixa") return;
    const cat = l.categoria ?? "outros";
    totais[cat] = (totais[cat] ?? 0) + valorNoMes(l);
  });
  return totais;
}

// ─────────────────────────────────────────────
// SALDO LIVRE
// ─────────────────────────────────────────────

/**
 * Saldo disponível do mês.
 * Fórmula: entradas - saídas - pendentes - guardado
 * O dinheiro guardado nas metas não está disponível.
 *
 * @param {Array}  lancamentosDoMes
 * @param {Array}  metas
 * @param {string} mes - "AAAA-MM"
 * @returns {number}
 */
export function calcularSaldo(lancamentosDoMes, metas, mes) {
  const entradas  = totalEntradas(lancamentosDoMes);
  const saidas    = totalSaidas(lancamentosDoMes, mes);
  const pendentes = totalPendentes(lancamentosDoMes, mes);
  const guardado  = totalGuardado(metas, mes);
  return entradas - saidas - pendentes - guardado;
}

// ─────────────────────────────────────────────
// REGRA 50/30/20
// ─────────────────────────────────────────────

/**
 * Calcula o quanto foi usado de cada grupo da regra 50/30/20.
 * Necessidades: 50% da renda | Desejos: 30% | Poupança: 20%
 *
 * @param {Array}  lancamentosDoMes
 * @param {Array}  metas
 * @param {string} mes      - "AAAA-MM"
 * @param {number} renda    - Renda mensal do usuário
 * @param {Array}  categorias - Lista de CATEGORIAS importada de categorias.js
 * @returns {{ necessidade: object, desejo: object, poupanca: object }}
 *
 * Cada grupo retorna:
 *   { referencia: number, usado: number, percentualUsado: number }
 */
export function calcularRegra502030(lancamentosDoMes, metas, mes, renda, categorias) {
  const porCategoria = totalPorCategoria(lancamentosDoMes);
  const guardadoMes  = totalGuardado(metas, mes);

  // Soma gasto por grupo
  const gastoPorGrupo = { necessidade: 0, desejo: 0, poupanca: 0 };

  Object.entries(porCategoria).forEach(([catId, valor]) => {
    const cat = categorias.find((c) => c.id === catId);
    if (!cat) return;
    gastoPorGrupo[cat.grupo] = (gastoPorGrupo[cat.grupo] ?? 0) + valor;
  });

  // Poupança = o que foi guardado nas metas no mês
  gastoPorGrupo.poupanca = guardadoMes;

  const referencias = { necessidade: renda * 0.5, desejo: renda * 0.3, poupanca: renda * 0.2 };

  const resultado = {};
  ["necessidade", "desejo", "poupanca"].forEach((grupo) => {
    const ref  = referencias[grupo];
    const usado = gastoPorGrupo[grupo] ?? 0;
    resultado[grupo] = {
      referencia:       ref,
      usado,
      percentualUsado:  renda > 0 ? (usado / renda) * 100 : 0,
    };
  });

  return resultado;
}