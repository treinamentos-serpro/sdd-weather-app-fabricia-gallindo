# Backlog de Tarefas: Aplicação de Previsão do Tempo

Derivado de [plans/weather-app-plan.md](../plans/weather-app-plan.md) e rastreado aos requisitos e critérios de aceite de [specs/weather-app-spec.md](../specs/weather-app-spec.md). A ordem de implementação é: decisões e contratos → tipos → funções puras → services → hook → componentes → integração → testes → hardening. As dependências listam somente pré-requisitos reais; testes unitários ficam na fase de testes após a integração, mas dependem diretamente do código que verificam. Tarefas bloqueadas por decisões de produto só devem começar depois da aprovação indicada.

## Matriz de rastreabilidade — requisitos funcionais

| Requisito da spec | Tarefas que o implementam | Cobertura |
| --- | --- | --- |
| **RF-01 — Buscar e selecionar cidade** | T-01, T-05 a T-07, T-11, T-13 a T-14, T-16, T-21, T-22, T-28, T-31, T-36 a T-38 | Busca, normalização e seleção explícita; validação de entrada vazia; desambiguação; cancelamento/descarte de respostas antigas; integração e E2E. |
| **RF-02 — Consultar condições atuais** | T-02, T-05 a T-06, T-08, T-12, T-14, T-18, T-21, T-23, T-27, T-29, T-33, T-36 | Contrato e mapeamento do clima, consulta da cidade selecionada, tratamento de campos ausentes, apresentação e testes. |
| **RF-03 — Consultar previsão de cinco dias** | T-02, T-05 a T-06, T-08, T-12, T-14, T-18 a T-19, T-21, T-23, T-27, T-30, T-34, T-36 | Fuso e contrato aprovados, cinco datas ordenadas, dados parciais, apresentação e validação E2E. |
| **RF-04 — Alternar unidade de temperatura** | T-04, T-09 a T-10, T-15, T-18 a T-20, T-21, T-24, T-30, T-33 a T-36 | Conversão e formatação, unidade inicial/estado, exibição consistente nos componentes e testes unitários/E2E sem nova consulta. |
| **RF-05 — Comunicar estados da consulta** | T-03, T-05, T-11 a T-17, T-21, T-26, T-28 a T-29, T-32, T-37, T-40, T-42, T-44 | Estados loading/vazio/erro, timeout e retry, preservação da cidade, mensagens acessíveis e atualidade dos dados. |
| **RF-06 — Usar a fonte meteorológica definida** | T-01, T-06, T-12, T-17, T-27, T-36 | Aprovação do provedor, contrato externo, consulta sem credenciais, validação do serviço e teste integrado com rotas interceptadas. |
| **RF-07 — Disponibilizar interface em pt-BR** | T-02, T-10, T-13, T-17 a T-19, T-25, T-29 a T-30, T-32 a T-34, T-36 a T-37, T-43 a T-44 | Locale e fuso, mensagens, datas/números/condições, conteúdo dos componentes e verificação integrada. |

**Requisitos funcionais sem tarefa correspondente:** nenhum identificado. Cada RF tem tarefas de implementação e tarefas de validação associadas; decisões ainda abertas estão cobertas pelos pré-requisitos T-01 a T-04.

## Prioridade, tamanho e sequência de entrega

**Prioridade:** P0 = indispensável para entregar e validar o fluxo principal; P1 = necessário para robustez e qualidade do produto antes de ampliar o uso; P2 = prontidão operacional e validações de lançamento que podem ocorrer após o produto funcional. P0 não significa que decisões pendentes possam ser presumidas: os gates de produto continuam bloqueando a implementação correspondente.

**Tamanho relativo:** P = pequeno (uma mudança localizada); M = médio (uma unidade funcional/testável); G = grande (coordenação de várias preocupações ou validação abrangente). O tamanho estima esforço relativo, não duração.

### Sequência sugerida em fatias verticais

1. **Fundação bloqueante (sem interface nova):** T-01, T-02, T-04, T-05, T-06, T-07 a T-10. Aprova as decisões necessárias e cria contratos, mapeadores, conversão e formatação.
2. **Primeira fatia visível — busca → cidade selecionada → clima atual e cinco dias em Celsius:** T-11 a T-14, T-16 a T-19, T-21, T-22, T-23, T-26 a T-29, T-31 a T-34 e T-36. Inclui os dois services, orquestração do fluxo principal, UI, integração e seus testes unitários/E2E; demonstra o produto funcionando ponta a ponta.
3. **Completar interação e recuperação:** T-15, T-20, T-24, T-25, T-30, T-35, T-37 e T-38. Fecha alternância Celsius/Fahrenheit, estados de requisição, retry e respostas de busca fora de ordem.
4. **Endurecer a experiência em dispositivos:** T-39 a T-41. Repete o fluxo principal em viewport de 320 px, verifica operação por teclado e registra revisão manual de acessibilidade.
5. **Freshness e prontidão operacional:** T-03, T-42 a T-47. Só após as decisões operacionais, valida idade/horário dos dados, desempenho, disponibilidade, HTTPS e compatibilidade.

## Entrega 1 — Decisões e contratos

### T-01 — Aprovar provedor e regras de geocoding

