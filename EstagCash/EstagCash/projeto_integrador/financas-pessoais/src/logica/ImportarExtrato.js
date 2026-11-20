import { criarEntrada, criarSaida } from "./Lancamentos";
import { PALAVRAS_CHAVE } from "../dados/palavrasChave";

// Entradas não têm categoria no app (criarEntrada não recebe uma).
// Este rótulo existe só para mostrar na prévia.
export const CATEGORIA_ENTRADA = { id: "transferencias", nome: "Transferências" };

// ─────────────────────────────────────────────
// TEXTO
// ─────────────────────────────────────────────

/** "Café *Pão  de Açúcar" -> "CAFE PAO DE ACUCAR" */
export function normalizarTexto(texto = "") {
  return String(texto)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
}

// ─────────────────────────────────────────────
// ARQUIVO -> LINHAS
// ─────────────────────────────────────────────

export function decodificarArquivo(buffer) {
  let texto;
  try {
    texto = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    texto = new TextDecoder("windows-1252").decode(buffer);
  }
  return texto.replace(/^\uFEFF/, "");
}

function contarForaDeAspas(linha, separador) {
  let total = 0;
  let dentro = false;
  for (const c of linha) {
    if (c === '"') dentro = !dentro;
    else if (c === separador && !dentro) total++;
  }
  return total;
}

/** Escolhe entre ";", "," e tab, olhando qual aparece de forma mais regular nas linhas. */
export function detectarSeparador(texto) {
  const linhas = texto.split(/\r?\n/).filter((l) => l.trim() !== "").slice(0, 30);
  let melhor = ";";
  let melhorPontos = -1;

  for (const separador of [";", ",", "\t"]) {
    const contagens = linhas
      .map((l) => contarForaDeAspas(l, separador))
      .filter((n) => n >= 2); // precisa de pelo menos 3 colunas
    if (contagens.length === 0) continue;

    const frequencia = {};
    contagens.forEach((n) => (frequencia[n] = (frequencia[n] ?? 0) + 1));
    const pontos = Math.max(...Object.values(frequencia));
    if (pontos > melhorPontos) {
      melhor = separador;
      melhorPontos = pontos;
    }
  }
  return melhor;
}

/** Lê o CSV (aceita campos entre aspas e quebras de linha \n ou \r\n). */
export function lerCSV(texto, separador) {
  const linhas = [];
  let linha = [];
  let campo = "";
  let dentroDeAspas = false;

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];

    if (dentroDeAspas) {
      if (c === '"') {
        if (texto[i + 1] === '"') {
          campo += '"';
          i++;
        } else {
          dentroDeAspas = false;
        }
      } else {
        campo += c;
      }
    } else if (c === '"') {
      dentroDeAspas = true;
    } else if (c === separador) {
      linha.push(campo);
      campo = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && texto[i + 1] === "\n") i++;
      linha.push(campo);
      campo = "";
      linhas.push(linha);
      linha = [];
    } else {
      campo += c;
    }
  }
  if (campo !== "" || linha.length > 0) {
    linha.push(campo);
    linhas.push(linha);
  }

  return linhas
    .map((l) => l.map((x) => x.trim()))
    .filter((l) => l.some((x) => x !== ""));
}

// ─────────────────────────────────────────────
// DATA E VALOR (formatos pt-BR)
// ─────────────────────────────────────────────

const doisDigitos = (n) => String(n).padStart(2, "0");

/**
 * Converte a data do banco para "AAAA-MM-DD". Devolve null se não entender.
 * Aceita: 12/11/2026, 12/11/26, 12-11-2026, 12.11.2026, 2026-11-12 (com hora ou não)
 * e 12/11 (sem ano: usa anoPadrao).
 */
export function converterData(texto, anoPadrao) {
  const t = String(texto ?? "").trim();
  let dia, mes, ano, m;

  if ((m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/))) {
    ano = +m[1]; mes = +m[2]; dia = +m[3];
  } else if ((m = t.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4}|\d{2})(?!\d)/))) {
    dia = +m[1]; mes = +m[2]; ano = +m[3];
    if (m[3].length === 2) ano += 2000;
  } else if ((m = t.match(/^(\d{1,2})[/.-](\d{1,2})$/))) {
    dia = +m[1]; mes = +m[2]; ano = anoPadrao;
  } else {
    return null;
  }

  const data = new Date(ano, mes - 1, dia);
  const valida =
    data.getFullYear() === ano && data.getMonth() === mes - 1 && data.getDate() === dia;
  return valida ? `${ano}-${doisDigitos(mes)}-${doisDigitos(dia)}` : null;
}

