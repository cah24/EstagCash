import { useState } from "react";

import { carregar, salvar, CHAVES } from "./dados/storage";

import BoaVinda         from "./telas/BoasVindas/BoaVinda";
import Nome             from "./telas/BoasVindas/Nome";
import Renda            from "./telas/BoasVindas/Renda";
import Inicio           from "./telas/Inicio";
import SaldoMes         from "./telas/SaldoMes";
import Metas            from "./telas/Metas";
import MetaDetalhe      from "./telas/MetaDetalhe";
import LimitesCategoria from "./telas/LimitesCategoria";
import Reserva          from "./telas/ReservaEmergencia";
import PosEstagio       from "./telas/PosEstagio";
import Regra            from "./telas/Regra";
import ImportarExtrato  from "./telas/ImportarExtrato";
import Exportar         from "./telas/Exportar";
import { obterMesEntrada } from "./logica/Periodo";

import {
  criarEntrada,
  criarDespesaFixa,
  criarSaida,
  listarDoMes,
  marcarDespesaFixaPaga,
  encerrarDespesaFixa,
  removerLancamento,
  definirSalario,
} from "./logica/Lancamentos";

import {
  calcularSaldo,
  totalEntradas,
  totalSaidas,
  totalPendentes,
  totalGuardado,
  totalPorCategoria,
  calcularRegra502030,
} from "./logica/saldo";

import { CATEGORIAS } from "./dados/categorias";
import { SalarioContext } from "./componentes/SalarioContext";
import { PeriodoContext } from "./componentes/PeriodoContext";

// ─────────────────────────────────────────────
// MÊS ATUAL — formato "AAAA-MM"
// ─────────────────────────────────────────────
function mesAtual() {
  const hoje = new Date();
  const ano  = hoje.getFullYear();
  const mes  = String(hoje.getMonth() + 1).padStart(2, "0");
  return `${ano}-${mes}`;
}

const arredondar = (n) => Math.round(n * 100) / 100;

// ─────────────────────────────────────────────
// RESERVA DE EMERGÊNCIA — dado próprio, separado das metas
// Guarda só a lista de movimentos: { id, tipo, valor, descricao, data }
// (tipo: "deposito" | "retirada"). A chave abaixo é diferente da
// "estagCash:reserva" que a tela usa para a despesa média.
// ─────────────────────────────────────────────
const ID_RESERVA            = "reserva";
const CHAVE_RESERVA_MOVS    = "estagCash:reserva-movimentos";

// Lê os movimentos da reserva. Se ainda não existir o dado novo mas a reserva
// antiga estiver dentro de `metas`, traz os movimentos de lá (migração).
function carregarMovimentosReserva() {
  const salvos = carregar(CHAVE_RESERVA_MOVS);
  if (Array.isArray(salvos)) return salvos;

  const antiga = (carregar(CHAVES.metas) ?? []).find((m) => m.id === ID_RESERVA);
  const movimentos = antiga?.movimentos ?? [];
  if (antiga) salvar(CHAVE_RESERVA_MOVS, movimentos);
  return movimentos;
}