- **Descrição:** Resolver as Open Questions 1 e 3 sobre o provedor meteorológico/geocoding e os critérios de busca e desambiguação.
- **Critérios de aceite:**
  - Termos, cobertura e limites do provedor meteorológico são confirmados para o uso pretendido.
  - Provedor, atributos de desambiguação, localização/idioma de nomes e ordenação/limite de resultados são aprovados.
  - As decisões e sua fonte de aprovação estão registradas nas Open Questions 1 e 3; AC-01, AC-05, AC-07 e AC-20 citam as decisões resultantes.
- **Rastreabilidade:** RF-01, RF-06; AC-01, AC-05, AC-07, AC-20; Open Questions 1 e 3.
- **Dependências:** Nenhuma.
- **Arquivos prováveis:** `specs/weather-app-spec.md`, `plans/weather-app-plan.md`
- **Tipo:** Infra
- **Prioridade:** P0
- **Tamanho:** M

### T-02 — Aprovar contrato meteorológico e fuso

- **Descrição:** Resolver as Open Questions 2 e 9 para definir campos meteorológicos, dados opcionais e fuso da previsão.
- **Critérios de aceite:**
  - Uma tabela na especificação identifica cada campo obrigatório/opcional para clima atual e previsão.
  - A especificação nomeia o fuso que determina as cinco datas e atualiza AC-10, AC-11 e AC-22.
  - O plano usa somente esses campos e esse fuso como contrato aprovado.
- **Rastreabilidade:** RF-02, RF-03, RF-07; AC-08 a AC-11, AC-22; Open Questions 2 e 9.
- **Dependências:** Nenhuma.
- **Arquivos prováveis:** `specs/weather-app-spec.md`, `plans/weather-app-plan.md`
- **Tipo:** Infra
- **Prioridade:** P0
- **Tamanho:** M

### T-03 — Aprovar limites operacionais e compatibilidade

- **Descrição:** Resolver as Open Questions 6, 7, 12 e 13 relativas a SLOs, idade dos dados, timeout e matriz de navegadores.
- **Critérios de aceite:**
  - Perfil de rede/dispositivo e método de medição de p95 e disponibilidade estão registrados com valores e escopo.
  - Idade máxima dos dados e timeout têm limites numéricos e unidades registrados.
  - A matriz nomeia navegador, versão e dispositivos; AC-19, AC-25 a AC-27 e AC-30 são atualizados para referenciá-la.
- **Rastreabilidade:** RF-05; AC-19, AC-25, AC-26, AC-27, AC-30; RNF-03, RNF-06, RNF-07, RNF-08; Open Questions 6, 7, 12 e 13.
- **Dependências:** Nenhuma.
- **Arquivos prováveis:** `specs/weather-app-spec.md`, `plans/weather-app-plan.md`
- **Tipo:** Infra
- **Prioridade:** P1
- **Tamanho:** G

### T-04 — Aprovar precisão de temperatura

- **Descrição:** Resolver a Open Question 11 e registrar a precisão/arredondamento de Celsius e Fahrenheit.
- **Critérios de aceite:**
  - A especificação informa casas decimais ou incremento de arredondamento para Celsius e Fahrenheit.
  - AC-13 e o plano citam exatamente a mesma regra, sem arredondamento dos valores canônicos antes da apresentação.
- **Rastreabilidade:** RF-04; AC-13, AC-14; Open Question 11.
- **Dependências:** Nenhuma.
- **Arquivos prováveis:** `specs/weather-app-spec.md`, `plans/weather-app-plan.md`
- **Tipo:** Infra
- **Prioridade:** P0
- **Tamanho:** P

### T-05 — Definir tipos de domínio meteorológico

- **Descrição:** Declarar os contratos TypeScript da cidade, clima, previsão, unidade e erros/estados de domínio aprovados.
- **Critérios de aceite:**
  - TypeScript strict aceita os contratos para cidade, clima atual, cinco dias, unidade e erros/estados aprovados.
  - Cada campo aprovado como opcional representa ausência explicitamente; nenhum campo meteorológico usa `0` como sentinela.
  - `weather.ts` não importa nem referencia tipos de payload do provedor.
- **Rastreabilidade:** RF-01 a RF-05; AC-01 a AC-19.
- **Dependências:** T-01, T-02.
- **Arquivos prováveis:** `src/types/weather.ts`
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** M

### T-06 — Definir tipos dos payloads externos

- **Descrição:** Declarar somente os campos externos necessários aos adaptadores de geocoding e forecast.
- **Critérios de aceite:**
  - TypeScript strict aceita fixtures válidas das respostas aprovadas de geocoding e forecast.
  - Campos opcionais nas respostas externas são marcados como opcionais/nuláveis conforme o schema aprovado.
  - O arquivo externo não declara modelos de apresentação nem importa `types/weather.ts` para substituir o contrato de domínio.
- **Rastreabilidade:** AC-01, AC-05, AC-08 a AC-11, AC-20.
- **Dependências:** T-01, T-02, T-05.
- **Arquivos prováveis:** `src/types/openMeteo.ts`
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** M

## Entrega 2 — Funções puras

### T-07 — Mapear resultados de geocoding

- **Descrição:** Implementar a função pura que transforma resultados externos em cidades e rótulos de contexto aprovados.
- **Critérios de aceite:**
  - Para a fixture aprovada, o resultado contém os campos `City` esperados e nenhum campo exclusivo do payload externo.
  - A ausência de cada atributo opcional produz o valor definido no contrato de domínio.
  - `results: []` produz uma lista vazia; payload ausente ou de estrutura incompatível é rejeitado como inválido.
  - A saída mantém todos os resultados e não seleciona um deles.
