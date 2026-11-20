import { useState } from "react";
import Cabecalho from "../../componentes/Cabecalho";
import "../../estilos/Nome.css";

export default function Nome({ onContinuar }) {
  const [nome, setNome] = useState("");

  function enviar(e) {
    e.preventDefault();
    if (!nome.trim()) return;
    onContinuar?.(nome.trim());
  }

  return (
    <main className="nome-tela">
      <Cabecalho passoAtual={1} />

      <div className="nome-tela__conteudo">
        <section className="nome-tela__bloco">
          <header className="nome-tela__apresentacao">
            <h1 className="nome-tela__titulo">Como podemos te chamar?</h1>
            <p className="nome-tela__descricao">Pode ser só o primeiro nome.</p>
          </header>

          <form className="nome-tela__form" onSubmit={enviar}>
            <div className="nome-tela__campo">
              <label htmlFor="nome" className="nome-tela__rotulo">
                Nome
              </label>
              <input
                id="nome"
                className="nome-tela__entrada"
                type="text"
                placeholder="Seu nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                autoComplete="given-name"
              />
            </div>

            <button type="submit" className="nome-tela__botao">
              Continuar
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}