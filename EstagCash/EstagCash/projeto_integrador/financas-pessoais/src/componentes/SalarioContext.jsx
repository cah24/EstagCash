import { createContext } from "react";

// Guarda o nome do usuário, o salário e a função de alterar, para o NavBar (que está dentro
// de cada tela) acessar sem precisar de props passando por todas as telas.
// O valor real é fornecido pelo App.jsx.
export const SalarioContext = createContext({
  nomeUsuario:     "",
  salarioAtual:    0,
  diaAtual:        1,
  onSalvarSalario: () => {},
});