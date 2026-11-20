import { useState } from "react";
import DetalhesLancamento   from "../componentes/DetalhesLancamento";
import MenuNovoLancamento   from "../componentes/NovoLancamento";
import NovaEntradaModal     from "../componentes/NovaEntrada";
import NovaDespesaFixaModal from "../componentes/NovaDespesaFixa";
import NovaSaida            from "../componentes/NovaSaida";
import SeletorMes           from "../componentes/SeletorMes";
import { valorNoMes }       from "../logica/saldo";
import { CATEGORIAS }       from "../dados/categorias";
import NavBar               from "../componentes/navBar";
import {
  CalendarDays,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  PiggyBank,
  Plus,
} from "lucide-react";
import "../estilos/SaldoMes.css";

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const moeda = (valor) =>
  Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
               "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

function formatarDataLonga(dataStr) {
  if (!dataStr) return "";
  const [, mesNum, dia] = dataStr.split("-");
  return `${dia} de ${MESES[Number(mesNum) - 1]}`;
}

function dataDoLancamento(l, mes) {
  if (l.data) return l.data;
  const dia = l.diaVencimento ?? l.diaRecebimento;
  if (!dia) return `${mes}-01`;
  return `${mes}-${String(dia).padStart(2, "0")}`;
}

function tipoVisual(l, mes) {
  if (l.tipo === "entrada") return "entrada";
  if (l.tipo === "despesa_fixa") return l.pagoNoMes?.[mes] ? "saida" : "pendente";
  return "saida";
}

function sinalDoLancamento(tv) {
  if (tv === "entrada")  return "+ ";
  if (tv === "pendente") return "";
  return "− ";
}

function statusDoLancamento(tv) {
  if (tv === "entrada")  return "Recebido";
  if (tv === "pendente") return "";
  return "Pago";
}

function iconeDoLancamento(tv) {
  if (tv === "entrada")  return ArrowDownLeft;
  if (tv === "pendente") return Clock;
  return ArrowUpRight;
}

function detalheDoLancamento(l) {
  const cat = CATEGORIAS.find((c) => c.id === l.categoria);
  const partes = [];
  if (cat) partes.push(cat.nome);
  if (l.tipo === "despesa_fixa") partes.push(`Despesa fixa · vence dia ${l.diaVencimento}`);
  if (l.tipo === "entrada" && l.subtipo === "salario") partes.push("Salário");
  if (l.tipo === "entrada" && l.subtipo === "renda_extra") partes.push("Renda extra");
  if (l.tipo === "saida" && l.parcelas > 1)
    partes.push(`Parcela ${l.parcelaAtual}/${l.parcelas}`);
  return partes.join(" · ");
}

const FILTROS = [
  { id: "todos",    nome: "Todos"     },
  { id: "entrada",  nome: "Entradas"  },
  { id: "saida",    nome: "Saídas"    },
  { id: "pendente", nome: "Pendentes" },
];

