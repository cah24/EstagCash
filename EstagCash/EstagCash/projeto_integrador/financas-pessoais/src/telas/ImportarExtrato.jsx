import { useMemo, useRef, useState } from "react";
import NavBar from "../componentes/navBar";
import "../estilos/ImportarExtrato.css";
import { CATEGORIAS, buscarCategoria } from "../dados/categorias";
import {
  CATEGORIA_ENTRADA,
  acharCabecalho,
  converterParaLancamentos,
  decodificarArquivo,
  detectarSeparador,
  lerCSV,
  montarLinhas,
  resumirLinhas,
  statusDaLinha,
  sugerirColunas,
} from "../logica/importarExtrato";

const ETAPAS = ["Enviar CSV", "Revisar categorias", "Confirmar"];
const TAMANHO_MAXIMO = 5 * 1024 * 1024; // 5 MB
const LINHAS_INICIAIS = 6;
const LINHAS_POR_CLIQUE = 10;

// "investimento" não é lançamento comum (entra pelas metas)
const CATEGORIAS_SAIDA = CATEGORIAS.filter((c) => c.id !== "investimento");

// cor do chip de cada categoria (classes imp-tom--* no CSS)
const TOM = {
  moradia: "azul", agua: "azul", transporte: "azul",
  luz: "roxo", internet_telefone: "roxo", educacao: "roxo", assinaturas: "roxo",
  mercado: "verde", saude: "verde",
  restaurante: "rosa", lazer: "rosa", compras: "rosa",
  outros: "cinza",
  [CATEGORIA_ENTRADA.id]: "celeste",
};

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

const moeda = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const plural = (n, singular, pluralTxt) => `${n} ${n === 1 ? singular : pluralTxt}`;
const dataCurta = (iso) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

function rotuloMes(mes) {
  const [ano, m] = mes.split("-");
  const nome = MESES[Number(m) - 1];
  return `${nome.charAt(0).toUpperCase()}${nome.slice(1)} de ${ano}`;
}

/* ---------- Ícones ---------- */

