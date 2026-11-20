const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];
const MESES_CURTOS = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

export function indiceDoMesAtual() {
  const hoje = new Date();
  return hoje.getFullYear() * 12 + hoje.getMonth();
}

const capitalizar = (t) => t.charAt(0).toUpperCase() + t.slice(1);

// 2027*12 + 3 -> "Abril de 2027"
export function rotuloMes(indice) {
  return `${capitalizar(MESES[indice % 12])} de ${Math.floor(indice / 12)}`;
}

// -> "abr 2027"
export function rotuloMesCurto(indice) {
  return `${MESES_CURTOS[indice % 12]} ${Math.floor(indice / 12)}`;
}

// -> "abril"
export function nomeMes(indice) {
  return MESES[indice % 12];
}

// ---------- Formatação ----------

export function formatarNumero(valor) {
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// 1800 -> "R$ 1.800,00" | -1800 -> "−R$ 1.800,00"
export function formatarMoeda(valor) {
  const sinal = valor < 0 ? "−" : "";
  return `${sinal}R$ ${formatarNumero(Math.abs(valor))}`;
}

// ---------- Cenários ----------

export const CENARIOS = [
  { chave: "otimista", nome: "Otimista" },
  { chave: "realista", nome: "Realista" },
  { chave: "pessimista", nome: "Pessimista" },
];

const arredondar = (n) => Math.round(n * 100) / 100;

/**
 * Evolução do saldo, mês a mês.
 * Posição 0 = mês em que o estágio acaba (saldo inicial = reserva).
 * Todo mês seguinte: saldo - despesas, e soma o salário quando a nova renda já chegou.
 */
export function calcularSaldos({ reserva, despesas, salario, mesesSemRenda, pontos }) {
  const saldos = [arredondar(reserva)];
  for (let i = 1; i < pontos; i++) {
    const renda = i > mesesSemRenda ? salario : 0;
    saldos.push(arredondar(saldos[i - 1] - despesas + renda));
  }
  return saldos;
}

/**
 * Roda os três cenários e devolve tudo que a tela precisa.
 * fimIdx / refIdx são índices de mês (ver acima).
 */
export function simular({ reserva, despesas, salario, mesesSemRenda, fimIdx, refIdx }) {
  const meses = {
    otimista: Math.max(1, mesesSemRenda - 1),
    realista: mesesSemRenda,
    pessimista: mesesSemRenda * 2,
  };
  const pontos = Math.max(5, meses.pessimista + 1);
  const mesesAteFim = Math.max(1, fimIdx - refIdx + 1); // inclui o mês final

  const cenarios = {};
  for (const { chave } of CENARIOS) {
    const saldos = calcularSaldos({
      reserva,
      despesas,
      salario,
      mesesSemRenda: meses[chave],
      pontos,
    });
    const piorSaldo = Math.min(...saldos);
    const falta = piorSaldo < 0 ? Math.abs(piorSaldo) : 0;
    cenarios[chave] = {
      mesesSemRenda: meses[chave],
      saldos,
      piorSaldo,
      indicePior: saldos.indexOf(piorSaldo),
      falta,
      guardarPorMes: Math.ceil((falta / mesesAteFim) * 100) / 100,
    };
  }

  return {
    cenarios,
    pontos,
    mesesAteFim,
    // quantos meses de despesas a reserva cobre (0,8 = menos de um mês)
    autonomia: despesas > 0 ? reserva / despesas : Infinity,
    salarioCobreDespesas: salario >= despesas,
  };
}

// ---------- Integração com a reserva de emergência ----------
// A reserva é guardada pelo App.jsx como uma lista de movimentos
// ({ tipo: "deposito" | "retirada", valor }) em localStorage, na chave abaixo.
// O valor atual é a soma dos depósitos menos as retiradas. Sem dados, é 0.

const CHAVE_RESERVA_MOVS = "estagCash:reserva-movimentos";
const CHAVE_PREMISSAS = "estagCash:posEstagio";

export function lerReserva() {
  try {
    const movimentos = JSON.parse(localStorage.getItem(CHAVE_RESERVA_MOVS));
    if (!Array.isArray(movimentos)) return 0;
    const total = movimentos.reduce(
      (soma, m) => soma + (m.tipo === "deposito" ? m.valor : -m.valor),
      0
    );
    const arredondado = Math.round(total * 100) / 100;
    return Number.isFinite(arredondado) && arredondado >= 0 ? arredondado : 0;
  } catch {
    return 0;
  }
}

export function lerPremissas() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_PREMISSAS)) || null;
  } catch {
    return null;
  }
}

export function salvarPremissas(premissas) {
  try {
    localStorage.setItem(CHAVE_PREMISSAS, JSON.stringify(premissas));
  } catch {
    /* sem localStorage: segue sem salvar */
  }
}