- **Rastreabilidade:** RF-01; AC-01, AC-05, AC-06, AC-07.
- **Dependências:** T-05, T-06.
- **Arquivos prováveis:** `src/lib/mapGeocoding.ts`
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** M

### T-08 — Mapear condições atuais e previsão

- **Descrição:** Implementar a função pura que normaliza o payload de forecast para o modelo aprovado.
- **Critérios de aceite:**
  - Para fixture completa, todos os campos aprovados são mapeados para os nomes e unidades canônicas do domínio.
  - Para cada campo ausente/nulo da fixture parcial, a saída é indisponível e nunca zero por substituição.
  - A saída contém a cidade passada à função, conserva as datas recebidas na ordem aprovada e define `fetchedAt`.
- **Rastreabilidade:** RF-02, RF-03; AC-08, AC-09, AC-10, AC-11, AC-26.
- **Dependências:** T-05, T-06.
- **Arquivos prováveis:** `src/lib/mapForecast.ts`
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** M

### T-09 — Implementar conversão de temperatura

- **Descrição:** Completar a função pura de conversão Celsius/Fahrenheit sem arredondar os valores de domínio.
- **Critérios de aceite:**
  - `convertTemperature(0, 'celsius', 'fahrenheit')` retorna 32 e `convertTemperature(100, 'celsius', 'fahrenheit')` retorna 212.
  - Conversões inversas retornam 0 e 100, respectivamente, dentro da precisão numérica da fórmula.
  - Conversão entre unidades iguais retorna exatamente o valor de entrada e a função não arredonda.
- **Rastreabilidade:** RF-04; AC-13, AC-14.
- **Dependências:** T-04.
- **Arquivos prováveis:** `src/lib/temperature.ts`
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** P

### T-10 — Implementar formatadores meteorológicos pt-BR

- **Descrição:** Criar funções puras para datas, horários, números, condições e valores indisponíveis.
- **Critérios de aceite:**
  - Para instantes/datas de fixture, a saída é igual à esperada com locale `pt-BR` e fuso aprovado.
  - Cada código meteorológico aprovado tem descrição definida; código desconhecido segue um fallback explícito e estável.
  - Valores numéricos usam a precisão aprovada; entrada indisponível gera o marcador definido e nunca `"0"`.
- **Rastreabilidade:** RF-04, RF-07; AC-13, AC-14, AC-21, AC-22, AC-26; RNF-05.
- **Dependências:** T-02, T-04, T-05.
- **Arquivos prováveis:** `src/lib/formatters.ts`
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** M

## Entrega 3 — Services

### T-11 — Implementar serviço de geocoding

- **Descrição:** Consultar o provedor aprovado com o texto aparado e retornar resultados normalizados.
- **Critérios de aceite:**
  - Uma chamada com texto de fixture produz URL/params aprovados e preserva acentos, apóstrofos e hífens após aparar espaços externos.
  - A chamada usa GET e encaminha o `AbortSignal`; status não-2xx, timeout, rede, JSON inválido e schema inválido rejeitam com o erro correspondente.
  - Uma resposta válida vazia retorna lista vazia, não erro.
- **Rastreabilidade:** RF-01, RF-05; AC-04 a AC-07, AC-15 a AC-19.
- **Dependências:** T-07.
- **Arquivos prováveis:** `src/services/geocoding.ts`
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** M

### T-12 — Implementar serviço de forecast

- **Descrição:** Consultar a API Forecast para as coordenadas selecionadas e retornar dados normalizados.
- **Critérios de aceite:**
  - A URL contém latitude/longitude da cidade selecionada e todos os parâmetros aprovados, incluindo janela, variáveis, unidades e fuso.
  - O request encaminha `AbortSignal`; resposta não-2xx, rede, timeout, JSON inválido e schema incompatível produzem erro, não `WeatherData`.
  - Resposta parcial permitida retorna dados normalizados; coordenadas divergentes são rejeitadas.
- **Rastreabilidade:** RF-02, RF-03, RF-05, RF-06; AC-08 a AC-11, AC-15 a AC-20.
- **Dependências:** T-08.
- **Arquivos prováveis:** `src/services/forecast.ts`
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** M

## Entrega 4 — Hook e estado

### T-13 — Implementar estado e fluxo de busca

- **Descrição:** Implementar no hook o ciclo de busca, validação local, cancelamento e descarte de respostas obsoletas.
- **Critérios de aceite:**
  - Enviar `''` ou espaços não chama `searchCities` e produz validação local; sucesso, vazio e erro têm estados distintos.
  - Com uma cidade selecionada, busca vazia ou falha mantém essa seleção inalterada.
  - Em duas buscas A/B concluídas fora de ordem, somente os resultados de B atualizam o estado.
- **Rastreabilidade:** RF-01, RF-05; AC-03 a AC-06, AC-15 a AC-17.
- **Dependências:** T-05, T-11.
- **Arquivos prováveis:** `src/hooks/useWeatherApp.ts`
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** M

### T-14 — Implementar seleção e consulta meteorológica

- **Descrição:** Completar o hook para selecionar uma cidade, consultar forecast, cancelar respostas obsoletas e permitir retry manual.
- **Critérios de aceite:**
  - Selecionar uma cidade chama forecast uma vez com o objeto/identidade e coordenadas selecionados.
  - Busca e clima podem manter estados independentes; cada request inicia em loading e termina em success ou error.
  - Após falha, a cidade continua selecionada; retry chama forecast novamente com as mesmas coordenadas.
  - Ao selecionar B antes da resposta de A, a resposta tardia de A não substitui os dados de B.