const Icone = ({ children, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const IconeNuvem = () => (
  <Icone size={30}>
    <path d="M7 18a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 8.5a4 4 0 0 1-.5 9.5" />
    <path d="m12 12-3 3m3-3 3 3m-3-3v9" />
  </Icone>
);
const IconeSeta = () => (
  <Icone size={16}>
    <path d="m6 9 6 6 6-6" />
  </Icone>
);
const IconeCheck = () => (
  <Icone size={28}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Icone>
);

/* ---------- Partes da tela ---------- */

function Passos({ etapa }) {
  return (
    <ol className="imp-passos" aria-label="Etapas da importação">
      {ETAPAS.map((nome, i) => {
        const numero = i + 1;
        return (
          <li key={nome} className={`imp-passo ${etapa === numero ? "imp-passo--ativo" : ""}`}
            aria-current={etapa === numero ? "step" : undefined}>
            <span className="imp-passo__numero">{numero}</span>
            <span className="imp-passo__nome">{nome}</span>
          </li>
        );
      })}
    </ol>
  );
}

function ChipCategoria({ nome, tom }) {
  return <span className={`imp-chip imp-tom--${tom}`}>{nome}</span>;
}

/* ---------- Tela ---------- */

export default function ImportarExtrato({
  telaAtiva = "importar",
  onNavegar = () => {},
  mes = "",            // "AAAA-MM", vem do App
  lancamentos = [],    // todos os lançamentos salvos (para achar duplicados)
  onImportar = () => {}, // recebe o array de lançamentos novos
}) {
  const [etapa, setEtapa] = useState(1);

  // etapa 1
  const [arquivo, setArquivo] = useState(null); // { nome, linhas, cabecalho }
  const [mapa, setMapa] = useState({ data: -1, descricao: -1, valor: -1 });
  const [erro, setErro] = useState("");
  const [arrastando, setArrastando] = useState(false);
  const inputRef = useRef(null);

  // etapa 2
  const [linhas, setLinhas] = useState([]);
  const [ignoradas, setIgnoradas] = useState(0);
  const [filtro, setFiltro] = useState("todos");
  const [limite, setLimite] = useState(LINHAS_INICIAIS);

  // etapa 3
  const [resultado, setResultado] = useState(null);


  const resumo = useMemo(() => resumirLinhas(linhas), [linhas]);

  const mapaCompleto =
    mapa.data >= 0 && mapa.descricao >= 0 && mapa.valor >= 0;
  const colunasRepetidas =
    mapaCompleto && new Set([mapa.data, mapa.descricao, mapa.valor]).size < 3;

  /* ----- etapa 1: ler arquivo ----- */

  async function lerArquivo(file) {
    setErro("");
    if (!file) return;
    if (file.size > TAMANHO_MAXIMO) {
      setErro("O arquivo é grande demais (máximo de 5 MB). Exporte um período menor no seu banco.");
      return;
    }
    try {
      const texto = decodificarArquivo(await file.arrayBuffer());
      const separador = detectarSeparador(texto);
      const linhasCSV = lerCSV(texto, separador);
      const cabecalho = acharCabecalho(linhasCSV);

      if (cabecalho.colunas.length < 3 || linhasCSV.length < cabecalho.indice + 2) {
        setErro("Não consegui identificar as colunas. Confira se é um CSV de extrato com data, descrição e valor.");
        return;
      }
      setArquivo({ nome: file.name, linhas: linhasCSV, cabecalho });
      setMapa(sugerirColunas(cabecalho.colunas));
    } catch {
      setErro("Não consegui ler esse arquivo. Tente exportar o extrato de novo em CSV.");
    }
  }

  function aoEscolher(e) {
    lerArquivo(e.target.files?.[0]);
    e.target.value = ""; // permite escolher o mesmo arquivo de novo
  }

  function aoSoltar(e) {
    e.preventDefault();
    setArrastando(false);
    lerArquivo(e.dataTransfer.files?.[0]);
  }

  function continuar() {
    const { linhas: prontas, ignoradas: puladas } = montarLinhas(
      arquivo.linhas,
      arquivo.cabecalho.indice,
      mapa,
      { existentes: lancamentos, anoPadrao: Number(mes.slice(0, 4)) }
    );
    if (prontas.length === 0) {
      setErro("Nenhuma linha válida com essas colunas. Confira se Data e Valor estão certos.");
      return;
    }
    setErro("");
    setLinhas(prontas);
    setIgnoradas(puladas);
    setFiltro("todos");
    setLimite(LINHAS_INICIAIS);
    setEtapa(2);
  }

  /* ----- etapa 2: revisar ----- */

  const alternarLinha = (id) =>
    setLinhas((prev) => prev.map((l) => (l.id === id ? { ...l, marcada: !l.marcada } : l)));

  const alterarCategoria = (id, categoria) =>
    setLinhas((prev) =>
      prev.map((l) =>
        l.id === id
          ? { ...l, categoria: categoria || null, marcada: Boolean(categoria) && !l.duplicado }
          : l
      )
    );

  function alternarTodas() {
    const todasMarcadas = resumo.prontos > 0 && resumo.selecionadas === resumo.prontos;
    setLinhas((prev) =>
      prev.map((l) => (statusDaLinha(l) === "pronto" ? { ...l, marcada: !todasMarcadas } : l))
    );
  }

  function trocarFiltro(novo) {
    setFiltro(novo);
    setLimite(LINHAS_INICIAIS);
  }

  function recomecar() {
    setEtapa(1);
    setArquivo(null);
    setMapa({ data: -1, descricao: -1, valor: -1 });
    setErro("");
    setLinhas([]);
    setIgnoradas(0);
    setResultado(null);
  }

  function importar() {
    const novos = converterParaLancamentos(linhas, lancamentos);
    if (novos.length === 0) return;

    const soma = (tipo) => novos.filter((l) => l.tipo === tipo).reduce((s, l) => s + l.valor, 0);
    setResultado({
      quantidade: novos.length,
      entradas: novos.filter((l) => l.tipo === "entrada").length,
      saidas: novos.filter((l) => l.tipo === "saida").length,
      totalEntradas: soma("entrada"),
      totalSaidas: soma("saida"),
      foraDoMes: novos.filter((l) => !l.data.startsWith(mes)).length,
    });
    onImportar(novos);
    setEtapa(3);
  }

  /* ----- dados derivados ----- */

  const filtradas = linhas.filter((l) => filtro === "todos" || statusDaLinha(l) === filtro);
  const visiveis = filtradas.slice(0, limite);
  const parcial = resumo.selecionadas > 0 && resumo.selecionadas < resumo.prontos;
  const todasMarcadas = resumo.prontos > 0 && resumo.selecionadas === resumo.prontos;

  const filtros = [
    { id: "todos", texto: plural(resumo.total, "lançamento", "lançamentos"), classe: "neutro" },
    { id: "pronto", texto: plural(resumo.prontos, "pronto", "prontos"), classe: "verde" },
    { id: "revisar", texto: `${resumo.revisar} para revisar`, classe: "amarelo" },
    { id: "duplicado", texto: plural(resumo.duplicados, "duplicado", "duplicados"), classe: "cinza" },
  ];

  return (
    <div className="imp-pagina">
      <NavBar telaAtiva={telaAtiva} onNavegar={onNavegar} />

      <main className="imp-conteudo">
        <header className="imp-topo">
          <div>
            <h1>Importar extrato</h1>
            <p>Traga os lançamentos do seu banco de uma vez.</p>
          </div>
        </header>

        <Passos etapa={etapa} />

        {/* ================= ETAPA 1 ================= */}
        {etapa === 1 && (
          <>
            <section
              className={`imp-drop ${arrastando ? "imp-drop--ativo" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setArrastando(true); }}
              onDragLeave={() => setArrastando(false)}
              onDrop={aoSoltar}
            >
              <span className="imp-drop__icone"><IconeNuvem /></span>
              <h2>{arquivo ? arquivo.nome : "Arraste o arquivo CSV aqui"}</h2>
              <p>
                {arquivo
                  ? `${plural(arquivo.linhas.length - (arquivo.cabecalho.indice + 1), "linha encontrada", "linhas encontradas")}`
                  : "ou selecione o extrato salvo no seu computador"}
              </p>
              <button type="button" className="imp-botao" onClick={() => inputRef.current?.click()}>
                {arquivo ? "Trocar arquivo" : "Escolher arquivo"}
              </button>
              <input ref={inputRef} type="file" accept=".csv,.txt,text/csv" hidden onChange={aoEscolher} />
              <small>Formato CSV · Uma linha por lançamento</small>
            </section>

            <section className="imp-painel">
              <h2>Colunas encontradas</h2>
              <p className="imp-painel__sub">Associe cada coluna do arquivo ao campo correspondente.</p>

              <div className="imp-colunas">
                {[
                  { chave: "data", rotulo: "Data" },
                  { chave: "descricao", rotulo: "Descrição" },
                  { chave: "valor", rotulo: "Valor" },
                ].map(({ chave, rotulo }) => (
                  <div className="imp-campo" key={chave}>
                    <label htmlFor={`imp-col-${chave}`}>{rotulo}</label>
                    <div className="imp-select">
                      <select
                        id={`imp-col-${chave}`}
                        value={mapa[chave]}
                        disabled={!arquivo}
                        onChange={(e) => setMapa((m) => ({ ...m, [chave]: Number(e.target.value) }))}
                      >
                        <option value={-1}>{rotulo}</option>
                        {arquivo?.cabecalho.colunas.map((nome, i) => (
                          <option key={i} value={i}>{nome || `Coluna ${i + 1}`}</option>
                        ))}
                      </select>
                      <IconeSeta />
                    </div>
                  </div>
                ))}
              </div>

              {colunasRepetidas && (
                <p className="imp-erro" role="alert">Escolha uma coluna diferente para cada campo.</p>
              )}
              {erro && <p className="imp-erro" role="alert">{erro}</p>}

              {arquivo && (
                <div className="imp-acoes">
                  <button type="button" className="imp-botao" onClick={continuar}
                    disabled={!mapaCompleto || colunasRepetidas}>
                    Continuar
                  </button>
                </div>
              )}
            </section>

            {!arquivo && erro && <p className="imp-erro imp-erro--solto" role="alert">{erro}</p>}
            <p className="imp-nota">Seus lançamentos só serão adicionados após a confirmação.</p>
          </>
        )}

        {/* ================= ETAPA 2 ================= */}
        {etapa === 2 && (
          <>
            <div className="imp-filtros" role="group" aria-label="Filtrar lançamentos">
              {filtros.map(({ id, texto, classe }) => (
                <button key={id} type="button"
                  className={`imp-pilula imp-pilula--${classe} ${filtro === id ? "imp-pilula--ativa" : ""}`}
                  aria-pressed={filtro === id}
                  onClick={() => trocarFiltro(id)}>
                  {texto}
                </button>
              ))}
            </div>

            {ignoradas > 0 && (
              <p className="imp-aviso">
                {plural(ignoradas, "linha do arquivo foi ignorada", "linhas do arquivo foram ignoradas")} por
                data ou valor inválido (títulos, totais ou linhas vazias).
              </p>
            )}

            <section className="imp-painel imp-painel--tabela">
              <div className="imp-tabela__topo">
                <h2>Revise os lançamentos</h2>
                <span>Mostrando {visiveis.length} de {filtradas.length} lançamentos</span>
              </div>

              <div className="imp-tabela__rolagem">
                <table className="imp-tabela">
                  <thead>
                    <tr>
                      <th className="imp-col-check">
                        <input type="checkbox" aria-label="Selecionar todos os lançamentos prontos"
                          checked={todasMarcadas}
                          ref={(el) => { if (el) el.indeterminate = parcial; }}
                          disabled={resumo.prontos === 0}
                          onChange={alternarTodas} />
                      </th>
                      <th className="imp-col-data">Data</th>
                      <th>Descrição</th>
                      <th className="imp-col-cat">Categoria</th>
                      <th className="imp-col-tipo">Tipo</th>
                      <th className="imp-col-valor">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visiveis.map((l) => {
                      const status = statusDaLinha(l);
                      const duplicado = status === "duplicado";
                      const entrada = l.tipo === "entrada";
                      const nomeCategoria = !l.categoria
                        ? "Revisar"
                        : entrada
                          ? CATEGORIA_ENTRADA.nome
                          : buscarCategoria(l.categoria)?.nome ?? l.categoria;
                      const tom = duplicado ? "cinza" : !l.categoria ? "amarelo" : TOM[l.categoria] ?? "cinza";

                      return (
                        <tr key={l.id} className={duplicado ? "imp-linha--duplicada" : ""}>
                          <td className="imp-col-check">
                            <input type="checkbox"
                              aria-label={`Importar ${l.descricao}`}
                              checked={l.marcada}
                              disabled={status !== "pronto"}
                              onChange={() => alternarLinha(l.id)} />
                          </td>
                          <td className="imp-col-data" title={l.data}>{dataCurta(l.data)}</td>
                          <td>
                            <span className="imp-descricao">{l.descricao}</span>
                            {duplicado && <span className="imp-selo">Duplicado</span>}
                          </td>
                          <td className="imp-col-cat">
                            <div className="imp-cat">
                              <ChipCategoria nome={nomeCategoria} tom={tom} />
                              <IconeSeta />
                              <select
                                aria-label={`Categoria de ${l.descricao}`}
                                value={l.categoria ?? ""}
                                disabled={duplicado || entrada}
                                onChange={(e) => alterarCategoria(l.id, e.target.value)}>
                                {entrada ? (
                                  <option value={CATEGORIA_ENTRADA.id}>{CATEGORIA_ENTRADA.nome}</option>
                                ) : (
                                  <>
                                    {!l.categoria && <option value="">Escolher categoria</option>}
                                    {CATEGORIAS_SAIDA.map((c) => (
                                      <option key={c.id} value={c.id}>{c.nome}</option>
                                    ))}
                                  </>
                                )}
                              </select>
                            </div>
                          </td>
                          <td className={`imp-col-tipo ${entrada && !duplicado ? "imp-tipo--entrada" : ""}`}>
                            {entrada ? "Entrada" : "Saída"}
                          </td>
                          <td className={`imp-col-valor ${entrada && !duplicado ? "imp-valor--entrada" : ""}`}>
                            {entrada ? "+" : "−"} {moeda(l.valor)}
                          </td>
                        </tr>
                      );
                    })}
                    {visiveis.length === 0 && (
                      <tr><td colSpan={6} className="imp-vazio">Nenhum lançamento nesse filtro.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {filtradas.length > visiveis.length && (
                <button type="button" className="imp-mais"
                  onClick={() => setLimite((n) => n + LINHAS_POR_CLIQUE)}>
                  Mostrar mais lançamentos
                </button>
              )}
              <p className="imp-nota imp-nota--tabela">
                Duplicados e itens para revisar ficam fora da importação.
              </p>
            </section>

            <div className="imp-rodape">
              <div>
                <strong>
                  {plural(resumo.selecionadas, "lançamento pronto", "lançamentos prontos")} para importar
                </strong>
                <small>
                  {resumo.revisar} para revisar e {plural(resumo.duplicados, "duplicado", "duplicados")} não serão incluídos.
                  {resumo.desmarcadas > 0 && ` ${plural(resumo.desmarcadas, "desmarcado", "desmarcados")} também.`}
                </small>
              </div>
              <div className="imp-rodape__botoes">
                <button type="button" className="imp-botao imp-botao--claro" onClick={recomecar}>Cancelar</button>
                <button type="button" className="imp-botao" onClick={importar} disabled={resumo.selecionadas === 0}>
                  Importar {plural(resumo.selecionadas, "lançamento", "lançamentos")}
                </button>
              </div>
            </div>
          </>
        )}

        {/* ================= ETAPA 3 ================= */}
        {etapa === 3 && resultado && (
          <section className="imp-painel imp-sucesso" aria-live="polite">
            <span className="imp-sucesso__icone"><IconeCheck /></span>
            <h2>{plural(resultado.quantidade, "lançamento importado", "lançamentos importados")}</h2>
            <p>Eles já estão no seu app.</p>

            <dl className="imp-resumo">
              <div>
                <dt>{plural(resultado.entradas, "entrada", "entradas")}</dt>
                <dd className="imp-valor--entrada">+ {moeda(resultado.totalEntradas)}</dd>
              </div>
              <div>
                <dt>{plural(resultado.saidas, "saída", "saídas")}</dt>
                <dd>− {moeda(resultado.totalSaidas)}</dd>
              </div>
            </dl>

            {resultado.foraDoMes > 0 && (
              <p className="imp-aviso imp-aviso--centro">
                {plural(resultado.foraDoMes, "lançamento é", "lançamentos são")} de outros meses e não
                aparece{resultado.foraDoMes === 1 ? "" : "m"} no saldo de {rotuloMes(mes)}.
              </p>
            )}

            <div className="imp-sucesso__botoes">
              <button type="button" className="imp-botao imp-botao--claro" onClick={recomecar}>
                Importar outro extrato
              </button>
              <button type="button" className="imp-botao" onClick={() => onNavegar("saldo")}>
                Ver saldo do mês
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}