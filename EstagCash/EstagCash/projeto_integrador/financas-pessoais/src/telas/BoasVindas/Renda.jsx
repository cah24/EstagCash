import { useState } from "react";
import Cabecalho from "../../componentes/Cabecalho";
import "../../estilos/BoasVindas.css";
import "../../estilos/Renda.css";

// Máscara de moeda: digitou 2000000 -> "20.000,00"
const mascararValor = (texto) => {
  const digitos = texto.replace(/\D/g, "").slice(0, 12);
  if (!digitos) return "";
  return (parseInt(digitos, 10) / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// "20.000,00" -> 20000
const valorParaNumero = (texto) =>
  texto ? parseFloat(texto.replace(/\./g, "").replace(",", ".")) : 0;

export default function Renda({ onEntrar, onPular }) {
  const [valor, setValor] = useState("");
  const [dia, setDia] = useState("");

  const diaValido = dia === "" || (Number(dia) >= 1 && Number(dia) <= 31);

  const enviar = (e) => {
    e.preventDefault();
    if (diaValido) onEntrar({ valor: valorParaNumero(valor), dia });
  };

  return (
    <main className="renda-tela">
      <Cabecalho passoAtual={2} />

      <section className="renda-tela__conteudo">
        <div className="renda-tela__apresentacao">
          <h1 className="renda-tela__titulo">Quanto você recebe por mês?</h1>
          <p className="renda-tela__descricao">
            Um primeiro passo para organizar seu dinheiro.
          </p>
        </div>

        <form className="renda-tela__form" onSubmit={enviar}>
          <div className="renda-tela__dados">
            <div className="renda-tela__campo">
              <label htmlFor="valor" className="renda-tela__rotulo">
                Valor
              </label>
              <div className="renda-tela__moeda-wrap">
                <span className="renda-tela__moeda">R$</span>
                <input
                  id="valor"
                  className="renda-tela__moeda-input"
                  type="text"
                  inputMode="numeric"
                  placeholder="0,00"
                  value={valor}
                  onChange={(e) => setValor(mascararValor(e.target.value))}
                />
              </div>
            </div>

            <div className="renda-tela__campo">
              <label htmlFor="dia" className="renda-tela__rotulo">
                Dia do recebimento (1 a 31)
              </label>
              <input
                id="dia"
                className="renda-tela__entrada"
                type="number"
                min="1"
                max="31"
                placeholder="Ex.: 5"
                value={dia}
                onChange={(e) => setDia(e.target.value)}
              />
            </div>

            <p className="renda-tela__recorrencia">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m2 9 3-3 3 3" />
                <path d="M13 18H7a2 2 0 0 1-2-2V6" />
                <path d="m22 15-3 3-3-3" />
                <path d="M11 6h6a2 2 0 0 1 2 2v10" />
              </svg>
              Entra sozinho todo mês
            </p>
          </div>

          <div className="renda-tela__acoes">
            <button className="renda-tela__botao" type="submit" disabled={!diaValido}>
              Entrar no EstagCash
            </button>
            <button type="button" className="renda-tela__pular" onClick={onPular}>
              Pular por enquanto
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}