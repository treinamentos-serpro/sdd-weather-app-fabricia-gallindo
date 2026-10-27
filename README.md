<div align="center">

# SDD Weather App

### Treinamento hands-on de **Spec-Driven Development** com **GitHub Copilot**

**Brief → Spec → Plan → Tasks → Code → Test → Review → Ship**

</div>

---

Este repositório é um **laboratório de treinamento de 8 horas** que ensina a
construir software guiado por especificação (**Spec-Driven Development**) usando
o **GitHub Copilot** em todas as etapas. O projeto final é um **Weather App** em
React + TypeScript que consome a API Open-Meteo.

> ## Princípio central
> **NÃO COMECE PELO CÓDIGO.** Sempre: **Spec → Plan → Tasks → Code.**

---

## O workshop

Comece pelo **[Guia do Workshop](workshop/GUIDE.md)** e siga os módulos em ordem.

| # | Módulo | Fase | Duração |
| --- | --- | --- | --- |
| 01 | [Setup](workshop/module-01-setup/README.md) | Preparação | 30 min |
| 02 | [Understanding the Problem](workshop/module-02-discovery/README.md) | Discovery | 45 min |
| 03 | [Writing the Specification](workshop/module-03-spec/README.md) | Spec | 50 min |
| 04 | [Creating the Technical Plan](workshop/module-04-plan/README.md) | Plan | 45 min |
| 05 | [Breaking Down Tasks](workshop/module-05-tasks/README.md) | Tasks | 40 min |
| 06 | [Building the UI](workshop/module-06-ui/README.md) | Code | 60 min |
| 07 | [Integrating APIs](workshop/module-07-api/README.md) | Code | 60 min |
| 08 | [Testing](workshop/module-08-testing/README.md) | Test | 55 min |
| 09 | [Hardening](workshop/module-09-hardening/README.md) | Test | 50 min |
| 10 | [Pull Request Review](workshop/module-10-review/README.md) | Review | 45 min |
| 11 | [Delivery (GitHub Pages)](workshop/module-11-delivery/README.md) | Ship | 30 min |

Cada módulo tem **README.md**, **challenge.md**, **prompts.md** e
**solution.md**.

---

## Começando

### Pré-requisitos

- **Node.js**
- **pnpm** (único gerenciador de pacotes suportado — habilite com `corepack enable`)
- **GitHub Copilot** habilitado no VS Code
- Git e uma conta no GitHub (para PR e deploy)

> O repositório inclui um **DevContainer** com tudo pré-configurado. Abra em um
> Codespace ou em "Reopen in Container" e pule a instalação manual.

### Instalação

```bash
pnpm install
pnpm exec playwright install   # navegadores para os testes E2E
```

### Scripts

```bash
pnpm dev             # servidor de desenvolvimento (Vite)
pnpm build           # build de produção
pnpm preview         # serve o build localmente
pnpm lint            # Biome (lint)
pnpm format          # Biome (formatação)
pnpm check           # Biome (lint + formatação)
pnpm test            # testes unitários (Vitest)
pnpm test:coverage   # cobertura
pnpm test:e2e        # testes E2E (Playwright)
```

---

## Arquitetura do app

```text
src/
├── components/      # apresentação (um componente por arquivo)
│   └── states/      # loading, erro, vazio
├── hooks/           # orquestração (useWeather)
├── services/        # acesso a dados (Open-Meteo) isolado
├── lib/             # funções puras (conversão, formatação, códigos WMO)
├── types/           # contratos compartilhados
├── styles/          # Tailwind + estilos globais
├── App.tsx          # composição da tela
└── main.tsx         # bootstrap React
```

Decisões-chave:

- **Temperaturas em Celsius** internamente; conversão só na apresentação (o
  toggle °C/°F **não** faz nova requisição).
- **Rede isolada** em `services/` — componentes e hooks não conhecem URLs.
- Sempre tratar **loading**, **erro** e **vazio**.

### Demonstração offline

A composição em [src/App.tsx](src/App.tsx) conecta busca, unidade, hero, previsão
e estados sem API. O header reúne a marca, SearchBar e UnitToggle. O seletor
“Cenário de demonstração” permite visualizar idle/loading/empty/error/success;
a tela inicia em idle. Uma busca válida ou “Tentar novamente” exibe o mock de
São Paulo, independentemente do nome digitado, com aviso explícito de dados
fictícios e datas fixas. Loading permanece até escolher outro cenário.

A unidade começa em Celsius e é mantida ao alternar cenários. A conversão ocorre
somente na renderização, sem modificar o mock nem chamar a rede.
[src/app/App.tsx](src/app/App.tsx) mantém compatibilidade com imports anteriores.
O seletor pertence ao protótipo; o fluxo real via hooks/services ainda está pendente.

### Busca de cidade

O [SearchBar](src/components/SearchBar.tsx) recebe `onSearch(city: string)` e
`disabled` (opcional, `false` por padrão). O callback é chamado ao enviar o
formulário por botão ou Enter, com espaços externos removidos; uma entrada vazia
exibe validação sem disparar busca. `disabled` desabilita o input e o botão e
bloqueia o envio.

O componente reutiliza o formulário de [CitySearch](src/components/CitySearch.tsx),
preservando sua API de loading, com label acessível, landmark `search` e estilo
glassmorphism. Não consulta a API.

### Acessibilidade e responsividade do protótipo

Revisão e correções de 27/10/2026:

- Texto dos botões de destaque usa `night-900`: contraste de 5,39:1 sobre
  `accent-500` (antes, branco atingia apenas 3,51:1). Placeholder usa `slate-400`,
  com 6,99:1 sobre `night-800`. Bordas de controles também têm contraste testado.
- Link “Pular para o conteúdo”, foco visível, retorno ao input após busca vazia
  e foco no resultado após busca/retry. O seletor de cenário mantém seu foco.
