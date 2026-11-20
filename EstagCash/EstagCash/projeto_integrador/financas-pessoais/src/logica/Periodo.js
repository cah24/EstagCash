import { carregar, salvar, CHAVES } from "../dados/storage.js";

export const MESES_A_FRENTE = 12;

const NOMES_MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

// ---------- Conversões ----------

const FORMATO_MES = /^\d{4}-(0[1-9]|1[0-2])$/;

export const mesValido = (mes) => typeof mes === "string" && FORMATO_MES.test(mes);

/** Date → "AAAA-MM" (no fuso local, não em UTC). */
export function mesDeData(data = new Date()) {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
}

/** "2026-11" → 24323 */
export function mesParaIndice(mes) {
  const [ano, m] = mes.split("-").map(Number);
  return ano * 12 + (m - 1);
}

/** 24323 → "2026-11" */
export function indiceParaMes(indice) {
  const ano = Math.floor(indice / 12);
  const mes = (indice % 12) + 1;
  return `${ano}-${String(mes).padStart(2, "0")}`;
}

/** "2026-11" → "Novembro de 2026" */
export function formatarMes(mes) {
  if (!mesValido(mes)) return "";
  const [ano, m] = mes.split("-");
  return `${NOMES_MESES[Number(m) - 1]} de ${ano}`;
}

/** Quantos dias tem o mês "AAAA-MM" (considera ano bissexto). */
export function diasNoMes(mes) {
  const [ano, m] = mes.split("-").map(Number);
  return new Date(ano, m, 0).getDate();
}

// ---------- A regra ----------

/**
 * Intervalo disponível nos seletores.
 * @param {string|null} mesEntrada  "AAAA-MM" em que o usuário entrou no sistema
 * @param {Date} hoje               injetável para teste; padrão = agora
 * @returns {{ inicio: string, fim: string }}  ambos "AAAA-MM"
 */
export function intervaloDeMeses(mesEntrada, hoje = new Date()) {
  const atual = mesDeData(hoje);
  const fim = indiceParaMes(mesParaIndice(atual) + MESES_A_FRENTE);

  // Entrada ausente/corrompida → usa o mês atual só para esta conta (nada é gravado).
  // Entrada "no futuro" (relógio do aparelho foi atrasado) → o mês atual continua
  // selecionável. O valor gravado NUNCA é alterado por aqui.
  let inicio = mesValido(mesEntrada) ? mesEntrada : atual;
  if (inicio > atual) inicio = atual;

  return { inicio, fim };
}

/** Todos os meses entre dois "AAAA-MM" (inclusive), do mais antigo ao mais novo. */
export function listarMesesEntre(inicio, fim) {
  const lista = [];
  for (let i = mesParaIndice(inicio); i <= mesParaIndice(fim); i++) {
    lista.push(indiceParaMes(i));
  }
  return lista;
}

/** Lista padrão de meses de qualquer seletor do sistema. */
export function listarMeses(mesEntrada, hoje = new Date()) {
  const { inicio, fim } = intervaloDeMeses(mesEntrada, hoje);
  return listarMesesEntre(inicio, fim);
}

// ---------- Mês de entrada (persistência) ----------

/**
 * Para quem já usava o app antes desta regra existir: o mês de entrada é o mais
 * antigo que aparece nos dados (data do lançamento ou mês em que foi criado),
 * limitado ao mês atual. Assim nada que já foi lançado fica fora do seletor.
 */
export function descobrirMesEntrada(lancamentos, hoje = new Date()) {
  let menor = mesDeData(hoje);

  for (const l of Array.isArray(lancamentos) ? lancamentos : []) {
    if (typeof l?.data === "string" && mesValido(l.data.slice(0, 7)) && l.data.slice(0, 7) < menor) {
      menor = l.data.slice(0, 7);
    }
    // o id dos lançamentos é Date.now(): serve de data de criação
    if (Number.isFinite(l?.id) && l.id > 0) {
      const criado = mesDeData(new Date(l.id));
      if (criado < menor) menor = criado;
    }
  }
  return menor;
}

/**
 * Devolve o mês de entrada gravado. Na primeira vez (nada gravado) define e grava:
 * usuário novo → mês atual; usuário antigo → ver descobrirMesEntrada.
 * Depois de gravado, nunca mais muda.
 */
export function obterMesEntrada(hoje = new Date()) {
  const salvo = carregar(CHAVES.mesEntrada);
  if (mesValido(salvo)) return salvo;

  const mes = descobrirMesEntrada(carregar(CHAVES.lancamentos), hoje);
  salvar(CHAVES.mesEntrada, mes);
  return mes;
}
