import { useContext, useMemo, useState } from "react";
import NavBar from "../componentes/navBar";
import SeletorMes from "../componentes/SeletorMes";
import { PeriodoContext } from "../componentes/PeriodoContext";
import { indiceParaMes, intervaloDeMeses, listarMesesEntre, mesParaIndice } from "../logica/Periodo";
import "../estilos/PosEstagio.css";
import {
  CENARIOS,
  formatarMoeda,
  formatarNumero,
  indiceDoMesAtual,
  lerPremissas,
  lerReserva,
  nomeMes,
  rotuloMesCurto,
  salvarPremissas,
  simular,
} from "../logica/SimuladorPosEstagio";

const MAX_MESES_SEM_RENDA = 6;

const CORES = {
  otimista: "#12805C",
  realista: "#4F52D9",
  pessimista: "#B7791F",
};

/* ---------- Campos ---------- */

function CampoMoeda({ id, rotulo, valor, onChange }) {
  function aoDigitar(e) {
    // só dígitos; os 2 últimos viram centavos
    const digitos = e.target.value.replace(/\D/g, "").slice(0, 9);
    onChange(digitos ? Number(digitos) / 100 : 0);
  }

  return (
    <div className="pos-campo">
      <label htmlFor={id}>{rotulo}</label>
      <div className="pos-moeda">
        <span>R$</span>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          value={formatarNumero(valor)}
          onChange={aoDigitar}
        />
      </div>
    </div>
  );
}

/* ---------- Gráfico ---------- */

function passoAgradavel(intervalo) {
  if (intervalo <= 0) return 1000;
  const bruto = intervalo / 4;
  const base = Math.pow(10, Math.floor(Math.log10(bruto)));
  const mult = [1, 2, 2.5, 5, 10].find((m) => m * base >= bruto);
  return mult * base;
}

const rotuloEixo = (v) => `${v < 0 ? "−" : ""}R$ ${Math.abs(v)}`;

