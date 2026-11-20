import "../estilos/NovoLancamento.css";

const ICONES = {
  fechar: (
    <>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </>
  ),
  entrada: (
    <>
      <path d="M17 7 7 17" />
      <path d="M17 17H7V7" />
    </>
  ),
  calendarioRelogio: (
    <>
      <path d="M16 14v2.2l1.6 1" />
      <path d="M16 2v4" />
      <path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5" />
      <path d="M3 10h5" />
      <path d="M8 2v4" />
      <circle cx="16" cy="16" r="6" />
    </>
  ),
  saida: (
    <>
      <path d="M7 7h10v10" />
      <path d="M7 17 17 7" />
    </>
  ),
};

function Icone({ nome, tamanho = 16 }) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONES[nome]}
    </svg>
  );
}

const OPCOES = [
  { tipo: "entrada", rotulo: "Entrada", icone: "entrada", tom: "verde" },
  { tipo: "despesa-fixa", rotulo: "Despesa fixa", icone: "calendarioRelogio", tom: "ambar" },
  { tipo: "saida", rotulo: "Saída", icone: "saida", tom: "vermelho" },
];

/*
  Menu que aparece ao clicar no "+" da tela Início.
  Props (todas opcionais por enquanto):
    onFechar()          → clicou no X ou fora do cartão
    onEscolher(tipo)    → "entrada" | "despesa-fixa" | "saida"
*/
export default function MenuNovoLancamento({ onFechar, onEscolher }) {
  return (
    <div
      className="mnl-fundo"
      onClick={(e) => e.target === e.currentTarget && onFechar?.()}
    >
      <div className="mnl-cartao" role="dialog" aria-modal="true" aria-label="Novo lançamento">
        <div className="mnl-topo">
          <button type="button" className="mnl-fechar" aria-label="Fechar" onClick={onFechar}>
            <Icone nome="fechar" tamanho={20} />
          </button>
        </div>

        <ul className="mnl-lista">
          {OPCOES.map((o) => (
            <li key={o.tipo}>
              <button
                type="button"
                className={`mnl-opcao mnl-tom-${o.tom}`}
                onClick={() => onEscolher?.(o.tipo)}
              >
                <span className="mnl-icone">
                  <Icone nome={o.icone} tamanho={16} />
                </span>
                {o.rotulo}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}