- **Rastreabilidade:** RF-01, RF-02, RF-05; AC-02, AC-08, AC-15, AC-17, AC-18.
- **Dependências:** T-13, T-12.
- **Arquivos prováveis:** `src/hooks/useWeatherApp.ts`
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** M

### T-15 — Implementar estado de unidade no hook

- **Descrição:** Integrar a unidade de apresentação ao hook sem modificar os dados de domínio ou refazer a consulta.
- **Critérios de aceite:**
  - Estado inicial é `celsius`; a ação atualiza para `fahrenheit` e permite retornar a `celsius`.
  - Os valores canônicos do `WeatherData` são idênticos antes e depois de ambas as alterações.
  - Contadores/mocks dos serviços não aumentam ao alterar a unidade.
- **Rastreabilidade:** RF-04; AC-12, AC-13, AC-14.
- **Dependências:** T-05, T-14.
- **Arquivos prováveis:** `src/hooks/useWeatherApp.ts`
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** P

## Entrega 5 — Componentes

### T-16 — Apresentar resultados de busca

- **Descrição:** Criar a lista de resultados com opções selecionáveis e contexto geográfico aprovado.
- **Critérios de aceite:**
  - Cada item exibe nome e todos os atributos de contexto aprovados, inclusive quando dois nomes são iguais.
  - Cada item possui controle selecionável por teclado e mouse; renderizar a lista não dispara seleção.
  - Uma fixture com caracteres de marcação é renderizada como texto e não cria elementos injetados.
- **Rastreabilidade:** RF-01; AC-01, AC-02, AC-05, AC-07, AC-23.
- **Dependências:** T-05.
- **Arquivos prováveis:** `src/components/SearchResults.tsx`
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** M

### T-17 — Apresentar estados de requisição

- **Descrição:** Criar um componente reutilizável para estados de carregamento, vazio, erro e retry.
- **Implementação de apresentação:** componentes independentes em `src/components/states/`: `LoadingState` (mensagem opcional), `ErrorState` (`message`, `onRetry`) e `EmptyState` (título e dica opcionais). O consumidor renderiza somente o estado correspondente; não há retry automático.
- **Critérios de aceite:**
  - Props loading, empty e error renderizam mensagens distintas em pt-BR; empty não usa texto de erro.
  - Loading/error têm role/aria apropriado para anúncio e o loading deixa de ser marcado quando a requisição termina.
  - Retry só aparece em erro recuperável; ativá-lo chama a callback fornecida uma vez.
- **Rastreabilidade:** RF-05, RF-07; AC-15 a AC-19, AC-21; RNF-02, RNF-04.
- **Dependências:** T-05.
- **Arquivos prováveis:** `src/components/RequestStatus.tsx`
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** P

### T-18 — Apresentar condições meteorológicas atuais

- **Descrição:** Criar o componente de clima atual para a cidade selecionada, incluindo valores ausentes.
- **Critérios de aceite:**
  - O heading identifica a cidade selecionada e cada campo aprovado tem label/unidade visível.
  - Fixture com campo nulo renderiza o marcador de indisponibilidade, não `0` nem valor de outra fixture.
  - Temperatura renderiza conversão e sufixo da unidade recebida; descrição/data usam os formatadores fornecidos.
  - O hero recebe `city`, `current` e `unit`, usa ícones/descrições de `lib/weatherCodes` e exibe umidade, vento, precipitação e pressão. Conforme decisão do usuário em 27/10/2026, pressão é “Indisponível” sem alterar o contrato; temperaturas usam uma casa decimal em pt-BR.
- **Rastreabilidade:** RF-02, RF-04, RF-07; AC-08, AC-09, AC-14, AC-21, AC-22; RNF-05.
- **Dependências:** T-05, T-09, T-10.
- **Arquivos prováveis:** `src/components/CurrentWeather.tsx`
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** M

### T-19 — Apresentar previsão de cinco dias

- **Descrição:** Criar a lista diária de previsão, preservando datas e valores indisponíveis.
- **Critérios de aceite:**
  - Fixture com cinco datas resulta em exatamente cinco itens na mesma ordem cronológica.
  - Fixture parcial mantém a data de cada item e renderiza marcador de indisponibilidade para cada valor ausente.
  - Temperaturas mostram conversão e rótulo da unidade selecionada; data/condição usam os formatadores.
  - `ForecastList` recebe `forecast` e `unit`; `ForecastCard` recebe `day` e `unit`. O grid usa `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5`, com rótulos de dia de `lib/format`, ícone WMO e probabilidade de chuva. Lista vazia comunica ausência de previsão.
- **Rastreabilidade:** RF-03, RF-04, RF-07; AC-10 a AC-14, AC-22; RNF-05.
- **Dependências:** T-05, T-09, T-10.
- **Arquivos prováveis:** `src/components/ForecastList.tsx`, `src/components/ForecastCard.tsx`, `src/lib/format.ts`
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** M

### T-20 — Apresentar seletor de unidade

- **Descrição:** Criar o controle acessível para alternar Celsius e Fahrenheit.
- **Critérios de aceite:**
  - As opções têm rótulos visíveis “Celsius” e “Fahrenheit”; a opção ativa corresponde à prop `unit`.
  - Teclado pode mudar entre ambas e o estado atual é exposto por semântica acessível.
  - Selecionar opção chama somente `onUnitChange` com o valor correspondente.