- O formulário possui nome acessível e associa erro ao campo; editar a consulta
  remove a indicação anterior de erro.
- Textos longos e valores indisponíveis quebram linha sem ocultar conteúdo;
  o hero reduz o tamanho de “Indisponível”, mantendo temperaturas em destaque.
- [Testes no navegador](tests/e2e/accessibility.spec.ts) cobrem os cinco cenários
  em 320, 375, 640, 768, 1024 e 1440 px, colunas da previsão, teclado,
  contraste normal/hover dos controles, campos nulos, nomes longos,
  alvos de toque de pelo menos 44 px e redução de movimento.

Essas verificações não certificam conformidade WCAG. Permanecem recomendados:
teste manual dos anúncios com NVDA/VoiceOver, zoom/texto ampliado e modo de alto
contraste, além de execução em Firefox e Safari reais. Os testes Chromium
bloqueiam fontes externas e verificam a fonte fallback; revalidar com Inter
carregada na revisão visual de produção.

### Seletor de unidade

O [UnitToggle](src/components/UnitToggle.tsx) recebe `unit` (`'celsius'` ou
`'fahrenheit'`) e `onChange(unit)`. É um componente controlado: o consumidor
atualiza `unit` ao receber o callback. Os botões °C/°F expõem a seleção por
`aria-pressed` dentro do grupo “Unidade de temperatura”. Use Tab/Shift+Tab para
navegar e Enter ou Espaço para ativar. O controle não converte temperaturas nem
faz requisições.

### Clima atual

O [CurrentWeather](src/components/CurrentWeather.tsx) recebe `city`, `current`
e `unit`. Exibe temperatura e sensação térmica com uma casa decimal em pt-BR,
condição/ícone WMO de [weatherCodes](src/lib/weatherCodes.ts), umidade, vento e
precipitação. Valores nulos aparecem como “Indisponível”. Pressão também aparece
como “Indisponível”, por decisão de manter o contrato atual sem esse campo.
O componente não consulta a API e pode receber os dados do mock abaixo.

### Previsão diária

[ForecastList](src/components/ForecastList.tsx) recebe `forecast` e `unit` e
renderiza os dias na ordem fornecida, em grid responsivo de 2/3/5 colunas.
[ForecastCard](src/components/ForecastCard.tsx) também pode ser usado isoladamente
com `day` e `unit`. Cada card apresenta dia da semana e data em pt-BR, condição,
ícone, máxima/mínima e probabilidade de chuva. Valores ausentes são indicados como
“Indisponível”; uma lista vazia comunica que não há previsão.

```tsx
<ForecastList forecast={weatherDataMock.forecast} unit="celsius" />
```

Os helpers em [format.ts](src/lib/format.ts) preservam a data da cidade sem
reinterpretá-la no fuso do navegador e compartilham a formatação de temperaturas
com o hero.

### Estados de apresentação

Os componentes em [states/](src/components/states/) são independentes da rede:

- [LoadingState](src/components/states/LoadingState.tsx): `role="status"`, texto
  padrão de carregamento e prop `message` opcional. A animação respeita redução
  de movimento.
- [ErrorState](src/components/states/ErrorState.tsx): recebe `message` e `onRetry`;
  anuncia a mensagem com `role="alert"` e oferece “Tentar novamente”, acessível
  por teclado, sem retry automático.
- [EmptyState](src/components/states/EmptyState.tsx): título e dica iniciais;
  aceita `title` e `hint` para contextos como busca sem resultados.

O consumidor deve montar apenas o estado correspondente à requisição e remover
o loading quando ela terminar.

### Dados mock para desenvolver a UI

Os contratos de domínio estão em [src/types/weather.ts](src/types/weather.ts).
Para desenvolver componentes sem consultar a API, importe o objeto tipado:

```ts
import { weatherDataMock } from './src/mocks/weather';
```

O caminho acima é relativo à raiz; ajuste-o à localização do arquivo consumidor.
O [mock](src/mocks/weather.ts) contém dados fictícios de São Paulo, clima atual
e cinco dias consecutivos, com datas fixas de 27 a 31/10/2026. Não acompanha o
dia real nem representa uma consulta ao provedor. Temperaturas estão em Celsius,
precipitação em mm e vento em km/h; nos contratos, valores indisponíveis usam
`null`. A unidade de apresentação não altera os valores do domínio.

Os campos seguem a proposta do plano para prototipação; as decisões de produto
pendentes na especificação continuam abertas.

---

## Stack

- **TypeScript** (strict) · **React** · **Vite**
- **Tailwind CSS** (tema dark glassmorphism)
- **Vitest** + **Testing Library** (unit) · **Playwright** (E2E)
- **Biome** (lint + formatação)
- **pnpm** (gerenciador de pacotes)
- **Open-Meteo** (geocoding + forecast, sem API key)

---

## Copilot no fluxo SDD

A pasta `.github/` traz a inteligência do laboratório:

- **`agents/`** — personas especializadas: Spec, Plan, Task, Code, Test, Review.
- **`prompts/`** — prompts de produção para cada etapa.
- **`instructions/`** — convenções (React, Tailwind, Testing) aplicadas
  automaticamente.
- **`workflows/`** — CI (lint/build/test/e2e), deploy no Pages e validações que
  **impõem a ordem Spec → Plan → Tasks**.

Veja [AGENTS.md](AGENTS.md) para a descrição de cada agente.

---

## Idioma

- Narrativa, comentários e documentação: **pt-BR**.
- Identificadores de código, nomes de arquivos e termos técnicos: **en-US**.

---

<div align="center">

Construído com ❤️ para capacitar times em **Spec-Driven Development** usando o poder do GitHub Copilot.

</div>
