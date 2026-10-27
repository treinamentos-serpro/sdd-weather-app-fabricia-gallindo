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

### Aplicação integrada

A composição em [src/App.tsx](src/App.tsx) conecta busca, unidade, hero, previsão
e estados ao [useWeather](src/hooks/useWeather.ts). O header reúne a marca,
SearchBar e UnitToggle. A tela inicia em `idle`, sem chamadas de rede. Uma busca
válida consulta o geocoding e carrega o clima da primeira cidade retornada.

A tela exibe LoadingState durante as consultas, EmptyState quando não há
resultados, ErrorState com a mensagem do serviço e `retry` no botão “Tentar
novamente”, ou CurrentWeather e ForecastList em `success`. A busca fica
desabilitada durante loading. O resultado recebe foco após busca/retry com sucesso.
O seletor de demonstração e o mock foram removidos do fluxo da aplicação.

A unidade permanece no estado de UI do App, começa em Celsius e é mantida
entre buscas e erros. A conversão ocorre somente na renderização, sem modificar
os dados recebidos nem chamar a rede.
[src/app/App.tsx](src/app/App.tsx) mantém compatibilidade com imports anteriores.

### Busca de cidade

O [SearchBar](src/components/SearchBar.tsx) recebe `onSearch(city: string)` e
`disabled` (opcional, `false` por padrão). O callback é chamado ao enviar o
formulário por botão ou Enter, com espaços externos removidos; uma entrada vazia
exibe validação sem disparar busca. `disabled` desabilita o input e o botão e
bloqueia o envio.

O componente reutiliza o formulário de [CitySearch](src/components/CitySearch.tsx),
preservando sua API de loading, com label acessível, landmark `search` e estilo
glassmorphism. Não consulta a API.

O serviço [weatherService](src/services/weatherService.ts) exporta
`searchCities(name): Promise<City[]>` para consultar o geocoding da Open-Meteo.
Remove espaços externos, codifica o nome com `encodeURIComponent` e não chama a
rede para entradas vazias. Resultados ausentes retornam `[]`; campos opcionais
ausentes viram `null`, e `contextLabel` reúne região e país disponíveis.
Respostas HTTP não-ok lançam `WeatherServiceError`, com o status HTTP; falhas de
leitura do JSON são propagadas. O formulário usa o serviço por meio do hook.

O mesmo serviço exporta `getWeather(city): Promise<WeatherData>` para consultar
condições atuais e cinco dias (hoje e os quatro seguintes) na Forecast API.
Solicita Celsius, km/h e mm, com `timezone=auto`; mapeia os arrays diários pelo
mesmo índice, preserva medições indisponíveis como `null` e registra `fetchedAt`.
Atualiza o fuso na cópia da cidade quando informado pelo provedor, sem alterar
a cidade recebida. Respostas sem `current`, `daily`, horário atual ou cinco datas
diárias lançam `WeatherServiceError`, assim como respostas HTTP não-ok.

As duas consultas usam `fetchWithTimeout`, com `AbortController` e limite de
10 segundos para receber a resposta HTTP. O timer é limpo no `finally`, tanto em
sucesso quanto em erro. `AbortError` vira `WeatherServiceError` com a mensagem
“A requisição demorou demais.”; falhas de rede (`TypeError` do `fetch`) viram
“Falha de rede.”. Esses erros não têm status HTTP.

### Hook de consulta

O [useWeather](src/hooks/useWeather.ts) expõe `status`
(`idle | loading | success | error | empty`), `data`, `cities`, `error` e `query`,
além das ações assíncronas `search(name)`, `selectCity(city)` e `retry()`.
Começa em `idle`, com dados/erro nulos, cidades vazias e consulta vazia.

- `search` apara o nome, valida entradas vazias sem acessar os serviços e busca
  cidades. Havendo resultados, consulta automaticamente o clima da primeira;
  sem resultados, termina em `empty` sem chamar forecast.
- `selectCity` consulta o clima da cidade informada sem repetir o geocoding.
- `retry` repete a última consulta iniciada: geocoding com o mesmo nome ou,
  depois de encontrar/selecionar uma cidade, forecast com a mesma cidade.
  Antes de qualquer ação, não faz nada.

Novas consultas entram em `loading` e limpam o erro anterior. Dados já carregados
são preservados durante loading, erro e busca sem resultados. Erros são expostos
como mensagens em `error`. Respostas obsoletas são descartadas após uma nova ação
ou desmontagem, sem cancelar a requisição HTTP em andamento.

### Acessibilidade e responsividade

Revisão e correções de 27/10/2026:

- Texto dos botões de destaque usa `night-900`: contraste de 5,39:1 sobre
  `accent-500` (antes, branco atingia apenas 3,51:1). Placeholder usa `slate-400`,
  com 6,99:1 sobre `night-800`. Bordas de controles também têm contraste testado.
- Link “Pular para o conteúdo”, foco visível, retorno ao input após busca vazia
  e foco no resultado após busca/retry com sucesso.
- O formulário possui nome acessível e associa erro ao campo; editar a consulta
  remove a indicação anterior de erro.
- Textos longos e valores indisponíveis quebram linha sem ocultar conteúdo;
  o hero reduz o tamanho de “Indisponível”, mantendo temperaturas em destaque.
- [Testes no navegador](tests/e2e/accessibility.spec.ts) cobrem os cinco cenários
  em 320, 375, 640, 768, 1024 e 1440 px, colunas da previsão, teclado,
  contraste normal/hover dos controles, campos nulos, nomes longos,
  alvos de toque de pelo menos 44 px e redução de movimento.
- [Fluxo integrado](tests/e2e/weather-flow.spec.ts) cobre busca, previsão, unidade
  e retry em 320 px. Os testes interceptam geocoding/forecast com fixtures
  determinísticas, sem acessar a API real.

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
