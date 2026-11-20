import { Home, Heart, PiggyBank, Info, ArrowLeft } from "lucide-react";
import NavBar from "../componentes/navBar";
import "../estilos/Regra.css";

const DEFINICOES = [
  {
    id:         "necessidade",
    percentual: 50,
    nome:       "Necessidades",
    descricao:  "O essencial para o seu dia a dia.",
    exemplos:   "Moradia, luz, água, internet e telefone, mercado, transporte, saúde e educação.",
    icone:      Home,
  },
  {
    id:         "desejo",
    percentual: 30,
    nome:       "Desejos",
    descricao:  "O que deixa a vida mais leve.",
    exemplos:   "Restaurante e delivery, lazer, compras, assinaturas e outros.",
    icone:      Heart,
  },
  {
    id:         "poupanca",
    percentual: 20,
    nome:       "Poupança",
    descricao:  "Um passo de cada vez para o futuro.",
    exemplos:   "O dinheiro que você guarda nas suas metas.",
    icone:      PiggyBank,
  },
];

const passos = [
  { titulo: "Você registra",
    texto:  "Adicione suas entradas, gastos e o que guardou." },
  { titulo: "O app classifica cada categoria",
    texto:  "Tudo fica dividido entre necessidades, desejos e poupança." },
  { titulo: "Você acompanha no Início",
    texto:  "A barra da tela Início mostra como você está em cada parte." },
];

const moeda = (valor) =>
  Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Formata "R$ 1.500,00" → "R$ 1.500"
const moedaSemCentavos = (valor) => moeda(valor).replace(",00", "");

export default function Regra({
  telaAtiva   = "regra",
  onNavegar   = () => {},
  regra502030 = null,   // objeto com necessidade, desejo, poupanca
  renda       = 0,
}) {
  // Se não tiver dados reais ainda, usa a renda para o exemplo
  const rendaExemplo = renda > 0 ? renda : 3000;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <NavBar telaAtiva={telaAtiva} onNavegar={onNavegar} />

      <main className="regra">
        <header>
          <h1 className="regra__titulo">Entenda a regra 50/30/20</h1>
          <p className="regra__subtitulo">
            Uma forma simples de dividir sua renda sem planilha complicada.
          </p>
        </header>

        {/* Cards explicativos */}
        <section className="regra__cards">
          {DEFINICOES.map(({ id, percentual, nome, descricao, exemplos, icone: IconeComp }) => {
            const dados  = regra502030?.[id];
            const usado  = dados?.usado ?? null;
            const ref    = dados?.referencia ?? null;

            return (
              <article key={id} className={`regra__card regra__card--${id}`}>
                <div className="regra__card-topo">
                  <span className="regra__percentual">{percentual}%</span>
                  <span className="regra__icone"><IconeComp size={21} /></span>
                </div>
                <h2 className="regra__nome">{nome}</h2>
                <p className="regra__descricao">{descricao}</p>
                <p className="regra__exemplos">{exemplos}</p>

                {/* Mostra uso real se tiver dados */}
                {usado !== null && ref !== null && (
                  <div className="regra__uso">
                    <div className="regra__uso-barra">
                      <div
                        className="regra__uso-preenchimento"
                        style={{ width: `${Math.min((usado / ref) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="regra__uso-texto">
                      {moeda(usado)} de {moeda(ref)}
                    </span>
                  </div>
                )}
              </article>
            );
          })}
        </section>

        {/* Exemplo prático com a renda real do usuário */}
        <section className="regra__bloco">
          <div className="regra__bloco-topo">
            <h2 className="regra__bloco-titulo">Exemplo prático</h2>
            <span className="regra__renda">
              Com renda de <strong>{moedaSemCentavos(rendaExemplo)}</strong>
            </span>
          </div>

          <div className="regra__barra">
            {DEFINICOES.map(({ id, percentual }) => (
              <div
                key={id}
                className={`regra__segmento regra__segmento--${id}`}
                style={{ width: `${percentual}%` }}
              >
                {moedaSemCentavos((rendaExemplo * percentual) / 100)}
              </div>
            ))}
          </div>

          <div className="regra__legenda">
            {DEFINICOES.map(({ id, nome, percentual }) => (
              <span key={id} style={{ width: `${percentual}%` }}>
                {nome} · {percentual}%
              </span>
            ))}
          </div>
        </section>

        {/* Como o app faz */}
        <section className="regra__bloco">
          <h2 className="regra__bloco-titulo">Como o app faz isso por você</h2>
          <div className="regra__passos">
            {passos.map((passo, i) => (
              <div key={passo.titulo} className="regra__passo">
                <span className="regra__passo-num">{i + 1}</span>
                <div>
                  <strong>{passo.titulo}</strong>
                  <p>{passo.texto}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <p className="regra__aviso">
          <Info size={17} />
          É uma referência, não uma regra rígida. Se sua renda é pequena, ajustar aos poucos já ajuda.
        </p>

        <button className="regra__voltar" onClick={() => onNavegar("inicio")}>
          <ArrowLeft size={17} />
          Voltar para o Início
        </button>
      </main>
    </div>
  );
}