// ─────────────────────────────────────────────
// APP
// ─────────────────────────────────────────────
function App() {
  // ── Navegação ──────────────────────────────
  const [tela, setTela] = useState(() => {
    const nome = carregar(CHAVES.nomeUsuario);
    return nome ? "inicio" : "boasvindas-1";
  });

  const [metaSelecionadaId, setMetaSelecionadaId] = useState(null);

  // ── Dados do usuário ───────────────────────
  const [nomeUsuario, setNomeUsuario] = useState(
    () => carregar(CHAVES.nomeUsuario) ?? ""
  );
  const [salario, setSalario] = useState(
    () => carregar(CHAVES.salario) ?? { valor: 0, diaRecebimento: 1 }
  );

  // ── Lançamentos ────────────────────────────
  const [lancamentos, setLancamentos] = useState(
    () => carregar(CHAVES.lancamentos) ?? []
  );

  // ── Metas (a reserva NÃO fica aqui) ────────
  const [metas, setMetas] = useState(() =>
    (carregar(CHAVES.metas) ?? []).filter((m) => m.id !== ID_RESERVA)
  );

  // ── Reserva de emergência ──────────────────
  const [reservaMovimentos, setReservaMovimentos] = useState(
    carregarMovimentosReserva
  );

  // ── Limites por categoria ──────────────────
  const [limites, setLimites] = useState(
    () => carregar(CHAVES.limites) ?? {}
  );

  // ── Mês ativo ─────────────────────────────
  const [mes, setMes] = useState(mesAtual);

  // Mês em que o usuário entrou no sistema: gravado uma única vez e nunca alterado.
  // O fim do intervalo (mês atual + 12) NÃO é guardado: é recalculado em cada seletor.
  const [mesEntrada] = useState(() => obterMesEntrada());

  // ─────────────────────────────────────────────
  // NAVEGAÇÃO
  // ─────────────────────────────────────────────
  const navegar = (destino, dados = null) => {
    if (destino === "meta-detalhe") {
      setMetaSelecionadaId(typeof dados === "object" ? dados?.id ?? null : dados);
    }
    setTela(destino);
  };

  // ─────────────────────────────────────────────
  // HELPERS — atualiza estado e salva no localStorage
  // ─────────────────────────────────────────────
  const atualizarLancamentos = (novaLista) => {
    setLancamentos(novaLista);
    salvar(CHAVES.lancamentos, novaLista);
  };

  const atualizarMetas = (novaLista) => {
    setMetas(novaLista);
    salvar(CHAVES.metas, novaLista);
  };

  const atualizarLimites = (novosLimites) => {
    setLimites(novosLimites);
    salvar(CHAVES.limites, novosLimites);
  };

  // ─────────────────────────────────────────────
  // AÇÕES DE LANÇAMENTOS
  // ─────────────────────────────────────────────
  const adicionarEntrada = (subtipo, nome, valor, diaRecebimento, data) => {
    const nova = criarEntrada(subtipo, nome, valor, diaRecebimento, data);
    atualizarLancamentos([...lancamentos, nova]);
  };

  const adicionarDespesaFixa = (nome, valor, categoria, diaVencimento) => {
    const nova = criarDespesaFixa(nome, valor, categoria, diaVencimento);
    atualizarLancamentos([...lancamentos, nova]);
  };

  const adicionarSaida = (nome, valor, categoria, data, parcelas, parcelaAtual) => {
    const nova = criarSaida(nome, valor, categoria, data, parcelas, parcelaAtual);
    atualizarLancamentos([...lancamentos, nova]);
  };

  const pagarDespesaFixa = (id) => {
    atualizarLancamentos(marcarDespesaFixaPaga(lancamentos, id, mes));
  };

  const encerrar = (id) => {
    atualizarLancamentos(encerrarDespesaFixa(lancamentos, id));
  };

  const excluir = (id) => {
    atualizarLancamentos(removerLancamento(lancamentos, id));
  };

  // ─────────────────────────────────────────────
  // AÇÃO DE IMPORTAÇÃO
  // ─────────────────────────────────────────────
  const importarLancamentos = (novos) => {
    atualizarLancamentos([...lancamentos, ...novos]);
  };

  // ─────────────────────────────────────────────
  // AÇÃO DE SALÁRIO
  // ─────────────────────────────────────────────
  const alterarSalario = ({ salario: valor, dia }) => {
    const novoSalario = { valor, diaRecebimento: dia };
    setSalario(novoSalario);
    salvar(CHAVES.salario, novoSalario);
    atualizarLancamentos(definirSalario(lancamentos, valor, dia));
  };

  // ─────────────────────────────────────────────
  // AÇÕES DE METAS
  // ─────────────────────────────────────────────
  const criarMeta = (nome, alvo) => {
    const nova = { id: Date.now(), nome, alvo, movimentos: [] };
    atualizarMetas([...metas, nova]);
  };

  const guardarNaMeta = (idMeta, valor, descricao) => {
    const novaLista = metas.map((m) => {
      if (m.id !== idMeta) return m;
      const movimento = { id: Date.now(), tipo: "deposito", valor, descricao, data: new Date().toISOString().slice(0, 10) };
      return { ...m, movimentos: [...(m.movimentos ?? []), movimento] };
    });
    atualizarMetas(novaLista);
  };

  const retirarDaMeta = (idMeta, valor, descricao) => {
    const novaLista = metas.map((m) => {
      if (m.id !== idMeta) return m;
      const movimento = { id: Date.now(), tipo: "retirada", valor, descricao, data: new Date().toISOString().slice(0, 10) };
      return { ...m, movimentos: [...(m.movimentos ?? []), movimento] };
    });
    atualizarMetas(novaLista);
  };

  const excluirMeta = (idMeta) => {
    atualizarMetas(metas.filter((m) => m.id !== idMeta));
  };

  // ─────────────────────────────────────────────
  // AÇÕES DA RESERVA DE EMERGÊNCIA
  // ─────────────────────────────────────────────
  const movimentarReserva = (tipo, valor) => {
    const movimento = {
      id: Date.now(),
      tipo,
      valor,
      descricao: "",
      data: new Date().toISOString().slice(0, 10),
    };
    const novaLista = [...reservaMovimentos, movimento];
    setReservaMovimentos(novaLista);
    salvar(CHAVE_RESERVA_MOVS, novaLista);
  };

  const guardarNaReserva = (valor) => movimentarReserva("deposito", valor);
  const retirarDaReserva = (valor) => movimentarReserva("retirada", valor);

  // ─────────────────────────────────────────────
  // AÇÕES DE LIMITES
  // ─────────────────────────────────────────────
  const definirLimite = (categoriaId, valor) => {
    atualizarLimites({ ...limites, [categoriaId]: valor });
  };

  const removerLimite = (categoriaId) => {
    const copia = { ...limites };
    delete copia[categoriaId];
    atualizarLimites(copia);
  };

  // ─────────────────────────────────────────────
  // DADOS CALCULADOS — passados para as telas
  // ─────────────────────────────────────────────
  const lancamentosDoMes = listarDoMes(lancamentos, mes);

  const guardadoReserva =
    Math.round(
      reservaMovimentos.reduce(
        (soma, m) => soma + (m.tipo === "deposito" ? m.valor : -m.valor),
        0
      ) * 100
    ) / 100;

  // Só para a Regra 50/30/20: junta a reserva às metas, no mesmo formato, para
  // ela contar como poupança. A reserva continua separada das metas.
  const metasParaCalculo = [
    ...metas,
    { id: ID_RESERVA, nome: "Reserva de emergência", alvo: 0, movimentos: reservaMovimentos },
  ];

  const resumo = {
    entradas:  totalEntradas(lancamentosDoMes),
    saidas:    totalSaidas(lancamentosDoMes, mes),
    pendentes: totalPendentes(lancamentosDoMes, mes),
    // A reserva é somada/subtraída aqui, direto, sem depender de como o
    // saldo.js trata cada meta.
    guardado:  arredondar(totalGuardado(metas, mes) + guardadoReserva),
    saldo:     arredondar(calcularSaldo(lancamentosDoMes, metas, mes) - guardadoReserva),
  };

  const gastosPorCategoria = totalPorCategoria(lancamentosDoMes);
  const regra502030        = calcularRegra502030(lancamentosDoMes, metasParaCalculo, mes, resumo.entradas, CATEGORIAS);

  const metaSelecionada = metas.find((m) => m.id === metaSelecionadaId);

  // ─────────────────────────────────────────────
  // TELAS
  // ─────────────────────────────────────────────
  const renderTela = () => {
    switch (tela) {
      case "boasvindas-1":
        return <BoaVinda onComecar={() => navegar("boasvindas-2")} />;

      case "boasvindas-2":
        return (
          <Nome
            onContinuar={(nomeDigitado) => {
              setNomeUsuario(nomeDigitado);
              salvar(CHAVES.nomeUsuario, nomeDigitado);
              navegar("boasvindas-3");
            }}
          />
        );

      case "boasvindas-3":
        return (
          <Renda
            onEntrar={(dados) => {
              const novoSalario = { valor: dados.valor, diaRecebimento: dados.dia };
              setSalario(novoSalario);
              salvar(CHAVES.salario, novoSalario);
              atualizarLancamentos(definirSalario(lancamentos, dados.valor, dados.dia));
              navegar("inicio");
            }}
            onPular={() => navegar("inicio")}
          />
        );

      case "inicio":
        return (
          <Inicio
            telaAtiva="inicio"
            onNavegar={navegar}
            nomeUsuario={nomeUsuario}
            mes={mes}
            onMudarMes={setMes}
            resumo={resumo}
            lancamentosDoMes={lancamentosDoMes}
            gastosPorCategoria={gastosPorCategoria}
            regra502030={regra502030}
            limites={limites}
            categorias={CATEGORIAS}
            onAdicionarEntrada={adicionarEntrada}
            onAdicionarDespesaFixa={adicionarDespesaFixa}
            onAdicionarSaida={adicionarSaida}
          />
        );

      case "saldo":
        return (
          <SaldoMes
            telaAtiva="saldo"
            onNavegar={navegar}
            mes={mes}
            onMudarMes={setMes}
            resumo={resumo}
            lancamentosDoMes={lancamentosDoMes}
            onPagarDespesaFixa={pagarDespesaFixa}
            onEncerrarDespesaFixa={encerrar}
            onExcluir={excluir}
            onAdicionarEntrada={adicionarEntrada}
            onAdicionarDespesaFixa={adicionarDespesaFixa}
            onAdicionarSaida={adicionarSaida}
          />
        );

      case "metas":
        return (
          <Metas
            telaAtiva="metas"
            onNavegar={navegar}
            metas={metas}
            onCriarMeta={criarMeta}
          />
        );

      case "meta-detalhe":
        return (
          <MetaDetalhe
            telaAtiva="meta-detalhe"
            onNavegar={navegar}
            meta={metaSelecionada}
            saldo={resumo.saldo}
            onVoltar={() => navegar("metas")}
            onGuardar={guardarNaMeta}
            onRetirar={retirarDaMeta}
            onExcluir={excluirMeta}
            onIrParaLimites={() => navegar("limites")}
          />
        );

      case "limites":
        return (
          <LimitesCategoria
            telaAtiva="limites"
            onNavegar={navegar}
            mes={mes}
            onMudarMes={setMes}
            onIrParaEconomia={() => navegar("metas")}
            limites={limites}
            gastosPorCategoria={gastosPorCategoria}
            categorias={CATEGORIAS}
            onDefinirLimite={definirLimite}
            onRemoverLimite={removerLimite}
          />
        );

      case "reserva":
        return (
          <Reserva
            telaAtiva="reserva"
            onNavegar={navegar}
            saldoDisponivel={resumo.saldo}
            guardado={guardadoReserva}
            onGuardar={guardarNaReserva}
            onRetirar={retirarDaReserva}
          />
        );

      case "pos-estagio":
        return (
          <PosEstagio
            telaAtiva="pos-estagio"
            onNavegar={navegar}
            reserva={guardadoReserva}
            despesasMes={resumo.saidas + resumo.pendentes}
          />
        );

      case "regra":
        return (
          <Regra
            telaAtiva="regra"
            onNavegar={navegar}
            regra502030={regra502030}
            renda={resumo.entradas}
          />
        );

      case "importar":
        return (
          <ImportarExtrato
            telaAtiva="importar"
            onNavegar={navegar}
            mes={mes}
            onMudarMes={setMes}
            lancamentos={lancamentos}
            onImportar={importarLancamentos}
          />
        );

      case "exportar":
        return (
          <Exportar
            telaAtiva="exportar"
            onNavegar={navegar}
            lancamentos={lancamentos}
          />
        );

      default:
        return (
          <Inicio
            telaAtiva="inicio"
            onNavegar={navegar}
            nomeUsuario={nomeUsuario}
            mes={mes}
            resumo={resumo}
            lancamentosDoMes={lancamentosDoMes}
            gastosPorCategoria={gastosPorCategoria}
            regra502030={regra502030}
            limites={limites}
            categorias={CATEGORIAS}
            onAdicionarEntrada={adicionarEntrada}
            onAdicionarDespesaFixa={adicionarDespesaFixa}
            onAdicionarSaida={adicionarSaida}
          />
        );
    }
  };

  return (
    <PeriodoContext.Provider value={{ mesEntrada }}>
      <SalarioContext.Provider
        value={{
          nomeUsuario,
          salarioAtual:    salario.valor,
          diaAtual:        salario.diaRecebimento,
          onSalvarSalario: alterarSalario,
        }}
      >
        {renderTela()}
      </SalarioContext.Provider>
    </PeriodoContext.Provider>
  );
}

export default App;