- **Rastreabilidade:** RF-04; AC-12 a AC-14, AC-23; RNF-02.
- **Dependências:** T-05.
- **Arquivos prováveis:** `src/components/UnitSelector.tsx`
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** P

## Entrega 6 — Integração

### T-21 — Integrar os fluxos na aplicação

- **Descrição:** Conectar formulário existente, resultados, estados, clima, previsão, unidade e hook no shell da aplicação.
- **Fatias:** o protótipo offline aprovado em 27/10/2026 compõe os componentes em
  `src/App.tsx`, com cenário explícito inicialmente idle, busca/retry para success
  e unidade local sem mutação do mock. A fatia seguinte conecta `useWeather` ao
  App, remove os controles de demonstração, renderiza os cinco estados reais e
  usa `retry` no ErrorState, mantendo unidade local de UI. A busca carrega
  automaticamente a primeira cidade; seleção explícita/desambiguação permanece
  fora desta fatia.
- **Critérios de aceite:**
  - Renderização inicial mostra busca e estado vazio, sem cidade, dados meteorológicos ou anúncio de loading.
  - Busca/chamada de seleção, retry e troca de unidade invocam as ações do hook e exibem os respectivos estados/resultados.
  - `App` e componentes não chamam `fetch`; chamadas externas ficam nos services.
- **Rastreabilidade:** RF-01 a RF-07; AC-01 a AC-22, AC-29; RNF-04, RNF-05.
- **Dependências:** T-13, T-14, T-15, T-16, T-17, T-18, T-19, T-20.
- **Arquivos prováveis:** `src/app/App.tsx`, `src/components/EmptyWeatherState.tsx`
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** G

## Entrega 7 — Testes unitários, integrados e E2E

### T-22 — Testar mapeamento de geocoding

- **Descrição:** Testar entradas válidas, atributos opcionais, lista vazia e payload incompatível do mapeador.
- **Critérios de aceite:**
  - Testes afirmam o valor esperado de cada campo mapeado e do rótulo de contexto para ao menos uma fixture válida.
  - Testes cobrem ausência de opcionais, lista vazia e payload incompatível, verificando resultados distintos.
  - A suíte passa isoladamente e não realiza chamadas de rede.
- **Rastreabilidade:** RF-01; AC-01, AC-05, AC-06, AC-07.
- **Dependências:** T-07.
- **Arquivos prováveis:** `tests/unit/lib/mapGeocoding.test.ts`
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** P

### T-23 — Testar mapeamento de forecast

- **Descrição:** Testar o mapeador com fixtures completas, parciais e incompatíveis.
- **Critérios de aceite:**
  - Testes comparam campo a campo a saída normalizada da fixture completa com valores esperados.
  - Fixture parcial confirma indisponibilidade de cada campo ausente e preserva as datas em ordem.
  - Fixtures com estrutura incompatível e coordenadas inesperadas são rejeitadas.
- **Rastreabilidade:** RF-02, RF-03; AC-08 a AC-11.
- **Dependências:** T-08.
- **Arquivos prováveis:** `tests/unit/lib/mapForecast.test.ts`
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** P

### T-24 — Testar conversão de temperatura

- **Descrição:** Cobrir a conversão de unidades e os casos de identidade e precisão.
- **Critérios de aceite:**
  - Testes verificam 0 °C ↔ 32 °F e 100 °C ↔ 212 °F com igualdade numérica esperada.
  - Testes verificam cada unidade convertida para si mesma e um valor fracionário sem arredondamento.
  - A suíte Vitest do arquivo passa sem mocks de rede ou relógio.
- **Rastreabilidade:** RF-04; AC-13, AC-14.
- **Dependências:** T-09.
- **Arquivos prováveis:** `tests/unit/lib/temperature.test.ts`
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** P

### T-25 — Testar formatadores meteorológicos

- **Descrição:** Testar datas, horários, números, códigos meteorológicos e indisponibilidades.
- **Critérios de aceite:**
  - Testes afirmam strings exatas para data, hora e número de fixtures no locale/fuso aprovados.
  - Testes cobrem um código mapeado, um código desconhecido e um valor indisponível com as saídas especificadas.
  - A suíte passa com instante fixo e sem depender do relógio local.
- **Rastreabilidade:** RF-07; AC-21, AC-22, AC-26; RNF-05.
- **Dependências:** T-10.
- **Arquivos prováveis:** `tests/unit/lib/formatters.test.ts`
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** M

### T-26 — Testar serviço de geocoding

- **Descrição:** Verificar requisições e respostas do geocoding com `fetch` simulado.
- **Critérios de aceite:**
  - Testes inspecionam URL, query params, método GET e o mesmo sinal passado ao serviço.
  - Testes afirmam saídas diferentes para sucesso, resultados vazios, HTTP, rejeição de rede, timeout, JSON inválido e schema inválido.
  - Todos os testes usam `fetch` mockado e passam sem conexão externa.
- **Rastreabilidade:** RF-01, RF-05; AC-04 a AC-07, AC-15 a AC-19.
- **Dependências:** T-11.
- **Arquivos prováveis:** `tests/unit/services/geocoding.test.ts`
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** M

### T-27 — Testar serviço de forecast

