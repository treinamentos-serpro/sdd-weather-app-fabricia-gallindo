# Backlog de Tarefas: Weather App

Derivado de [specs/weather-app-spec.md](../specs/weather-app-spec.md) e [plans/weather-app-plan.md](../plans/weather-app-plan.md). Tarefas marcadas como bloqueadas aguardam as decisões indicadas e não devem ser tratadas como prontas para produção.

## Entrega 1 — Fundação independente

### T-01 — Criar shell acessível da aplicação

- **Status:** base do shell concluída; AC-29 aguarda integração da busca.
- **Spec:** AC-23, AC-24, AC-29; RNF-01, RNF-02.
- **Critérios de aceite:**
  - A aplicação monta em `#root` e apresenta o estado inicial sem cidade selecionada.
  - Nenhum dado meteorológico ou loading é apresentado antes de uma consulta.
  - A estrutura permanece sem rolagem horizontal em viewport de 320 px.
  - Conteúdo principal tem heading semântico e foco visível.
- **Dependências:** nenhuma para o shell; busca disponível depende de T-03 e sua integração de T-05/T-07.
- **Arquivos prováveis:** `src/main.tsx`, `src/app/App.tsx`, `src/components/EmptyWeatherState.tsx`, `src/index.css`.

### T-02 — Adicionar conversões puras de temperatura

- **Status:** concluída.
- **Spec:** AC-12 a AC-14; RNF-05.
- **Critérios de aceite:**
  - `Unit` representa somente `celsius` ou `fahrenheit`.
  - Conversões Celsius↔Fahrenheit usam a fórmula correta e não arredondam o valor de domínio.
  - Testes cobrem ponto de congelamento, ebulição e conversão de volta com tolerância numérica.
- **Dependências:** nenhuma.
- **Arquivos prováveis:** `src/types/weather.ts`, `src/lib/temperature.ts`, `tests/unit/lib/temperature.test.ts`.

### T-03 — Criar componente de busca desacoplado do provedor

- **Status:** formulário implementado; resultados e integração bloqueados pelo T-04/T-05.
- **Spec:** AC-04, AC-05, AC-15; RNF-01, RNF-02.
- **Critérios de aceite:**
  - Busca vazia ou só com espaços não chama o callback.
  - Texto é aparado nas extremidades, preservando caracteres internos e acentos.
  - Formulário pode ser enviado por teclado e expõe estado de busca acessível.
  - O componente não importa services nem faz `fetch`.
- **Dependências:** nenhuma para o formulário; resultados dependem de T-04; integração depende de T-05.
- **Arquivos prováveis:** `src/components/CitySearch.tsx`, `tests/unit/components/CitySearch.test.tsx`.

## Entrega 2 — Contratos e APIs (aguarda decisões da spec)

### T-04 — Congelar contrato meteorológico e mapeadores

- **Status:** bloqueada — Open Questions 2, 3 e 9.
- **Spec:** AC-01, AC-07 a AC-11, AC-26.
- **Critérios de aceite:**
  - Campos de `City`, `CurrentWeather` e `ForecastDay` correspondem ao contrato aprovado.
  - Campos ausentes são normalizados para `null`; arrays diários permanecem alinhados por índice.
  - `contextLabel`, identidade da cidade e timezone usam atributos aprovados.
- **Dependências:** decisões das Open Questions 2, 3 e 9.
- **Arquivos prováveis:** `src/types/weather.ts`, `src/types/openMeteo.ts`, `src/lib/mapGeocoding.ts`, `src/lib/mapForecast.ts`, testes em `tests/unit/lib/`.

### T-05 — Implementar serviço de geocoding

- **Status:** bloqueada — Open Question 3.
- **Spec:** AC-01 a AC-07, AC-15 a AC-19.
- **Critérios de aceite:**
  - Service usa o provedor e parâmetros aprovados, recebe `AbortSignal` e retorna `City[]` normalizado.
  - Lista vazia retorna estado vazio; falhas HTTP, rede e timeout viram `AppError` tipado.
  - Testes usam `fetch` simulado e não dependem da API real.
- **Dependências:** T-04 e aprovação do provedor/contrato de geocoding.
- **Arquivos prováveis:** `src/services/geocoding.ts`, testes em `tests/unit/services/`.