/**
 * Converte o valor do banco para número (negativo = saída). Devolve null se não entender.
 * Aceita: -42,90 | 1.234,56 | R$ 42,90 | (42,90) | 42,90- | 42,90 D | 1,234.56 | 42.90
 */
export function converterValor(texto) {
  let t = String(texto ?? "").replace(/[\s\u00a0]/g, "").replace(/R\$/gi, "");
  if (!t) return null;

  let negativo = false;

  if (/^\(.*\)$/.test(t)) {
    negativo = true;
    t = t.slice(1, -1);
  }
  if (/d$/i.test(t)) { negativo = true; t = t.slice(0, -1); }   // D = débito
  else if (/c$/i.test(t)) { t = t.slice(0, -1); }               // C = crédito
  if (/^[-−–]/.test(t)) { negativo = true; t = t.slice(1); }
  else if (t.startsWith("+")) { t = t.slice(1); }
  if (/[-−–]$/.test(t)) { negativo = true; t = t.slice(0, -1); }

  if (!/^[\d.,]+$/.test(t)) return null;

  const ultimoPonto = t.lastIndexOf(".");
  const ultimaVirgula = t.lastIndexOf(",");

  if (ultimoPonto >= 0 && ultimaVirgula >= 0) {
    // os dois aparecem: o que vier por último é o decimal
    if (ultimaVirgula > ultimoPonto) t = t.replace(/\./g, "").replace(",", ".");
    else t = t.replace(/,/g, "");
  } else if (ultimaVirgula >= 0) {
    // só vírgula: decimal (pt-BR), a não ser que se repita
    t = (t.match(/,/g) || []).length > 1 ? t.replace(/,/g, "") : t.replace(",", ".");
  } else if (ultimoPonto >= 0) {
    // só ponto: "1.234" e "1.234.567" são milhar; "42.90" é decimal
    const milhar = /^\d{1,3}(\.\d{3})+$/.test(t);
    if (milhar) t = t.replace(/\./g, "");
  }

  const numero = Number(t);
  if (!Number.isFinite(numero)) return null;
  const arredondado = Math.round(numero * 100) / 100;
  return negativo ? -arredondado : arredondado;
}

// ─────────────────────────────────────────────
// CABEÇALHO E COLUNAS
// ─────────────────────────────────────────────

/**
 * Acha a linha do cabeçalho (alguns bancos colocam título e dados da conta antes).
 * Devolve { indice, colunas }. indice = -1 quando o arquivo não tem cabeçalho.
 */
export function acharCabecalho(linhas) {
  const limite = Math.min(linhas.length, 25);

  for (let i = 0; i < limite; i++) {
    const nomes = linhas[i].map(normalizarTexto);
    const temData = nomes.some((n) => n.includes("DATA") || /\bDATE\b/.test(n));
    const temValor = nomes.some((n) => /(VALOR|AMOUNT|QUANTIA|MONTANTE)/.test(n));
    if (temData && temValor) return { indice: i, colunas: linhas[i] };
  }

  // sem cabeçalho com nome conhecido: pega a primeira linha com 3+ colunas
  const i = linhas.findIndex((l) => l.length >= 3);
  if (i === -1) return { indice: -1, colunas: [] };

  const pareceDado = linhas[i].some((c) => converterData(c, 2000) !== null);
  if (pareceDado) {
    return { indice: -1, colunas: linhas[i].map((_, k) => `Coluna ${k + 1}`) };
  }
  return { indice: i, colunas: linhas[i] };
}

/** Sugere qual coluna é Data, Descrição e Valor pelo nome. -1 = não achou. */
export function sugerirColunas(colunas) {
  const nomes = colunas.map(normalizarTexto);
  const achar = (regex, usados) =>
    nomes.findIndex((n, i) => !usados.includes(i) && regex.test(n) && !n.includes("SALDO"));

  const data = achar(/\b(DATA|DATE)\b/, []);
  const valor = achar(/(VALOR|AMOUNT|QUANTIA|MONTANTE)/, [data]);

  let descricao = -1;
  const candidatos = [
    /DESCRI/, /HISTORICO/, /ESTABELECIMENTO/, /\b(TITULO|TITLE)\b/, /DETALHE|MEMO/, /LANCAMENTO/,
  ];
  for (const regex of candidatos) {
    descricao = achar(regex, [data, valor]);
    if (descricao >= 0) break;
  }
  return { data, descricao, valor };
}

// ─────────────────────────────────────────────
// CATEGORIZAÇÃO
// ─────────────────────────────────────────────

// Normaliza o dicionário uma vez só.
const DICIONARIO = Object.entries(PALAVRAS_CHAVE).flatMap(([categoria, palavras]) =>
  palavras.map((p) => ({ categoria, palavra: normalizarTexto(p) })).filter((x) => x.palavra)
);