- **Descrição:** Cobrir requisições e respostas do serviço de forecast com rede simulada.
- **Critérios de aceite:**
  - Testes afirmam URL e parâmetros completos, coordenadas, unidades, fuso e identidade do `AbortSignal`.
  - Testes verificam resposta completa e parcial, rejeição de coordenadas divergentes, HTTP, rede, timeout, JSON e schema inválidos.
  - A suíte passa com `fetch` mockado e sem chamadas ao provedor.
- **Rastreabilidade:** RF-02, RF-03, RF-05, RF-06; AC-08 a AC-11, AC-15 a AC-20.
- **Dependências:** T-12.
- **Arquivos prováveis:** `tests/unit/services/forecast.test.ts`
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** M

### T-28 — Testar estado e fluxo de busca

- **Descrição:** Testar estados, validação, preservação da seleção e concorrência de buscas no hook.
- **Critérios de aceite:**
  - Testes do hook afirmam estados finais de sucesso, vazio e erro e que entrada em branco não invoca o service.
  - Testes iniciados com cidade selecionada afirmam que busca vazia/falha mantém a mesma identidade selecionada.
  - Teste com promises controladas resolve B antes de A e afirma que o estado final contém somente B.
- **Rastreabilidade:** RF-01, RF-05; AC-03 a AC-06, AC-15 a AC-17.
- **Dependências:** T-13.
- **Arquivos prováveis:** `tests/unit/hooks/useWeatherApp.test.ts`
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** M

### T-29 — Testar seleção e consulta meteorológica

- **Descrição:** Testar consulta, estados de clima, retry e descarte de respostas obsoletas no hook.
- **Critérios de aceite:**
  - Testes afirmam parâmetros de forecast, transições loading→success/error e ausência de loading ao fim da promise.
  - Teste de retry verifica segunda chamada para as mesmas coordenadas e preservação da cidade.
  - Teste com respostas controladas afirma que resultado de A não substitui seleção/dados de B.
- **Rastreabilidade:** RF-01, RF-02, RF-05; AC-02, AC-08, AC-15, AC-17, AC-18.
- **Dependências:** T-14.
- **Arquivos prováveis:** `tests/unit/hooks/useWeatherApp.test.ts`
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** M

### T-30 — Testar estado de unidade no hook

- **Descrição:** Verificar unidade inicial, alternância e ausência de chamadas adicionais aos serviços.
- **Critérios de aceite:**
  - Testes afirmam estado inicial `celsius` e alternância nos dois sentidos.
  - Testes comparam `WeatherData` antes/depois e afirmam igualdade dos valores canônicos.
  - Mocks de geocoding/forecast mantêm o mesmo número de chamadas após alternância.
- **Rastreabilidade:** RF-04; AC-12, AC-13, AC-14.
- **Dependências:** T-15.
- **Arquivos prováveis:** `tests/unit/hooks/useWeatherApp.test.ts`
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** P

### T-31 — Testar resultados de busca

- **Descrição:** Testar conteúdo, desambiguação, seleção e acessibilidade da lista de resultados.
- **Critérios de aceite:**
  - Testes com fixture de homônimos afirmam o nome e contexto visíveis de cada opção.
  - Nenhuma ação é chamada antes da interação; clicar/ativar teclado numa opção chama callback uma vez com a cidade correspondente.
  - Cada opção é encontrada por role e nome acessível.
- **Rastreabilidade:** RF-01; AC-01, AC-02, AC-07, AC-23.
- **Dependências:** T-16.
- **Arquivos prováveis:** `tests/unit/components/SearchResults.test.tsx`
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** M

### T-32 — Testar estados de requisição

- **Descrição:** Testar os estados visíveis, anúncios acessíveis e ação de retry.
- **Critérios de aceite:**
  - Testes de loading, empty e error afirmam mensagens diferentes e exclusivas do estado fornecido.
  - Testes consultam roles/atributos de anúncio esperados para loading e erro.
  - Retry recuperável chama callback exatamente uma vez; retry não recuperável não é renderizado.
- **Rastreabilidade:** RF-05, RF-07; AC-15 a AC-19, AC-21; RNF-02, RNF-04.
- **Dependências:** T-17.
- **Arquivos prováveis:** `tests/unit/components/RequestStatus.test.tsx`
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** M

### T-33 — Testar condições atuais

- **Descrição:** Testar os campos, indisponibilidades, unidade e acessibilidade do componente atual.
- **Critérios de aceite:**
  - Testes afirmam textos dos campos com fixture completa e marcador de indisponibilidade para valor ausente.
  - Para cada unidade, teste afirma valor convertido e rótulo de unidade correspondentes.
  - Heading e campos podem ser localizados por roles/names acessíveis.
- **Rastreabilidade:** RF-02, RF-04; AC-08, AC-09, AC-14; RNF-05.
- **Dependências:** T-18.
- **Arquivos prováveis:** `tests/unit/components/CurrentWeather.test.tsx`
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** M

### T-34 — Testar previsão de cinco dias

- **Descrição:** Testar quantidade, ordem, datas, indisponibilidades e unidade na lista de previsão.
- **Critérios de aceite:**
  - Teste afirma exatamente cinco itens e a ordem esperada das cinco datas da fixture.
  - Fixture parcial mantém todas as datas e mostra indisponibilidade; testes de Celsius/Fahrenheit afirmam o valor e sufixo.
  - Cada item de previsão tem data identificável por texto/semântica acessível.