function Grafico({ resultado, fimIdx, selecionado }) {
  const L = 720, A = 230;
  const mE = 64, mD = 40, mT = 12, mB = 34;
  const larguraUtil = L - mE - mD;
  const alturaUtil = A - mT - mB;
  const n = resultado.pontos;

  const todos = CENARIOS.flatMap(({ chave }) => resultado.cenarios[chave].saldos);
  const minVal = Math.min(0, ...todos);
  const maxVal = Math.max(0, ...todos);
  const passo = passoAgradavel(maxVal - minVal);
  const tickMin = Math.floor(minVal / passo) * passo;
  let tickMax = Math.ceil(maxVal / passo) * passo;
  if (tickMax === tickMin) tickMax = tickMin + passo; // evita divisão por zero quando tudo é 0

  const ticks = [];
  for (let v = tickMax; v >= tickMin - 0.001; v -= passo) ticks.push(Math.round(v));

  const x = (i) => mE + (n === 1 ? 0 : (i * larguraUtil) / (n - 1));
  const y = (v) => mT + ((tickMax - v) / (tickMax - tickMin)) * alturaUtil;

  const caminho = (saldos) =>
    saldos.map((s, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(s).toFixed(1)}`).join(" ");

  // desenha o selecionado por último, para ficar por cima
  const ordem = [
    ...CENARIOS.filter((c) => c.chave !== selecionado),
    ...CENARIOS.filter((c) => c.chave === selecionado),
  ];

  const sel = resultado.cenarios[selecionado];
  const rotuloPior = formatarMoeda(sel.piorSaldo);
  const larguraChip = 14 + rotuloPior.length * 6.6;
  const px = x(sel.indicePior);
  const py = y(sel.piorSaldo);
  const chipX = Math.min(px + 14, L - mD - larguraChip + 20);
  const chipY = Math.min(py + 6, A - mB - 26);

  // com muitos pontos, mostra um rótulo sim, outro não
  const pular = n > 8 ? 2 : 1;

  return (
    <svg className="pos-grafico" viewBox={`0 0 ${L} ${A}`} role="img"
      aria-label="Saldo mês a mês nos cenários otimista, realista e pessimista">
      {tickMin < 0 && (
        <rect x={mE} y={y(0)} width={larguraUtil} height={y(tickMin) - y(0)} fill="#FDECEF" />
      )}

      {ticks.map((t) => (
        <g key={t}>
          <line x1={mE} x2={L - mD} y1={y(t)} y2={y(t)}
            stroke={t === 0 ? "#B9BCD3" : "#EEF0F6"} strokeDasharray={t === 0 ? "5 4" : "0"} />
          <text x={mE - 12} y={y(t) + 3.5} textAnchor="end" className="pos-grafico__eixo">
            {rotuloEixo(t)}
          </text>
        </g>
      ))}

      {ordem.map(({ chave }) => {
        const ativo = chave === selecionado;
        const cor = CORES[chave];
        const saldos = resultado.cenarios[chave].saldos;
        return (
          <g key={chave}>
            <path d={caminho(saldos)} fill="none" stroke={cor}
              strokeWidth={ativo ? 3 : 2} strokeDasharray={ativo ? "0" : "5 4"}
              strokeLinecap="round" strokeLinejoin="round" />
            {saldos.map((s, i) => (
              <circle key={i} cx={x(i)} cy={y(s)} r={ativo ? 3.5 : 2.2} fill={cor}
                stroke={ativo ? "#fff" : "none"} strokeWidth="1.5" />
            ))}
          </g>
        );
      })}

      {sel.piorSaldo < 0 && (
        <g>
          <rect x={chipX} y={chipY} width={larguraChip} height="24" rx="6" fill="#E8EAFB" />
          <text x={chipX + larguraChip / 2} y={chipY + 16} textAnchor="middle" className="pos-grafico__chip">
            {rotuloPior}
          </text>
        </g>
      )}

      {Array.from({ length: n }, (_, i) =>
        i % pular === 0 ? (
          <text key={i} x={x(i)} y={A - 10} textAnchor="middle" className="pos-grafico__eixo pos-grafico__eixo--mes">
            {rotuloMesCurto(fimIdx + i)}
          </text>
        ) : null
      )}
    </svg>
  );
}

/* ---------- Tela ---------- */

const textoMeses = (n) => `${n} ${n === 1 ? "mês" : "meses"}`;

export default function PosEstagio({
  telaAtiva   = "pos-estagio",
  onNavegar   = () => {},
  reserva     = null,  // reserva de emergência atual (vem do App)
  despesasMes = 0,     // saídas + pendentes do mês (vem do App)
}) {
  // Intervalo padrão do sistema: mês de entrada do usuário → mês atual + 12
  const { mesEntrada } = useContext(PeriodoContext);
  const { inicio, fim } = intervaloDeMeses(mesEntrada);
  const inicioIdx = mesParaIndice(inicio);
  const fimJanelaIdx = mesParaIndice(fim);

  // Mês de referência da simulação: sempre o mês atual
  const refIdx = indiceDoMesAtual();

  const [form, setForm] = useState(() => {
    const salvo = lerPremissas();
    const ref = indiceDoMesAtual();
    // regra de negócio: o fim do estágio vem depois da referência; e cabe no intervalo
    const fimMax = Math.max(fimJanelaIdx, ref + 1);
    return {
      fimIdx: salvo && salvo.fimIdx > ref ? Math.min(salvo.fimIdx, fimMax) : ref + 5,
      mesesSemRenda: salvo?.mesesSemRenda ?? 2,
      salario: salvo?.salario ?? 2800,
      // despesas: o que o usuário salvou; senão, as despesas reais do mês
      despesas: salvo?.despesas ?? (despesasMes > 0 ? Math.round(despesasMes * 100) / 100 : 1500),
      // reserva: sempre o valor atual da reserva de emergência
      reserva: reserva ?? lerReserva(),
    };
  });
  // "aplicado" só muda quando o usuário clica em Simular
  const [aplicado, setAplicado] = useState(form);
  const [selecionado, setSelecionado] = useState("realista");

  const resultado = useMemo(() => simular({ ...aplicado, refIdx }), [aplicado, refIdx]);

  const atualizar = (campo) => (valor) => setForm((f) => ({ ...f, [campo]: valor }));

  function aoSimular(e) {
    e.preventDefault();
    setAplicado(form);
    salvarPremissas(form);
  }

  // Fim do estágio: mesmo intervalo, mas sempre depois do mês de referência
  // (a simulação exige fim > referência, então há ao menos uma opção).
  const opcoesFim = listarMesesEntre(
    indiceParaMes(Math.max(inicioIdx, refIdx + 1)),
    indiceParaMes(Math.max(fimJanelaIdx, refIdx + 1))
  );

  const cenario = resultado.cenarios[selecionado];
  const nomeSelecionado = CENARIOS.find((c) => c.chave === selecionado).nome;
  const fechaConta = cenario.falta === 0;

  const autonomia = resultado.autonomia;
  const textoAutonomia = Number.isFinite(autonomia)
    ? `Sua reserva cobre ${autonomia.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} ${autonomia === 1 ? "mês" : "meses"} de despesas.`
    : "Sem despesas informadas, a reserva não é consumida.";

  return (
    <div className="pos-pagina">
      <NavBar telaAtiva={telaAtiva} onNavegar={onNavegar} />

      <main className="pos-conteudo">
        <header className="pos-topo">
          <div>
            <h1>Simulador do pós-estágio</h1>
            <p>Veja como ficam suas contas quando o estágio acabar.</p>
          </div>
        </header>

        <div className="pos-grade">
          {/* ---- Premissas ---- */}
          <form className="pos-painel pos-premissas" onSubmit={aoSimular}>
            <h2>Suas premissas</h2>
            <p className="pos-painel__sub">Planeje o próximo capítulo.</p>

            <div className="pos-campo">
              <label htmlFor="pos-fim">Fim do estágio</label>
              <SeletorMes
                valor={indiceParaMes(form.fimIdx)}
                onChange={(m) => atualizar("fimIdx")(mesParaIndice(m))}
                opcoes={opcoesFim}
                id="pos-fim"
                className="seletor-mes--bloco seletor-mes--centro"
              />
            </div>

            <div className="pos-campo">
              <span className="pos-rotulo" id="rotulo-tempo">Tempo até a nova renda</span>
              <div className="pos-stepper" role="group" aria-labelledby="rotulo-tempo">
                <button type="button" aria-label="Diminuir um mês"
                  disabled={form.mesesSemRenda <= 1}
                  onClick={() => atualizar("mesesSemRenda")(form.mesesSemRenda - 1)}>−</button>
                <output aria-live="polite">{textoMeses(form.mesesSemRenda)}</output>
                <button type="button" aria-label="Aumentar um mês"
                  disabled={form.mesesSemRenda >= MAX_MESES_SEM_RENDA}
                  onClick={() => atualizar("mesesSemRenda")(form.mesesSemRenda + 1)}>+</button>
              </div>
            </div>

            <CampoMoeda id="pos-salario" rotulo="Salário líquido esperado" valor={form.salario} onChange={atualizar("salario")} />
            <CampoMoeda id="pos-despesas" rotulo="Despesas mensais" valor={form.despesas} onChange={atualizar("despesas")} />
            <CampoMoeda id="pos-reserva" rotulo="Reserva disponível" valor={form.reserva} onChange={atualizar("reserva")} />

            <button type="submit" className="pos-botao">Simular</button>
            <p className="pos-nota">Ajuste as premissas para explorar outros caminhos para sua transição.</p>
          </form>

          {/* ---- Resultados ---- */}
          <div className="pos-resultados">
            <section className={`pos-hero ${fechaConta ? "pos-hero--ok" : ""}`} aria-live="polite">
              <span className="pos-hero__selo">Cenário {nomeSelecionado.toLowerCase()}</span>
              <h2>
                {fechaConta
                  ? "Sua reserva atravessa a transição"
                  : `Faltam ${formatarMoeda(cenario.falta)} para atravessar a transição`}
              </h2>
              <p>
                {fechaConta
                  ? `Seu pior saldo é ${formatarMoeda(cenario.piorSaldo)}. Não precisa guardar nada extra.`
                  : `Guarde ${formatarMoeda(cenario.guardarPorMes)} por mês até ${nomeMes(aplicado.fimIdx)} de ${Math.floor(aplicado.fimIdx / 12)} para fechar a conta`}
              </p>
              <p className="pos-hero__extra">
                {textoAutonomia}
                {!resultado.salarioCobreDespesas && " Atenção: o salário esperado é menor que as despesas, então o saldo continua caindo mesmo com a nova renda."}
              </p>
            </section>

            <section className="pos-painel">
              <h2>Cenários</h2>
              <div className="pos-cenarios" role="radiogroup" aria-label="Cenário">
                {CENARIOS.map(({ chave, nome }) => {
                  const c = resultado.cenarios[chave];
                  return (
                    <label key={chave}
                      className={`pos-cenario pos-cenario--${chave} ${selecionado === chave ? "pos-cenario--ativo" : ""}`}>
                      <input type="radio" name="cenario" value={chave}
                        checked={selecionado === chave} onChange={() => setSelecionado(chave)} />
                      <span className="pos-cenario__radio" aria-hidden="true" />
                      <strong className="pos-cenario__nome">{nome}</strong>
                      <span className="pos-cenario__meses">{c.mesesSemRenda} {c.mesesSemRenda === 1 ? "mês" : "meses"} sem renda</span>
                      <span className="pos-cenario__pior">
                        <small>Pior saldo</small>
                        <b>{formatarMoeda(c.piorSaldo)}</b>
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>

            <section className="pos-painel">
              <h2>Saldo mês a mês</h2>
              <p className="pos-painel__sub">Da reserva disponível à chegada da nova renda.</p>

              <ul className="pos-legenda">
                {CENARIOS.map(({ chave, nome }) => (
                  <li key={chave}>
                    <i className={`pos-legenda__traco ${chave === "realista" ? "" : "pos-legenda__traco--tracejado"}`}
                      style={{ "--cor": CORES[chave] }} />
                    {nome}
                  </li>
                ))}
              </ul>

              <Grafico resultado={resultado} fimIdx={aplicado.fimIdx} selecionado={selecionado} />

              <p className="pos-rodape">
                {capitalizarMes(aplicado.fimIdx)}: saldo inicial. Nova renda após{" "}
                {resultado.cenarios.otimista.mesesSemRenda}, {resultado.cenarios.realista.mesesSemRenda} ou{" "}
                {resultado.cenarios.pessimista.mesesSemRenda} meses sem renda.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

function capitalizarMes(idx) {
  const nome = nomeMes(idx);
  return nome.charAt(0).toUpperCase() + nome.slice(1);
}