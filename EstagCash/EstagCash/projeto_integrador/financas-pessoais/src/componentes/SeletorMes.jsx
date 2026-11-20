import { useContext } from "react";
import { PeriodoContext } from "./PeriodoContext";
import { formatarMes, listarMeses } from "../logica/Periodo";
import "../estilos/SeletorMes.css";

function IconeCalendario() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 17.5h.01M12 17.5h.01" strokeWidth="2" />
    </svg>
  );
}

export function IconeSeta() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/**
 * @param {string}   valor     mês selecionado, "AAAA-MM"
 * @param {Function} onChange  recebe o novo mês, "AAAA-MM"
 * @param {string[]} [opcoes]  só para casos com regra própria (ex.: fim do estágio).
 *                             Sem isso, usa o intervalo padrão: mês de entrada → mês atual + 12.
 * @param {string}   [id]
 * @param {boolean}  [icone]   mostra o ícone de calendário (padrão: sim)
 * @param {string}   [className] classes extras (tamanho/variação por tela)
 */
export default function SeletorMes({
  valor,
  onChange,
  opcoes,
  id,
  icone = true,
  className = "",
  ...resto
}) {
  const { mesEntrada } = useContext(PeriodoContext);
  const lista = opcoes ?? listarMeses(mesEntrada);

  // Se o valor atual estiver fora da lista (dado antigo), ele continua aparecendo
  // em vez de o campo mostrar um mês diferente do que está de fato selecionado.
  const itens = valor && !lista.includes(valor) ? [...lista, valor].sort() : lista;

  return (
    <div className={`seletor-mes ${className}`.trim()}>
      {icone && <span className="seletor-mes__icone"><IconeCalendario /></span>}
      <select id={id} value={valor} onChange={(e) => onChange(e.target.value)} {...resto}>
        {itens.map((mes) => (
          <option key={mes} value={mes}>{formatarMes(mes)}</option>
        ))}
      </select>
      <span className="seletor-mes__seta"><IconeSeta /></span>
    </div>
  );
}