- **Rastreabilidade:** RF-03, RF-04; AC-10 a AC-14; RNF-05.
- **Dependências:** T-19.
- **Arquivos prováveis:** `tests/unit/components/ForecastList.test.tsx`
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** M

### T-35 — Testar seletor de unidade

- **Descrição:** Testar alternância de unidade, teclado e estado acessível do controle.
- **Critérios de aceite:**
  - Testes ativam Celsius→Fahrenheit→Celsius e afirmam o valor enviado em cada callback.
  - O controle é encontrado por role/nome acessível e ambas as opções são alcançáveis por teclado.
  - Mocks de rede não recebem chamadas durante as interações.
- **Rastreabilidade:** RF-04; AC-12 a AC-14, AC-23; RNF-02.
- **Dependências:** T-20.
- **Arquivos prováveis:** `tests/unit/components/UnitSelector.test.tsx`
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** P

### T-36 — Testar o fluxo principal com E2E

- **Descrição:** Cobrir busca, seleção, consulta de clima e alternância de unidade com APIs interceptadas.
- **Critérios de aceite:**
  - Com rotas interceptadas, o cenário busca e seleciona uma cidade, e afirma sua identidade, condições atuais e exatamente cinco datas.
  - Ao alternar unidade, todos os textos de temperatura e rótulos esperados mudam e o contador de requests Forecast permanece inalterado.
  - O cenário passa sem requisições externas reais e usa respostas fixture versionadas no teste.
- **Rastreabilidade:** RF-01 a RF-04, RF-06, RF-07; AC-01, AC-02, AC-08, AC-10, AC-12 a AC-14, AC-20 a AC-22.
- **Dependências:** T-21.
- **Arquivos prováveis:** `tests/e2e/weather-app.spec.ts`
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** M

### T-37 — Testar estados de busca e recuperação com E2E

- **Descrição:** Cobrir busca vazia, busca sem resultados, erro de serviço e retry manual.
- **Critérios de aceite:**
  - Submeter somente espaços mantém o contador Geocoding em zero; lista `results: []` exibe mensagem de vazio distinta da mensagem de erro.
  - Resposta de erro remove o indicador de loading, preserva a cidade previamente selecionada e mostra retry se o erro for recuperável.
  - Acionar retry aumenta o contador de requests em exatamente um e usa rota interceptada.
- **Rastreabilidade:** RF-01, RF-05; AC-03, AC-04, AC-15 a AC-19.
- **Dependências:** T-21.
- **Arquivos prováveis:** `tests/e2e/weather-app.spec.ts`
- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** M

### T-38 — Testar respostas de busca fora de ordem com E2E

- **Descrição:** Verificar que uma resposta atrasada de busca anterior não substitui os resultados da busca mais recente.
- **Critérios de aceite:**
  - O teste envia A e B, resolve a rota de B antes da rota de A e aguarda ambas concluírem.
  - A lista final contém o resultado fixture de B e não contém resultado exclusivo de A.
  - As duas respostas são fornecidas por rotas Playwright sem conexão externa.
- **Rastreabilidade:** RF-01; AC-06.
- **Dependências:** T-21.
- **Arquivos prováveis:** `tests/e2e/weather-app.spec.ts`
- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** M

### T-39 — Validar responsividade mobile com E2E

- **Descrição:** Executar o fluxo principal de busca, seleção, consulta e troca de unidade em viewport mobile de 320 px.
- **Critérios de aceite:**
  - Com viewport de 320 px, o teste busca uma cidade, seleciona um resultado, verifica clima atual e exatamente cinco datas, e alterna unidade.
  - Após cada estado do fluxo, `document.documentElement.scrollWidth` não excede `window.innerWidth`; controles e dados permanecem visíveis/acessíveis.
  - O cenário usa respostas interceptadas e conclui sem serviço externo.
- **Rastreabilidade:** RF-01 a RF-03; AC-24; RNF-01.
- **Dependências:** T-21, T-36.
- **Arquivos prováveis:** `tests/e2e/weather-app.spec.ts`
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** M

### T-40 — Validar operação por teclado e acessibilidade

- **Descrição:** Verificar por E2E que o fluxo principal pode ser operado somente por teclado.
- **Revisão do protótipo offline:** cobrir skip link, foco no input após validação,
  foco nos resultados após busca/retry, contraste mínimo 4,5:1 para texto e
  3:1 para limites de controles. Verificar os cinco cenários entre 320 e 1440 px,
  inclusive nomes longos e campos nulos. Não equivale à validação manual com leitor de tela.
- **Critérios de aceite:**
  - Teste E2E percorre busca, seleção, retry e mudança de unidade usando somente teclado; foco visível acompanha o controle ativo.
  - Testes localizam controles por roles/nomes acessíveis e verificam anúncio de loading e erro.
  - Cenário usa interface real e rotas interceptadas, sem dependência de rede.
- **Rastreabilidade:** RF-05; AC-15, AC-17, AC-18, AC-23; RNF-02.
- **Dependências:** T-21.
- **Arquivos prováveis:** `tests/e2e/weather-app.spec.ts`
- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** M

### T-41 — Revisar acessibilidade manualmente

- **Descrição:** Complementar a automação com revisão manual dos critérios WCAG 2.2 AA aplicáveis ao fluxo.
- **Critérios de aceite:**
  - A checklist registra resultado (conforme/não conforme/não aplicável e evidência) para teclado, foco visível, nomes/labels, contraste e anúncios.
  - Cada falha inclui tela/controle, critério WCAG aplicável e ação corretiva; não há declaração de conformidade sem evidência registrada.
