import SeletorMes, { IconeSeta } from "./SeletorMes";
import { diasNoMes, mesValido } from "../logica/Periodo";

/**
 * @param {string}   valor     "AAAA-MM-DD"
 * @param {Function} onChange  recebe "AAAA-MM-DD"
 * @param {string}   [id]      id do dropdown de mês (para o <label htmlFor>)
 * @param {boolean}  [invalido] destaca o campo em vermelho
 * @param {string}   [className]
 */
export default function SeletorData({ valor, onChange, id, invalido = false, className = "" }) {
  const mes = valor ? valor.slice(0, 7) : "";
  const dia = Number(valor?.slice(8, 10)) || 1;
  const totalDias = mesValido(mes) ? diasNoMes(mes) : 31;

  const montar = (novoMes, novoDia) => {
    const diaOk = Math.min(novoDia, diasNoMes(novoMes)); // 31/jan → 28/fev, etc.
    return `${novoMes}-${String(diaOk).padStart(2, "0")}`;
  };

  const classes = `seletor-data ${invalido ? "seletor-mes--erro" : ""} ${className}`.trim();

  return (
    <div className={classes}>
      <SeletorMes
        id={id}
        valor={mes}
        onChange={(novoMes) => onChange(montar(novoMes, dia))}
        aria-invalid={invalido || undefined}
      />
      <div className="seletor-mes seletor-mes--dia">
        <select
          id={id ? `${id}-dia` : undefined}
          aria-label="Dia"
          value={Math.min(dia, totalDias)}
          onChange={(e) => onChange(montar(mes, Number(e.target.value)))}
        >
          {Array.from({ length: totalDias }, (_, i) => i + 1).map((d) => (
            <option key={d} value={d}>{String(d).padStart(2, "0")}</option>
          ))}
        </select>
        <span className="seletor-mes__seta"><IconeSeta /></span>
      </div>
    </div>
  );
}
