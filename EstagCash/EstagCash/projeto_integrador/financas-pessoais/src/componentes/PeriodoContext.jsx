import { createContext } from "react";

// Guarda o mês de entrada do usuário ("AAAA-MM") para que qualquer seletor de
// data do sistema monte o mesmo intervalo de meses sem receber props de tela em tela.
// O valor real é fornecido pelo App.jsx. Sem provider, vale null (o intervalo
// então começa no mês atual).
export const PeriodoContext = createContext({
  mesEntrada: null,
});