// ─────────────────────────────────────────────
// COMPONENTE
// ─────────────────────────────────────────────
export default function SaldoMes({
  telaAtiva               = "saldo",
  onNavegar               = () => {},
  mes                     = "",
  onMudarMes              = () => {},
  resumo                  = { entradas: 0, saidas: 0, pendentes: 0, guardado: 0, saldo: 0 },
  lancamentosDoMes        = [],
  onPagarDespesaFixa      = () => {},
  onEncerrarDespesaFixa   = () => {},
  onExcluir               = () => {},
  onAdicionarEntrada      = () => {},
  onAdicionarDespesaFixa  = () => {},
  onAdicionarSaida        = () => {},
}) {
  const [filtro,           setFiltro]           = useState("todos");
  const [modalAtivo,       setModalAtivo]       = useState(null);
  const [lancamentoAberto, setLancamentoAberto] = useState(null);

  const fecharModais = () => setModalAtivo(null);

  const handleEscolherMenu = (tipo) => {
    if (["entrada", "despesa-fixa", "saida"].includes(tipo)) setModalAtivo(tipo);
    else setModalAtivo(null);
  };

  const salario = lancamentosDoMes.find(
    (l) => l.tipo === "entrada" && l.subtipo === "salario"
  );

  // ── Monta grupos por data ──────────────────
  const comData = lancamentosDoMes.map((l) => ({
    ...l,
    _tv:   tipoVisual(l, mes),
    _data: dataDoLancamento(l, mes),
  }));

  const filtrados = comData.filter((l) => {
    if (filtro === "todos")    return true;
    if (filtro === "pendente") return l._tv === "pendente";
    if (filtro === "entrada")  return l._tv === "entrada";
    if (filtro === "saida")    return l._tv === "saida";
    return true;
  });

  const mapaGrupos = {};
  filtrados.forEach((l) => {
    const chave = l._data;
    if (!mapaGrupos[chave]) mapaGrupos[chave] = [];
    mapaGrupos[chave].push(l);
  });

  const grupos = Object.entries(mapaGrupos)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([data, itens]) => ({
      data,
      aVencer: itens.some((l) => l._tv === "pendente"),
      itens,
    }));

  const total = filtrados.length;

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <div className="saldo-pagina">
      <NavBar telaAtiva={telaAtiva} onNavegar={onNavegar} />

      <main className="saldo">
        <header className="saldo__cabecalho">
          <div>
            <h1 className="saldo__titulo">Saldo do mês</h1>
            <p className="saldo__descricao">
              Cada movimentação, um passo mais perto dos seus planos.
            </p>
          </div>

          {/* Seletor de mês — padrão único de todas as telas */}
          <SeletorMes valor={mes} onChange={onMudarMes} />
        </header>

        {/* Card de resumo */}
        <section className="saldo__resumo">
          <div className="saldo__card">
            <div className="saldo__disponivel">
              <div className="saldo__disponivel-topo">
                <span className="saldo__disponivel-titulo">Saldo disponível</span>
                <span className="saldo__pill">Livre para usar</span>
              </div>
              <p className="saldo__valor-principal">{moeda(resumo.saldo)}</p>
              <p className="saldo__explicacao">
                Já descontadas despesas pendentes e valores guardados
              </p>
            </div>

            <div className="saldo__movimentacao">
              {[
                { tipo: "entrada",  rotulo: "Entrou",   Icone: ArrowDownLeft, valor: resumo.entradas  },
                { tipo: "saida",    rotulo: "Saiu",     Icone: ArrowUpRight,  valor: resumo.saidas    },
                { tipo: "pendente", rotulo: "Pendente", Icone: Clock,         valor: resumo.pendentes },
                { tipo: "guardado", rotulo: "Guardado", Icone: PiggyBank,     valor: resumo.guardado  },
              ].map(({ tipo, rotulo, Icone, valor }) => (
                <div key={tipo} className={`saldo__linha saldo__tipo--${tipo}`}>
                  <span className="saldo__indicador"><Icone size={16} /></span>
                  <span className="saldo__linha-rotulo">{rotulo}</span>
                  <strong className="saldo__linha-valor">{moeda(valor)}</strong>
                </div>
              ))}
            </div>
          </div>

          {salario?.diaRecebimento && (
            <div className="saldo__lembrete">
              <CalendarDays size={16} />
              <span>Seu salário entra dia {salario.diaRecebimento}</span>
            </div>
          )}
        </section>

        {/* Extrato */}
        <section className="saldo__corpo">
          <div className="saldo__filtros">
            {FILTROS.map(({ id, nome }) => (
              <button key={id}
                className={`saldo__filtro ${id !== "todos" ? `saldo__tipo--${id}` : ""} ${filtro === id ? "saldo__filtro--ativo" : ""}`}
                onClick={() => setFiltro(id)}>
                {id !== "todos" && <span className="saldo__filtro-ponto" />}
                {nome}
              </button>
            ))}
          </div>

          <div className="saldo__extrato">
            <div className="saldo__extrato-topo">
              <h2 className="saldo__extrato-titulo">Extrato do mês</h2>
              <span className="saldo__extrato-qtd">
                {total} {total === 1 ? "movimentação" : "movimentações"}
              </span>
            </div>

            {grupos.length === 0 && (
              <p style={{ marginTop: 20, fontSize: 13, color: "var(--texto-suave, #6b7090)" }}>
                Nenhuma movimentação encontrada.
              </p>
            )}

            {grupos.map((grupo) => (
              <div key={grupo.data}>
                <div className="saldo__data">
                  <span className="saldo__data-dia">{formatarDataLonga(grupo.data)}</span>
                  <span className={`saldo__data-situacao ${grupo.aVencer ? "saldo__data-situacao--vencer" : ""}`}>
                    {grupo.aVencer ? "A vencer" : "Concluídas"}
                  </span>
                  <span className="saldo__data-linha" />
                </div>

                {grupo.itens.map((item) => {
                  const tv     = item._tv;
                  const Icone  = iconeDoLancamento(tv);
                  const sinal  = sinalDoLancamento(tv);
                  const status = statusDoLancamento(tv);

                  return (
                    <div key={item.id}
                      className={`saldo__mov saldo__tipo--${tv}`}
                      onClick={() => setLancamentoAberto(item)}
                      style={{ cursor: "pointer" }}>
                      <span className="saldo__barra" />
                      <span className="saldo__icone"><Icone size={16} /></span>
                      <strong className="saldo__nome">{item.nome}</strong>
                      <span className="saldo__categoria">{detalheDoLancamento(item)}</span>
                      <div className="saldo__situacao">
                        {tv === "pendente" ? (
                          <button className="saldo__pagar"
                            onClick={(e) => {
                              e.stopPropagation();
                              onPagarDespesaFixa(item.id);
                            }}>
                            Marcar como paga
                          </button>
                        ) : (
                          <span className="saldo__status">{status}</span>
                        )}
                      </div>
                      <span className="saldo__valor">
                        {sinal}{moeda(valorNoMes(item))}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <p className="saldo__nota">
            Tudo em um só lugar: o que entrou, saiu, está pendente e já foi guardado.
          </p>
        </section>

        <button className="saldo__fab" aria-label="Adicionar movimentação"
          onClick={() => setModalAtivo("menu")}>
          <Plus size={26} />
        </button>
      </main>

      {modalAtivo === "menu" && (
        <MenuNovoLancamento onFechar={fecharModais} onEscolher={handleEscolherMenu} />
      )}
      {modalAtivo === "entrada" && (
        <NovaEntradaModal
          onFechar={fecharModais}
          onConfirmar={(dados) => {
            onAdicionarEntrada(dados.tipoEntrada, dados.nome, dados.valor, dados.diaRecebimento, dados.data ?? null);
            fecharModais();
          }}
        />
      )}
      {modalAtivo === "despesa-fixa" && (
        <NovaDespesaFixaModal
          onFechar={fecharModais}
          onConfirmar={(dados) => {
            onAdicionarDespesaFixa(dados.nome, dados.valor, dados.categoria, dados.diaVencimento);
            fecharModais();
          }}
        />
      )}
      {modalAtivo === "saida" && (
        <NovaSaida
          onFechar={fecharModais}
          onConfirmar={(dados) => {
            onAdicionarSaida(dados.nome, dados.valor, dados.categoria, dados.data, dados.parcelas ?? 1, dados.parcelaAtual ?? 1);
            fecharModais();
          }}
        />
      )}

      {lancamentoAberto && (
        <DetalhesLancamento
          lancamento={lancamentoAberto}
          mes={mes}
          onFechar={() => setLancamentoAberto(null)}
          onEncerrar={(id) => { onEncerrarDespesaFixa(id); setLancamentoAberto(null); }}
          onExcluir={(id)  => { onExcluir(id);             setLancamentoAberto(null); }}
        />
      )}
    </div>
  );
}