### T-06 — Implementar serviço de forecast

- **Status:** bloqueada — Open Questions 1, 2, 9 e 12.
- **Spec:** AC-08 a AC-11, AC-17 a AC-20, AC-26.
- **Critérios de aceite:**
  - Service chama Open-Meteo com campos, unidades, fuso e timeout aprovados.
  - Resposta é validada e mapeada para `WeatherData`; erro e resposta parcial são distinguidos.
  - Testes verificam URL, parâmetros, mapeamento e falhas com `fetch` simulado.
- **Dependências:** T-04 e decisões das Open Questions 1, 2, 9 e 12.
- **Arquivos prováveis:** `src/services/forecast.ts`, testes em `tests/unit/services/`.

## Entrega 3 — Orquestração e experiência

### T-07 — Implementar hook de estado e coordenação

- **Status:** bloqueada para integração, pode começar após T-04 e T-05.
- **Spec:** AC-02 a AC-04, AC-06, AC-15 a AC-19.
- **Critérios de aceite:**
  - Search e weather têm estados independentes idle/loading/success/empty/error.
  - Respostas antigas são canceladas ou ignoradas; seleção existente é preservada conforme a spec.
  - Retry é manual e refaz a mesma consulta; não há cache ou retry automático.
- **Dependências:** T-04, T-05 e T-06.
- **Arquivos prováveis:** `src/hooks/useWeatherApp.ts`, `tests/unit/hooks/useWeatherApp.test.ts`.

### T-08 — Renderizar condições atuais e previsão

- **Status:** bloqueada — Open Questions 2 e 9.
- **Spec:** AC-08 a AC-11, AC-21, AC-22, AC-26.
- **Critérios de aceite:**
  - Cidade, condição atual e exatamente cinco datas são apresentados.
  - Dados ausentes são identificados como indisponíveis e datas usam timezone/localidade aprovados.
  - Componentes recebem dados/ações por props e não acessam APIs.
- **Dependências:** T-04 e T-07.
- **Arquivos prováveis:** `src/components/CurrentWeather.tsx`, `src/components/ForecastList.tsx`, `tests/unit/components/`.

### T-09 — Integrar alternância de unidade

- **Status:** parcialmente bloqueada — Open Question 11 para arredondamento.
- **Spec:** AC-12 a AC-14.
- **Critérios de aceite:**
  - Celsius é o padrão quando não há preferência salva.
  - Alternar unidade atualiza todos os valores visíveis sem nova chamada de rede.
  - Cada valor apresenta o rótulo correto e segue o arredondamento aprovado.
- **Dependências:** T-02, T-07 e T-08; decisão da Open Question 11 para fechar precisão visual.
- **Arquivos prováveis:** `src/components/UnitSelector.tsx`, `src/hooks/useWeatherApp.ts`, testes unitários e de integração.

## Entrega 4 — Verificação e liberação

### T-10 — Cobrir fluxos integrados com testes E2E

- **Status:** bloqueada para cenários finais até concluir T-03 a T-09.
- **Spec:** AC-01 a AC-30; RNF-01, RNF-02, RNF-08.
- **Critérios de aceite:**
  - Playwright cobre busca, seleção, previsão, unidade, vazio, falha/retry e viewport 320 px.
  - APIs são interceptadas nos testes para resultados determinísticos.
  - Matriz de navegador é atualizada após decisão da Open Question 13.
- **Dependências:** T-03 a T-09 e Open Question 13.
- **Arquivos prováveis:** `tests/e2e/weather-app.spec.ts`, configuração Playwright se aprovada.

### T-11 — Aprovar gates de operação e segurança

- **Status:** bloqueada — Open Questions 1, 6, 7, 12 e 13.
- **Spec:** AC-20, AC-25 a AC-28, AC-30; RNF-03, RNF-06 a RNF-09.
- **Critérios de aceite:**
  - Termos/limites/cobertura do provedor estão aprovados.
  - Perfil p95, disponibilidade mensal, freshness, timeout e matriz de browsers têm valores/métodos documentados.
  - HTTPS e ausência de coleta de localização precisa sem consentimento são verificados.
- **Dependências:** decisões das Open Questions 1, 6, 7, 12 e 13.
- **Arquivos prováveis:** documentação operacional e pipeline de CI, caso necessário.