/** Devolve o id da categoria ou null quando nenhuma palavra casa. Vence a mais longa. */
export function categorizar(descricao) {
  const texto = ` ${normalizarTexto(descricao)} `;
  let melhor = null;
  let tamanho = 0;
  for (const { categoria, palavra } of DICIONARIO) {
    if (palavra.length > tamanho && texto.includes(` ${palavra} `)) {
      melhor = categoria;
      tamanho = palavra.length;
    }
  }
  return melhor;
}

// ─────────────────────────────────────────────
// LINHAS DA PRÉVIA
// ─────────────────────────────────────────────

const chaveDuplicado = (data, descricao, valorComSinal) =>
  `${data}|${normalizarTexto(descricao)}|${Math.round(valorComSinal * 100)}`;

/** "pronto" | "revisar" | "duplicado" */
export function statusDaLinha(linha) {
  if (linha.duplicado) return "duplicado";
  return linha.categoria ? "pronto" : "revisar";
}

/**
 * Transforma as linhas do CSV em linhas da prévia.
 *
 * @param {string[][]} linhasCSV
 * @param {number} indiceCabecalho - -1 se não há cabeçalho
 * @param {{data:number, descricao:number, valor:number}} mapa - índice de cada coluna
 * @param {{existentes: Array, anoPadrao: number}} opcoes
 * @returns {{ linhas: Array, ignoradas: number }}
 */
export function montarLinhas(linhasCSV, indiceCabecalho, mapa, { existentes = [], anoPadrao }) {
  // chaves do que já está salvo no app
  const vistos = new Set();
  existentes.forEach((l) => {
    if (!l.data || (l.tipo !== "saida" && l.tipo !== "entrada")) return;
    const sinal = l.tipo === "saida" ? -1 : 1;
    vistos.add(chaveDuplicado(l.data, l.nome, sinal * l.valor));
  });

  const linhas = [];
  let ignoradas = 0;

  linhasCSV.slice(indiceCabecalho + 1).forEach((campos, posicao) => {
    const data = converterData(campos[mapa.data], anoPadrao);
    const valor = converterValor(campos[mapa.valor]);
    if (!data || valor === null || valor === 0) {
      ignoradas++;
      return;
    }

    const descricao = (campos[mapa.descricao] ?? "").trim() || "Sem descrição";
    const tipo = valor > 0 ? "entrada" : "saida";
    const chave = chaveDuplicado(data, descricao, valor);
    const duplicado = vistos.has(chave);
    vistos.add(chave);

    const categoria = tipo === "entrada" ? CATEGORIA_ENTRADA.id : categorizar(descricao);

    linhas.push({
      id: posicao,
      data,
      descricao,
      valor: Math.abs(valor),
      tipo,
      categoria,
      duplicado,
      marcada: !duplicado && categoria !== null,
    });
  });

  // mais recentes primeiro (o sort do JS é estável: empates mantêm a ordem do arquivo)
  linhas.sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0));
  return { linhas, ignoradas };
}

export function resumirLinhas(linhas) {
  let prontos = 0, revisar = 0, duplicados = 0, selecionadas = 0;
  linhas.forEach((l) => {
    const status = statusDaLinha(l);
    if (status === "pronto") {
      prontos++;
      if (l.marcada) selecionadas++;
    } else if (status === "revisar") revisar++;
    else duplicados++;
  });
  return {
    total: linhas.length,
    prontos,
    revisar,
    duplicados,
    selecionadas,
    desmarcadas: prontos - selecionadas,
  };
}

// ─────────────────────────────────────────────
// PRÉVIA -> LANÇAMENTOS DO APP
// ─────────────────────────────────────────────

/**
 * Converte as linhas marcadas em lançamentos com criarEntrada e criarSaida.
 * criarEntrada/criarSaida usam Date.now() como id, e num loop todos ficariam com o
 * mesmo id. Por isso o id é trocado aqui por uma sequência única.
 */
export function converterParaLancamentos(linhas, existentes = []) {
  const maiorId = existentes.reduce((m, l) => Math.max(m, Number(l.id) || 0), 0);
  let proximoId = Math.max(Date.now(), maiorId + 1);

  return linhas
    .filter((l) => l.marcada && statusDaLinha(l) === "pronto")
    .map((l) => {
      const base =
        l.tipo === "entrada"
          ? criarEntrada("renda_extra", l.descricao, l.valor, null, l.data)
          : criarSaida(l.descricao, l.valor, l.categoria, l.data);
      return { ...base, id: proximoId++ };
    });
}