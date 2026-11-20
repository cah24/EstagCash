import { Sprout } from "lucide-react";
import "../estilos/cabecalho.css";
import logoIcone from "../assets/favicon.svg";

export default function Cabecalho({ passoAtual = 0, total = 3 }) {
  return (
    <header className="marca-progresso">
      <div className="marca-progresso__marca">
        <img
          className="marca-progresso__logo"
          src={logoIcone}
          alt="EstagCash"
          width={32}
          height={32}
        />
        <span className="marca-progresso__nome">EstagCash</span>
      </div>

      <div className="marca-progresso__etapas">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={`marca-progresso__etapa ${
              i === passoAtual ? "marca-progresso__etapa--atual" : ""
            }`}
          />
        ))}
      </div>
    </header>
  );
}