- **Rastreabilidade:** RF-05; AC-15, AC-23, AC-24; RNF-01, RNF-02.
- **Dependências:** T-21, T-40.
- **Arquivos prováveis:** `specs/weather-app-spec.md`
- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** M

## Entrega 8 — Hardening e prontidão

### T-42 — Aplicar limite de idade aos dados meteorológicos

- **Descrição:** Impedir que dados cuja idade ultrapassa o limite aprovado sejam mantidos no estado como condições atuais.
- **Critérios de aceite:**
  - Comparação usa o limite numérico aprovado e timestamps com relógio injetável/controlável.
  - Dados acima da idade máxima aprovada não permanecem como clima atual; dados no limite ou abaixo seguem a regra aprovada.
  - A avaliação temporal usa a referência de relógio definida pelo hook, sem alterar o timestamp original dos dados.
- **Rastreabilidade:** RF-05; AC-17, AC-26; RNF-07.
- **Dependências:** T-03, T-14.
- **Arquivos prováveis:** `src/hooks/useWeatherApp.ts`
- **Tipo:** Data
- **Prioridade:** P1
- **Tamanho:** M

### T-43 — Apresentar horário da consulta

- **Descrição:** Exibir o horário em que os dados foram consultados, com formatação e fuso aprovados.
- **Critérios de aceite:**
  - Com `fetchedAt` fixo, a UI apresenta esse instante e não `current.time`.
  - Texto é igual à formatação esperada para locale `pt-BR` e fuso aprovados.
  - Estado vencido não exibe rótulo “atual”/equivalente.
- **Rastreabilidade:** RF-07; AC-22, AC-26; RNF-05, RNF-07.
- **Dependências:** T-08, T-10, T-18, T-42.
- **Arquivos prováveis:** `src/components/CurrentWeather.tsx`
- **Tipo:** UI
- **Prioridade:** P1
- **Tamanho:** P

### T-44 — Testar idade dos dados e horário da consulta

- **Descrição:** Validar o limite de idade e a apresentação de `fetchedAt` com relógio e fixtures controlados.
- **Critérios de aceite:**
  - Testes cobrem timestamp abaixo, exatamente no limite e acima da idade máxima aprovada; somente dados acima do limite deixam de ser atuais.
  - Teste com `fetchedAt` fixo afirma que a UI apresenta esse instante formatado em pt-BR/fuso aprovado, não `current.time`.
  - Testes são determinísticos e não dependem do relógio real.
- **Rastreabilidade:** RF-05, RF-07; AC-17, AC-22, AC-26; RNF-05, RNF-07.
- **Dependências:** T-42, T-43.
- **Arquivos prováveis:** `tests/unit/hooks/useWeatherApp.test.ts`, `tests/unit/components/CurrentWeather.test.tsx`
- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** M

### T-45 — Medir desempenho conforme o perfil aprovado

- **Descrição:** Verificar o critério de desempenho usando o perfil de rede/dispositivo e método de medição acordados.
- **Critérios de aceite:**
  - A medição inclui envio da busca/consulta até apresentação do resultado sob o perfil aprovado e registra amostras e método.
  - O p95 calculado é comparado ao limite de AC-25 (2 segundos); resultado, ambiente e evidência reproduzível são registrados.
  - Se o perfil ou amostras exigidos estiverem ausentes, o requisito fica explicitamente pendente.
- **Rastreabilidade:** AC-25; RNF-03; Open Question 6.
- **Dependências:** T-03, T-36.
- **Arquivos prováveis:** `plans/weather-app-plan.md`
- **Tipo:** Infra
- **Prioridade:** P2
- **Tamanho:** M

### T-46 — Verificar disponibilidade conforme o método aprovado

- **Descrição:** Reunir ou configurar a evidência necessária para avaliar a disponibilidade no escopo e período acordados.
- **Critérios de aceite:**
  - Evidência cobre mês-calendário completo e usa o escopo, exclusões e fórmula aprovados.
  - Percentual calculado é comparado à meta de AC-30 (99,5%) e acompanhado de período/fonte dos dados.
  - Se o mês ou dados necessários estiverem incompletos, resultado é registrado como pendente, não como aprovado.
- **Rastreabilidade:** AC-30; RNF-06; Open Question 6.
- **Dependências:** T-03, T-36.
- **Arquivos prováveis:** `plans/weather-app-plan.md`
- **Tipo:** Infra
- **Prioridade:** P2
- **Tamanho:** M

### T-47 — Verificar transporte seguro e compatibilidade

- **Descrição:** Validar HTTPS e os navegadores/dispositivos constantes da matriz aprovada.
- **Critérios de aceite:**
  - No ambiente-alvo, navegação e requests externos usam HTTPS; nenhuma coleta/localização precisa ocorre sem consentimento explícito.
  - Os fluxos principais passam nos navegadores e versões da matriz aprovada, com relatório por browser/device.
  - Cada combinação não testada ou falha consta como pendência; cobertura não testada não é declarada aprovada.
- **Rastreabilidade:** AC-27, AC-28; RNF-08, RNF-09; Open Question 13.
- **Dependências:** T-03, T-36.
- **Arquivos prováveis:** `specs/weather-app-spec.md`, configuração de CI/produção existente
- **Tipo:** Infra
- **Prioridade:** P1
- **Tamanho:** G
