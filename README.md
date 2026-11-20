# 💰 EstagCash

**Gestão financeira para quem está no estágio.**

O EstagCash ajuda estagiários a controlar a renda, planejar o mês, montar uma reserva de emergência e se preparar para o que vem depois: o fim do estágio. Tudo roda no navegador, sem cadastro e sem servidor.

## Índice

- [Contexto do projeto](#contexto-do-projeto)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Como executar o projeto](#como-executar-o-projeto)
- [Dependências](#dependências)
- [Importando o extrato do banco](#importando-o-extrato-do-banco)
- [Relatório no terminal (Python)](#relatório-no-terminal-python)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Como os dados são guardados](#como-os-dados-são-guardados)
- [Autora](#autora)

## Contexto do projeto

O estágio costuma ser a primeira renda de muita gente, e vem com uma data para acabar. Surgem perguntas que ninguém ensinou a responder: quanto posso gastar este mês? Estou gastando demais com lazer? Vale a pena guardar? E quando o estágio terminar, meu dinheiro dura até a próxima renda chegar?

O EstagCash organiza essas respostas em um só lugar. A pessoa informa quanto recebe, registra entradas, despesas fixas e gastos do dia a dia (ou importa o extrato do banco), e o site calcula o saldo disponível, acompanha as metas, monta a reserva de emergência e simula o período entre o fim do estágio e a nova renda.

O projeto é uma aplicação web de página única (SPA) em React, com a lógica de negócio separada das telas e dos componentes.

## Funcionalidades

### Primeiros passos
- **Boas-vindas em 3 etapas:** apresentação, nome e renda mensal (valor e dia de recebimento). A renda pode ser pulada e informada depois.
- **Alterar salário** a qualquer momento pelo menu do usuário na barra lateral.

### Lançamentos
- **Entradas:** salário (recorrente, todo mês) e renda extra (avulsa, com data).
- **Despesas fixas:** aparecem todos os meses com dia de vencimento. Podem ser marcadas como pagas em cada mês e encerradas quando deixarem de existir.
- **Saídas do dia a dia:** com categoria e data. Em compras parceladas, só a parcela do mês entra no extrato.
- **Categorias fixas:** 14 categorias em três grupos (necessidades, desejos e poupança), como Moradia, Mercado, Transporte, Lazer e Assinaturas.
- **Detalhes e exclusão** de cada lançamento, com confirmação.

### Visão do mês
- **Início:** saldo do mês, gráfico de rosca com o maior gasto, resumo da regra 50/30/20, alertas de limite ultrapassado e últimas movimentações.
- **Saldo do mês:** extrato completo e saldo disponível, calculado como entradas − saídas − despesas pendentes − dinheiro guardado.
- **Seletor de mês:** navega do mês em que a pessoa começou a usar o app até 12 meses à frente.

### Planejamento
- **Regra 50/30/20:** acompanha quanto da renda foi para necessidades (50%), desejos (30%) e poupança (20%), com uma tela que explica a regra e dá um exemplo prático. O que está na reserva de emergência e nas metas conta como poupança.
- **Limites por categoria:** define quanto gastar em cada categoria no mês e acompanha o consumo.
- **Metas:** cria objetivos com valor-alvo, guarda e retira dinheiro, e mantém o histórico de aportes e retiradas.

### Reserva de emergência
- A **meta da reserva** é calculada a partir da **despesa média mensal** informada, para **3 meses**, **6 meses** ou um período personalizado (12 meses).
- Botões para **guardar** e **retirar** dinheiro, com **aviso de confirmação antes de retirar**. O valor guardado é descontado do saldo disponível do mês.
- Barra de progresso mostrando quanto já foi guardado e quanto falta.
- **Simulador de aporte:** campo e controle deslizante (até R$ 1.500 por mês) mostram em quantos meses a meta é atingida.
- **Gráfico de projeção** mês a mês, com a comparação de quanto tempo seria economizado guardando R$ 100 a mais por mês.

### Simulador do pós-estágio
Mostra como ficam as contas entre o fim do estágio e a chegada da nova renda. Você informa:

- fim do estágio;
- tempo até a nova renda (em meses);
- salário líquido esperado;
- despesas mensais (começam com as despesas reais do mês, ou com o valor que você salvou na última simulação);
- reserva disponível (já vem preenchida com o valor da reserva de emergência).

O simulador roda **três cenários** (otimista, realista e pessimista), varia o tempo sem renda em cada um e mostra:

- o pior saldo de cada cenário;
- quanto falta para atravessar a transição e **quanto guardar por mês** até o fim do estágio;
- por quantos meses a reserva cobre as despesas;
- um gráfico do saldo mês a mês;
- um aviso quando o salário esperado é menor que as despesas.

### Importar extrato
- Importa o **CSV do banco** (arrastando o arquivo ou escolhendo no computador) e transforma cada linha em lançamento.
- Reconhece sozinho o separador, a codificação do arquivo, o cabeçalho e os formatos de data e valor brasileiros.
- **Categoriza automaticamente** pelos nomes dos estabelecimentos (iFood, Uber, Netflix, farmácias, mercados e outros).
- Aponta lançamentos **duplicados** e os que precisam de **revisão** antes de entrar.
- Nada é adicionado antes da sua confirmação.

Veja o passo a passo em [Importando o extrato do banco](#importando-o-extrato-do-banco).

### Exportação
- **Exportar extrato** em **CSV** ou **JSON**, com filtro por período e categoria e pré-visualização antes de baixar.
- **Relatório no terminal** com o script `Relatorio.py` (veja [abaixo](#relatório-no-terminal-python)).

## Tecnologias

| Tecnologia | Uso |
| --- | --- |
| [React 19](https://react.dev/) | Interface e componentes |
| [Vite 8](https://vite.dev/) | Servidor de desenvolvimento e build |
| [Recharts](https://recharts.org/) | Gráfico de rosca da tela Início |
| [Lucide React](https://lucide.dev/) | Ícones da interface |
| SVG feito à mão | Gráficos da reserva de emergência e do pós-estágio |
| CSS puro | Estilos, um arquivo por tela ou componente |
| [Inter](https://fonts.google.com/specimen/Inter) (Google Fonts) | Fonte do site, carregada pela internet |
| `localStorage` | Persistência dos dados no navegador |
| ESLint | Análise estática do código |
| Python 3 (opcional) | Relatório financeiro no terminal |

## Como executar o projeto

### Pré-requisitos

- **[Node.js](https://nodejs.org/)** `20.19+` ou `22.12+` (exigência do Vite 8). O npm já vem junto.
- **[Git](https://git-scm.com/)** para clonar o repositório.
- **Python 3.7+** somente se for usar o `Relatorio.py` (opcional).

Para conferir as versões instaladas:

```bash
node -v
npm -v
```

### Passo a passo

1. **Clone o repositório**

   ```bash
   git clone https://github.com/cah24/EstagCash.git
   ```

2. **Entre na pasta do projeto.** O código fica em subpastas:

   ```bash
   cd EstagCash/EstagCash/EstagCash/projeto_integrador/financas-pessoais
   ```

3. **Instale as dependências**

   ```bash
   npm install
   ```

4. **Inicie o servidor de desenvolvimento**

   ```bash
   npm run dev
   ```

5. **Abra no navegador** o endereço exibido no terminal, normalmente <http://localhost:5173>.

Na primeira visita, o site mostra as telas de boas-vindas para você informar nome e renda.

> **Dica:** o servidor está configurado para aceitar conexões da rede. Para abrir o site no celular, use o endereço `Network` que o Vite mostra no terminal, com o celular na mesma rede Wi-Fi do computador.

### Scripts disponíveis

Execute dentro de `financas-pessoais`:

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Inicia o servidor de desenvolvimento com recarregamento automático |
| `npm run build` | Gera a versão de produção na pasta `dist/` |
| `npm run preview` | Serve localmente a versão gerada pelo build |
| `npm run lint` | Verifica o código com o ESLint |

## Dependências

Todas são instaladas automaticamente pelo `npm install`. Não é preciso baixar nada manualmente.

### Dependências de execução

| Pacote | Versão | Para que serve |
| --- | --- | --- |
| `react` | ^19.3.1 | Biblioteca de interface |
| `react-dom` | ^19.3.1 | Renderização do React no navegador |
| `recharts` | ^3.10.1 | Gráfico de rosca da tela Início |
| `lucide-react` | ^1.70.0 | Ícones da interface |

### Dependências de desenvolvimento

| Pacote | Versão | Para que serve |
| --- | --- | --- |
| `vite` | ^8.3.6 | Ferramenta de build e servidor de desenvolvimento |
| `@vitejs/plugin-react` | ^6.1.2 | Suporte a React no Vite |
| `eslint` | ^10.14.0 | Análise estática do código |
| `@eslint/js` | ^10.0.1 | Regras recomendadas do ESLint |
| `eslint-plugin-react-hooks` | ^7.1.1 | Regras para Hooks do React |
| `eslint-plugin-react-refresh` | ^0.5.7 | Regras para o Fast Refresh |
| `globals` | ^17.13.0 | Variáveis globais do navegador para o ESLint |
| `@types/react` | ^19.3.0 | Tipos do React (apoio do editor) |
| `@types/react-dom` | ^19.3.0 | Tipos do React DOM (apoio do editor) |

### Python (opcional)

O `Relatorio.py` **não usa nenhuma biblioteca externa**, só a biblioteca padrão do Python 3.7+. Não há `pip install`.

## Importando o extrato do banco

1. No app do seu banco, exporte o extrato em **CSV**.
2. No EstagCash, abra **Importar**.
3. **Etapa 1:** arraste o arquivo (`.csv` ou `.txt`) ou clique em **Escolher arquivo**. O app sugere quais colunas são **Data**, **Descrição** e **Valor**; confira e corrija se necessário.
4. **Etapa 2:** revise a prévia. Cada linha aparece como **pronta**, **para revisar** (sem categoria identificada) ou **duplicada** (já existe no app). Use os filtros para ver cada grupo e desmarque o que não quiser importar.
5. **Etapa 3:** confirme. Os lançamentos entram no app: valores positivos viram **renda extra** e valores negativos viram **saídas**, na categoria identificada.

O que o importador entende:

| Item | Formatos aceitos |
| --- | --- |
| Separador | `;`, `,` ou tabulação (detectado sozinho) |
| Codificação | UTF-8 ou Windows-1252 |
| Data | `12/11/2026`, `12/11/26`, `12-11-2026`, `12.11.2026`, `2026-11-12` e `12/11` (sem ano) |
| Valor | `-42,90`, `1.234,56`, `R$ 42,90`, `(42,90)`, `42,90-`, `42,90 D` e `42.90` |

Linhas com data ou valor inválido (títulos, totais, linhas vazias) são ignoradas, e o app informa quantas foram.

## Relatório no terminal (Python)

O script `Relatorio.py` lê o JSON exportado pelo site e imprime um resumo mensal no terminal: entradas, saídas, saldo, gastos por categoria com barras, lista de lançamentos e um resumo geral do período.

1. No site, abra **Exportar**, escolha o período e a categoria e clique em **Exportar JSON**. O arquivo `dados.json` é baixado.
2. No terminal, dentro de `financas-pessoais`, execute:

   ```bash
   python Relatorio.py
   ```

   Ou informe o arquivo:

   ```bash
   python Relatorio.py dados.json
   ```

Sem argumentos, o script procura sozinho o `dados*.json` mais recente na pasta atual, na pasta do script e na pasta Downloads (inclusive no OneDrive, no Windows), então não é preciso mover o arquivo. Em alguns sistemas o comando é `python3`.

## Estrutura do projeto

```text
EstagCash/
└── EstagCash/
    └── EstagCash/
        └── projeto_integrador/
            └── financas-pessoais/
                ├── index.html
                ├── package.json
                ├── vite.config.js
                ├── eslint.config.js
                ├── Relatorio.py              # Relatório financeiro no terminal
                ├── public/                   # Favicon e ícones
                └── src/
                    ├── main.jsx              # Ponto de entrada
                    ├── App.jsx               # Estado global e navegação entre telas
                    ├── telas/                # Páginas (Início, Saldo, Reserva, Pós-estágio, Importar...)
                    │   └── BoasVindas/       # Fluxo de primeiro acesso
                    ├── componentes/          # Menu, modais, seletores e contextos
                    ├── logica/               # Regras de negócio puras, sem React
                    ├── dados/                # Categorias, palavras-chave e acesso ao localStorage
                    └── estilos/              # CSS de cada tela e componente
```

A pasta `logica/` concentra as regras de negócio como funções puras (saldo, lançamentos, importação de extrato, simulador do pós-estágio, exportação), o que facilita testá-las e reaproveitá-las.

## Como os dados são guardados

O EstagCash **não tem back-end nem banco de dados**. Tudo fica no `localStorage` do seu navegador, inclusive a reserva de emergência e as premissas do simulador do pós-estágio:

- os dados ficam apenas no seu computador e não são enviados a nenhum servidor;
- cada navegador (e cada perfil) tem seus próprios dados;
- limpar os dados do site no navegador apaga tudo, então use **Exportar** para manter uma cópia.

## Autora

Desenvolvido por [@cah24](https://github.com/cah24).
