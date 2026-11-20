import { useContext, useState } from "react";
import { createPortal } from "react-dom";
import { Home, Wallet, Flag, TrendingUp, ChevronDown, ShieldCheck, Download, FileDown, GraduationCap } from "lucide-react";
import "../estilos/NavBar.css";
import AlterarSalario from "../componentes/AlterarSalario";
import { SalarioContext } from "./SalarioContext";
import logoIcone from "../assets/favicon.svg";

// "Ana Carolina" -> "AC" | "Carol" -> "C"
function iniciais(nome) {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  const primeira = partes[0][0];
  const ultima   = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toUpperCase();
}

const links = [
  { id: "inicio", label: "Início", icon: Home },
  { id: "saldo", label: "Saldo do mês", icon: Wallet },
  { id: "metas", label: "Metas", icon: Flag },
  { id: "reserva", label: "Reserva", icon: ShieldCheck },
  { id: "pos-estagio", label: "Pós-estágio", icon: GraduationCap },
  { id: "regra", label: "Regra 50/30/20", icon: TrendingUp },
  { id: "importar", label: "Importar", icon: Download },
  { id: "exportar", label: "Exportar", icon: FileDown },
];

function NavBar({ telaAtiva = "inicio", onNavegar = () => {} }) {
  // Salário e dia vêm do App (fonte única). A NavBar só controla se o modal está aberto.
  const { nomeUsuario, salarioAtual, diaAtual, onSalvarSalario } = useContext(SalarioContext);
  const [salarioAberto, setSalarioAberto] = useState(false);

  const secaoAtiva = ["limites", "meta-detalhe"].includes(telaAtiva) ? "metas" : telaAtiva;

  return (
    <aside className="navbar">
      <div className="navbar__logo">
        <img
        className="navbar__logo-img"
        src={logoIcone}
        alt="EstagCash"
        width={30}
        height={30}
        />
        <span className="navbar__logo-text">EstagCash</span>
      </div>

      <nav className="navbar__nav">
        {links.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`navbar__link ${secaoAtiva === id ? "navbar__link--ativo" : ""}`}
            onClick={() => onNavegar(id)}
          >
            <Icon size={16} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div
        className="navbar__user navbar__user--clicavel"
        role="button"
        tabIndex={0}
        onClick={() => setSalarioAberto(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setSalarioAberto(true);
          }
        }}
      >
        <div className="navbar__avatar">{iniciais(nomeUsuario)}</div>
        <div className="navbar__user-info">
          <strong>{nomeUsuario || "Usuário"}</strong>
          <small>Meu primeiro estágio</small>
        </div>
        <ChevronDown size={14} />
      </div>

      {/* Modal desenhado no body, por cima de tudo */}
      {createPortal(
        <AlterarSalario
          aberto={salarioAberto}
          onFechar={() => setSalarioAberto(false)}
          onSalvar={onSalvarSalario}
          salarioAtual={salarioAtual}
          diaAtual={diaAtual}
        />,
        document.body
      )}
    </aside>
  );
}

export default NavBar;