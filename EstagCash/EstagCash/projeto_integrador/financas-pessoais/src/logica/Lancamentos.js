
// ─────────────────────────────────────────────
// CRIADORES — cada função monta um objeto novo
// ─────────────────────────────────────────────

/**
 * Cria uma entrada de salário ou renda extra.
 *
 * subtipo "salario"     → recorrente, usa diaRecebimento para saber quando entra
 * subtipo "renda_extra" → avulsa, usa data de quando foi recebida
 *
 * @param {"salario"|"renda_extra"} subtipo
 * @param {string}  nome           - Ex: "Bolsa de estágio"
 * @param {number}  valor          - Ex: 1800.00
 * @param {number}  diaRecebimento - 1 a 31 (obrigatório para salário)
 * @param {string}  data           - "AAAA-MM-DD" (obrigatório para renda extra)
 * @returns {object}
 */
export function criarEntrada(subtipo, nome, valor, diaRecebimento, data) {
  return {
    id:             Date.now(),
    tipo:           "entrada",
    subtipo,        // "salario" | "renda_extra"
    nome,
    valor,
    diaRecebimento: subtipo === "salario" ? diaRecebimento : null,
    data: subtipo !== "salario" ? data : null,
  };
}

/**
 * Cria uma despesa fixa (aluguel, internet, etc.).
 * Aparece todo mês até ser encerrada.
 * O campo pagoNoMes registra em quais meses já foi marcada como paga.
 *
 * @param {string} nome       - Ex: "Aluguel"
 * @param {number} valor      - Ex: 600.00
 * @param {string} categoria  - id da categoria (ex: "moradia")
 * @param {number} diaVencimento - 1 a 31
 * @returns {object}
 */
export function criarDespesaFixa(nome, valor, categoria, diaVencimento) {
  return {
    id:            Date.now(),
    tipo:          "despesa_fixa",
    nome,
    valor,
    categoria,
    diaVencimento,
    encerrada:     false,  // true quando o usuário clicar em "Encerrar"
    pagoNoMes:     {},     // ex: { "2026-11": true, "2026-12": true }
  };
}

/**
 * Cria uma saída (gasto do dia a dia).
 * Parcelas: se parcelas = 1, é à vista.
 * Só a parcela do mês aparece no extrato — sem lançamentos futuros.
 *
 * @param {string} nome          - Ex: "Mercado"
 * @param {number} valor         - Valor TOTAL (ex: 300.00 para compra à vista)
 * @param {string} categoria     - id da categoria (ex: "mercado")
 * @param {string} data          - "AAAA-MM-DD"
 * @param {number} parcelas      - Número total de parcelas (mínimo 1)
 * @param {number} parcelaAtual  - Parcela sendo lançada (padrão 1)
 * @returns {object}
 */
export function criarSaida(nome, valor, categoria, data, parcelas = 1, parcelaAtual = 1) {
  return {
    id:           Date.now(),
    tipo:         "saida",
    nome,
    valor,        // valor total — o valor da parcela é calculado na hora de exibir
    categoria,
    data,         // "AAAA-MM-DD"
    parcelas,
    parcelaAtual,
  };
}

// ─────────────────────────────────────────────
// LISTAGEM — filtra lançamentos de um mês
// ─────────────────────────────────────────────

/**
 * Retorna todos os lançamentos que pertencem a um mês.
 *
 * Regras (Opção A):
 * - Saída e renda extra: pertencem ao mês se o campo "data" começa com o mês
 * - Salário: entra sempre no mês (recorrente), a menos que tenha sido removido
 * - Despesa fixa: entra sempre no mês, a menos que esteja encerrada
 *
 * @param {Array}  lancamentos - Array com todos os lançamentos salvos
 * @param {string} mes         - Formato "AAAA-MM" (ex: "2026-11")
 * @returns {Array}
 */
export function listarDoMes(lancamentos, mes) {
  return lancamentos.filter((l) => {
    if (l.tipo === "entrada") {
      if (l.subtipo === "salario") return true;
      return l.data?.startsWith(mes);
    }

    if (l.tipo === "despesa_fixa") {
      return !l.encerrada;  // aparece todo mês enquanto não encerrada
    }

    if (l.tipo === "saida") {
      return l.data?.startsWith(mes);  // só no mês da data
    }

    return false;
  });
}

// ─────────────────────────────────────────────
// AÇÕES — modificam um lançamento existente
// ─────────────────────────────────────────────

/**
 * Marca uma despesa fixa como paga em um mês específico.
 * Devolve um novo array (não muda o original).
 *
 * @param {Array}  lancamentos - Array com todos os lançamentos
 * @param {number} id          - id da despesa fixa
 * @param {string} mes         - "AAAA-MM"
 * @returns {Array}
 */
export function marcarDespesaFixaPaga(lancamentos, id, mes) {
  return lancamentos.map((l) => {
    if (l.id !== id || l.tipo !== "despesa_fixa") return l;
    return {
      ...l,
      pagoNoMes: { ...l.pagoNoMes, [mes]: true },
    };
  });
}

/**
 * Encerra uma despesa fixa (não aparece mais nos meses seguintes).
 * Devolve um novo array (não muda o original).
 *
 * @param {Array}  lancamentos
 * @param {number} id
 * @returns {Array}
 */
export function encerrarDespesaFixa(lancamentos, id) {
  return lancamentos.map((l) =>
    l.id === id && l.tipo === "despesa_fixa" ? { ...l, encerrada: true } : l
  );
}

/**
 * Remove um lançamento pelo id.
 * Devolve um novo array (não muda o original).
 *
 * @param {Array}  lancamentos
 * @param {number} id
 * @returns {Array}
 */
export function removerLancamento(lancamentos, id) {
  return lancamentos.filter((l) => l.id !== id);
}

/**
 * Define o salário: se já existe uma entrada de salário, atualiza valor e dia;
 * se não existe, cria uma nova. Devolve um novo array.
 */
export function definirSalario(lancamentos, valor, diaRecebimento, nome = "Salário") {
  const existe = lancamentos.some(
    (l) => l.tipo === "entrada" && l.subtipo === "salario"
  );

  if (!existe) {
    return [...lancamentos, criarEntrada("salario", nome, valor, diaRecebimento, null)];
  }

  let atualizado = false;
  return lancamentos.map((l) => {
    if (atualizado || l.tipo !== "entrada" || l.subtipo !== "salario") return l;
    atualizado = true;
    return { ...l, valor, diaRecebimento };
  });
}