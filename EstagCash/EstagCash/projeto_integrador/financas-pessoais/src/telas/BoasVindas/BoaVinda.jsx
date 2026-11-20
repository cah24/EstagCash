import "../../estilos/BoasVindas.css";
import "../../estilos/BoaVinda.css";
import Cabecalho from "../../componentes/Cabecalho";

export default function BoaVinda({ onComecar }) {
  return (
    <main className="tela tela-boas-vindas">
      <Cabecalho passoAtual={0} />

      <section className="conteudo">
        <div className="apresentacao">
          <h1 className="titulo">Vamos começar?</h1>
          <p className="subtitulo">Leva menos de 1 minuto</p>
        </div>

        <div className="formulario">
          <button className="botao" onClick={onComecar}>
            Começar
          </button>
        </div>
      </section>
    </main>
  );
}