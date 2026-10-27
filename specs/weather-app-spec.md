# Especificação de Produto: Aplicação de Previsão do Tempo

## Overview

Aplicação web responsiva para consultar condições meteorológicas de cidades informadas pelo usuário. O produto atende pessoas que precisam verificar o tempo atual antes de sair e planejar atividades ou viagens para os próximos dias.

**Status da especificação:** pronta para planejamento e implementação dos pontos definidos; não aprovada para produção enquanto os bloqueios de lançamento em Open Questions não forem resolvidos.

### Objetivos

- Permitir encontrar e selecionar uma cidade pelo nome.
- Apresentar condições atuais e previsão diária de cinco dias para a cidade selecionada.
- Permitir alternar temperaturas entre Celsius e Fahrenheit, iniciando em Celsius.
- Comunicar claramente carregamento, ausência de resultados e falhas.

### Público-alvo

- Pessoas que consultam o clima no celular antes de sair.
- Pessoas que planejam viagens e atividades para os próximos dias.
- Pessoas que organizam atividades ao ar livre e comparam dias disponíveis.

### Decisões de produto

- Fonte meteorológica: Open-Meteo, sem chave de API.
- Janela da previsão: hoje e os quatro dias seguintes.
- Unidade inicial: Celsius; Fahrenheit também deve estar disponível.
- Idioma inicial da interface: português do Brasil (pt-BR).
- O produto não exige autenticação nem persistência em servidor.
- Uma busca sem resultados não substitui a cidade previamente selecionada; esse comportamento está coberto por AC-03.
- Falhas não são recuperadas automaticamente; o usuário inicia uma nova tentativa pela ação “Tentar novamente”.
- Para o hero de clima atual, pressão é apresentada como “Indisponível”, sem
  adicionar esse campo ao contrato atual (decisão do usuário em 27/10/2026).
- **Protótipo offline (aprovado pelo usuário em 27/10/2026):** a composição usa
  um seletor explícito de cenários idle/loading/empty/error/success, iniciando em
  idle. Buscar qualquer nome válido mostra somente o mock identificado como São
  Paulo; retry mostra sucesso. O modo demonstrativo é visível, não simula uma
  consulta real e não substitui os requisitos de integração com a API.

## Functional Requirements

**RF-01 — Buscar e selecionar cidade.** O usuário deve poder enviar um nome de cidade, selecionar um resultado e consultar esse local. A busca vazia não é enviada. Resultados devem distinguir homônimos conforme os atributos definidos em Open Question 3. Uma resposta tardia de uma busca anterior não pode substituir os resultados da busca mais recente.

**RF-02 — Consultar condições atuais.** Após a seleção de uma cidade, o produto deve apresentar dados atuais associados à identidade dessa cidade e identificar os campos ausentes como indisponíveis. O conjunto obrigatório de campos ainda precisa ser definido em Open Question 2.

**RF-03 — Consultar previsão de cinco dias.** O produto deve apresentar cinco datas consecutivas: hoje e os quatro dias seguintes, em ordem cronológica. O fuso que determina “hoje” permanece em aberto em Open Question 9. Se houver resposta parcial, as datas permanecem identificadas e valores ausentes são marcados como indisponíveis.

**RF-04 — Alternar unidade de temperatura.** O usuário deve poder alternar entre Celsius e Fahrenheit. Celsius é o padrão quando não há preferência salva. Todos os valores atuais e previstos devem usar a unidade escolhida; a precisão de exibição e o arredondamento precisam ser aprovados em Open Question 11.

**RF-05 — Comunicar estados da consulta.** O produto deve distinguir carregamento, resultado vazio e erro de serviço. Erros devem encerrar o carregamento, ser comunicados em pt-BR e permitir nova tentativa manual. O limite de timeout é definido em Open Question 12.

**RF-06 — Usar a fonte meteorológica definida.** Os dados meteorológicos devem ser obtidos do Open-Meteo, conforme a decisão do discovery. A adequação de cobertura, limites de uso e termos ainda precisa ser confirmada.

**RF-07 — Disponibilizar a interface em pt-BR.** A interface deve apresentar seus textos em português do Brasil. Suporte a outros idiomas não faz parte da decisão atual.

## User Stories

**US-01 — Encontrar uma cidade (RF-01).** Como Camila, quero pesquisar uma cidade pelo nome e selecionar o resultado correto para consultar o clima do local onde estou interessada.

**US-02 — Ver o tempo atual (RF-02, RF-06).** Como Camila, quero ver as condições atuais da cidade selecionada, obtidas da fonte meteorológica definida, para decidir o que vestir ou levar.

**US-03 — Planejar uma viagem (RF-03, RF-06).** Como Rafael, quero comparar em pt-BR a previsão diária de cinco dias da cidade consultada, obtida da fonte meteorológica definida, para organizar atividades e bagagem antes e durante o percurso.

**US-04 — Escolher uma unidade (RF-04).** Como Camila, quero alternar entre Celsius e Fahrenheit para interpretar as temperaturas na unidade com que estou acostumada.

**US-05 — Escolher um dia para atividade externa (RF-03, RF-06, RF-07).** Como Joana, quero identificar em pt-BR as temperaturas e condições previstas para cada um dos próximos cinco dias, com dados da fonte meteorológica definida, para escolher uma data adequada sem recorrer a outra fonte.

**US-06 — Entender o estado da consulta (RF-05).** Como Rafael, quero saber se a busca ou consulta está carregando, não encontrou resultados ou falhou para entender o estado dos dados ao planejar minha viagem.

**US-07 — Entender os dados em meu idioma (RF-07).** Como Joana, quero consultar a cidade, as datas e as informações meteorológicas em pt-BR para compreender a previsão ao organizar uma atividade externa.

## Acceptance Criteria

Cada requisito funcional tem critérios Given/When/Then. Critérios marcados como dependentes de decisão só ficam prontos para automação após a aprovação da pergunta indicada.

### RF-01 — Buscar e selecionar cidade

- **AC-01:** **Given** um nome de cidade não vazio, **When** a busca retorna resultados, **Then** cada resultado é uma opção selecionável e identifica a cidade e o contexto geográfico aprovado (Open Question 3).
- **AC-02:** **Given** resultados de busca visíveis, **When** o usuário seleciona um resultado, **Then** as consultas meteorológicas subsequentes usam somente a identidade da cidade selecionada.
- **AC-03:** **Given** uma cidade previamente selecionada e uma nova busca sem resultados, **When** o geocoding retorna lista vazia, **Then** a interface informa “Nenhuma cidade encontrada”, mantém a consulta anterior identificável e não a substitui nem inicia uma nova consulta meteorológica.
- **AC-04:** **Given** campo vazio ou composto apenas por espaços, **When** o usuário envia a busca, **Then** a interface solicita um nome de cidade, não consulta o geocoding e preserva a cidade atualmente selecionada.
- **AC-05:** **Given** um nome com acentos, apóstrofos ou hífens, **When** a busca é enviada, **Then** o texto enviado ao geocoding preserva esses caracteres após remover espaços externos e o nome retornado é exibido como texto, sem interpretação de marcação.
- **AC-06:** **Given** uma busca A ainda pendente, **When** o usuário envia uma busca B e as respostas chegam fora de ordem, **Then** somente os resultados de B são apresentados e a resposta tardia de A não altera a seleção nem os dados exibidos.
- **AC-07:** **Given** dois resultados com o mesmo nome de cidade, **When** são apresentados, **Then** os atributos acordados permitem distingui-los sem selecionar um resultado implicitamente (Open Question 3).

### RF-02 — Consultar condições atuais

- **AC-08:** **Given** uma cidade selecionada e uma resposta válida, **When** a consulta termina, **Then** a cidade exibida corresponde à selecionada e todos os campos obrigatórios do contrato meteorológico aprovado são apresentados (Open Question 2).
- **AC-09:** **Given** uma resposta atual sem um campo obrigatório, **When** os dados são apresentados, **Then** os campos disponíveis são exibidos e o campo ausente é marcado como indisponível, nunca substituído por zero ou por dado anterior não identificado (Open Question 2).

### RF-03 — Consultar previsão de cinco dias

- **AC-10:** **Given** uma cidade selecionada e dados para hoje e os quatro dias seguintes no fuso aprovado, **When** a previsão termina de carregar, **Then** são apresentados exatamente cinco datas consecutivas, na ordem cronológica e com a data identificada em cada item (Open Question 9).
- **AC-11:** **Given** que um ou mais valores da previsão estão ausentes, **When** a previsão é apresentada, **Then** as cinco datas permanecem visíveis e cada valor ausente é marcado como indisponível, sem inventar valores (Open Questions 2 e 9).

### RF-04 — Alternar unidade de temperatura

- **AC-12:** **Given** que não há preferência salva, **When** uma nova sessão começa, **Then** a unidade selecionada é Celsius.
- **AC-13:** **Given** temperaturas atuais e previstas visíveis, **When** o usuário alterna a unidade, **Then** todos os valores são convertidos da unidade de origem e exibidos com o rótulo correto; a regra de arredondamento aprovada é aplicada (Open Question 11).
- **AC-14:** **Given** qualquer temperatura visível, **When** a unidade é alterada, **Then** nenhum valor permanece com rótulo incompatível com sua unidade.

### RF-05 — Comunicar estados da consulta

- **AC-15:** **Given** uma busca ou consulta pendente, **When** o pedido ainda não terminou, **Then** a interface expõe um estado de carregamento identificável por tecnologia assistiva e encerra esse estado ao receber sucesso, vazio ou erro.
- **AC-16:** **Given** uma resposta vazia de geocoding, **When** o estado final é apresentado, **Then** a mensagem de ausência de resultados é distinta de uma mensagem de falha de serviço.
- **AC-17:** **Given** uma falha de rede, HTTP, limite de uso ou timeout, **When** a interface apresenta o estado final, **Then** mostra erro em pt-BR, não mantém o carregamento ativo e mantém a cidade anterior identificável sem apresentar dados antigos como atuais.
- **AC-18:** **Given** um erro recuperável, **When** o usuário aciona “Tentar novamente”, **Then** uma nova solicitação para a mesma busca ou cidade é iniciada e o carregamento volta a ser apresentado.
- **AC-19:** **Given** que uma solicitação excedeu o timeout aprovado, **When** a solicitação é encerrada, **Then** a mensagem informa que o tempo de espera expirou e a interface permite tentar novamente (Open Question 12).

### RF-06 — Usar Open-Meteo

- **AC-20:** **Given** uma solicitação de dados meteorológicos, **When** a integração é executada sem chave de API, **Then** ela consulta Open-Meteo sem exigir credencial e a resposta é associada à cidade solicitada. A aprovação de termos, cobertura e limites é gate de produção (Open Question 1).

### RF-07 — Disponibilizar interface em pt-BR

- **AC-21:** **Given** qualquer estado visível da aplicação, **When** textos, rótulos ou mensagens são apresentados, **Then** estão em pt-BR, inclusive carregamento, vazio, erro e recuperação.
- **AC-22:** **Given** uma data, hora ou número apresentado ao usuário, **When** é formatado, **Then** usa as convenções de pt-BR e o fuso aprovado para a cidade (Open Questions 5 e 9).

### Critérios de qualidade e operação

- **AC-23:** **Given** o fluxo principal de busca, seleção, consulta e troca de unidade, **When** é operado somente por teclado, **Then** todas as ações são alcançáveis, a ordem de foco é previsível e o foco visível não se perde.
- **AC-24:** **Given** uma viewport de 320 px de largura, **When** qualquer estado da aplicação é exibido, **Then** não há rolagem horizontal da página nem controles inacessíveis.
- **AC-25:** **Given** o perfil de rede e dispositivo aprovado, **When** são medidas buscas e consultas completas, **Then** o percentil 95 do envio da ação até a apresentação dos dados não excede 2 segundos (Open Question 6).
- **AC-26:** **Given** dados meteorológicos recebidos com sucesso, **When** são apresentados, **Then** a interface informa o horário da consulta; dados acima da idade máxima aprovada não são apresentados como atuais (Open Question 7).
- **AC-27:** **Given** cada navegador e versão da matriz suportada, **When** os fluxos principais são executados, **Then** busca, seleção, previsão e alternância de unidade passam nos critérios funcionais (Open Question 13).
- **AC-28:** **Given** uma implantação de produção, **When** o tráfego e as solicitações externas são verificados, **Then** a aplicação usa HTTPS e não coleta localização precisa sem consentimento explícito.
- **AC-29:** **Given** que nenhuma cidade está selecionada, **When** a aplicação é aberta, **Then** a busca está disponível, nenhum dado meteorológico de uma cidade não selecionada é apresentado e nenhum carregamento é anunciado antes de uma solicitação.
- **AC-30:** **Given** um mês-calendário completo de monitoramento, **When** a disponibilidade da aplicação é calculada pelo método aprovado, **Then** ela é de pelo menos 99,5%, conforme o escopo e as exclusões aprovados em Open Question 6.

## Non-Functional Requirements

- **RNF-01 — Responsividade:** em viewport de 320 px ou mais, nenhuma tela ou estado pode causar rolagem horizontal da página; busca, resultados, clima atual e cinco datas devem permanecer acessíveis. Ver AC-24.
- **RNF-02 — Acessibilidade:** atender WCAG 2.2 nível AA. Todo fluxo principal deve ser operável por teclado, controles devem ter nomes acessíveis e atualizações de estado devem ser anunciadas por tecnologia assistiva. Ver AC-15 e AC-23.
- **RNF-03 — Desempenho:** o percentil 95 do tempo entre envio de busca/consulta e apresentação do resultado deve ser de até 2 segundos no perfil de rede e dispositivo aprovado. Ver AC-25; perfil de medição pendente em Open Question 6.
- **RNF-04 — Resiliência:** erro de rede, erro HTTP, limite de uso, resposta inválida, resposta parcial ou timeout deve terminar em um estado definido; erro não pode manter carregamento ativo indefinidamente. Ver AC-09, AC-11 e AC-15 a AC-19.
- **RNF-05 — Clareza dos dados:** cada temperatura deve incluir unidade; cada previsão deve identificar sua data; cidade consultada e horário da consulta devem ser identificáveis. Ver AC-08 a AC-11 e AC-26.
- **RNF-06 — Disponibilidade:** meta inicial de 99,5% de disponibilidade mensal da aplicação. Falha da fonte externa deve ser observável e comunicada, nunca apresentada como sucesso. Método de cálculo, monitoramento e escopo das exclusões devem ser aprovados em Open Question 6.
- **RNF-07 — Atualidade:** informar o horário da consulta e não apresentar dados acima da idade máxima aprovada como atuais. Ver AC-26; a idade máxima depende da Open Question 7.
- **RNF-08 — Compatibilidade:** suportar as duas versões estáveis mais recentes de Chrome, Firefox, Safari e Edge e os navegadores padrão atuais de Android e iOS. A matriz/versionamento de teste precisa ser aprovada em Open Question 13.
- **RNF-09 — Privacidade e segurança:** todo tráfego de produção deve usar HTTPS. O escopo atual não solicita localização precisa; ela não pode ser coletada ou armazenada sem consentimento explícito. Não há autenticação nem persistência em servidor.

## Rastreabilidade

A tabela relaciona cada User Story aos critérios de aceite do seu fluxo e aos requisitos não funcionais que condicionam sua entrega.

| User Story | Acceptance Criteria do fluxo | Requisitos não funcionais relevantes |
| --- | --- | --- |
| US-01 — Encontrar uma cidade | AC-01 a AC-07, AC-15 a AC-19, AC-21 | RNF-01, RNF-02, RNF-03, RNF-04, RNF-08, RNF-09 |
| US-02 — Ver o tempo atual | AC-08, AC-09, AC-15, AC-17 a AC-22, AC-26 | RNF-01 a RNF-09 |
| US-03 — Planejar uma viagem | AC-10, AC-11, AC-15, AC-17 a AC-22, AC-26 | RNF-01 a RNF-09 |
| US-04 — Escolher uma unidade | AC-12 a AC-14 | RNF-01, RNF-02, RNF-05, RNF-06, RNF-08, RNF-09 |
| US-05 — Escolher um dia para atividade externa | AC-10, AC-11, AC-15, AC-17 a AC-22, AC-26 | RNF-01 a RNF-09 |
| US-06 — Entender o estado da consulta | AC-03, AC-15 a AC-19, AC-21 | RNF-01, RNF-02, RNF-03, RNF-04, RNF-06, RNF-08, RNF-09 |
| US-07 — Entender os dados em meu idioma | AC-21, AC-22, AC-26 | RNF-01, RNF-02, RNF-05, RNF-06, RNF-07, RNF-08, RNF-09 |

**Critérios transversais:** AC-15 e AC-17 a AC-19 aplicam-se aos fluxos de busca e consulta (US-01, US-02, US-03, US-05 e US-06); AC-16 aplica-se à busca (US-01 e US-06). AC-21 aplica-se a todas as stories. AC-23, AC-24, AC-27, AC-28 e AC-30 também são comuns a todas. AC-25 aplica-se às stories que iniciam busca ou consulta (US-01, US-02, US-03, US-05, US-06 e US-07). AC-26 aplica-se às stories que apresentam dados meteorológicos (US-02, US-03, US-05 e US-07). AC-29 cobre o estado inicial da US-01.

## Edge Cases

- **Cidade inexistente:** quando o nome pesquisado não corresponder a uma cidade disponível no geocoding, informar que nenhuma cidade foi encontrada, manter o texto pesquisado editável e não iniciar consulta meteorológica nem selecionar outra cidade implicitamente.
- **Input vazio:** se o campo estiver vazio ou contiver apenas espaços, não consultar o geocoding; solicitar o nome da cidade e manter inalterada qualquer seleção existente.
- **Caracteres especiais:** preservar acentos, apóstrofos e hífens no texto enviado ao geocoding; exibir o nome retornado como texto literal, sem interpretação de marcação.
- **Falha de API:** em erro HTTP, indisponibilidade, limite de uso ou falha de rede, encerrar o carregamento, informar a falha em pt-BR, manter a cidade selecionada identificável e não apresentar dados antigos como se fossem atuais. Disponibilizar a ação “Tentar novamente”.
- **Timeout:** quando uma solicitação ultrapassar o limite de tempo configurado, encerrar o carregamento, informar que a solicitação expirou e permitir nova tentativa para a mesma busca ou cidade. O limite de tempo ainda precisa ser definido.
- **Geocoding sem resultados:** quando o serviço de geocoding retornar uma lista vazia, informar que não há correspondências para o texto pesquisado; não tratar como falha de API, não selecionar cidade e não solicitar previsão. Manter a consulta disponível para edição.
- **Resposta parcial:** apresentar os campos válidos recebidos e identificar cada campo meteorológico ausente como indisponível; não inventar valores, usar zero como substituto ou reaproveitar um valor anterior sem identificá-lo como desatualizado. Para um dia sem valores, manter a data na previsão e indicar que os dados daquele dia estão indisponíveis. A lista de campos esperados depende da Open Question 2.
- **Cidades homônimas ou com nomes semelhantes:** apresentar informações de desambiguação suficientes para a seleção; campos e ordenação ainda precisam ser definidos.
- **Mudança de data entre cidade e dispositivo:** a previsão deve seguir o fuso horário da cidade selecionada, a confirmar, para manter a janela de hoje mais quatro dias.
- **Alternância de unidade durante carregamento ou após uma falha:** os valores disponíveis não podem ser rotulados com uma unidade diferente daquela em que são apresentados; o comportamento durante carregamento depende do fluxo final de consulta.
- **Dados potencialmente desatualizados:** informar quando foram consultados e respeitar o limite de idade assim que ele for acordado.
- **Tela estreita ou zoom:** controles e dados devem continuar utilizáveis dentro dos requisitos de responsividade e acessibilidade.

## Assumptions

- O usuário informa uma cidade; geolocalização automática não foi solicitada.
- A aplicação depende de internet para buscar dados atualizados.
- O uso principal é individual e não requer conta.
- A previsão contém hoje e os quatro dias seguintes.
- Celsius é a unidade inicial e pt-BR é o idioma inicial.
- Não haverá persistência em servidor no escopo atual.
- Os requisitos numéricos de responsividade, desempenho e disponibilidade do discovery são metas iniciais, ainda sujeitas à validação.

## Risks

| Risco | Probabilidade | Impacto | Mitigação |
| --- | --- | --- | --- |
| Cidades homônimas podem levar à seleção do local incorreto. | Média | Alto | Apresentar dados de desambiguação e validar a experiência de seleção. |
| Open-Meteo pode ter limites, termos ou cobertura incompatíveis com o uso pretendido. | Média | Alto | Validar limites, termos e cobertura antes de confirmar a dependência operacional. |
| Falha ou lentidão da fonte externa pode impedir a consulta. | Média | Alto | Comunicar o erro, encerrar o carregamento e oferecer nova tentativa manual; cache não é prometido nesta versão. |
| Fuso horário indefinido pode deslocar a janela da previsão de cinco dias. | Média | Médio | Definir o fuso de referência e explicitar as datas na interface. |
| Conversão ou rótulo incorreto pode induzir interpretação errada da temperatura. | Baixa | Alto | Validar conversões e verificar que todos os valores e unidades visíveis mudam juntos. |
| A previsão pode ser difícil de ler em telas pequenas. | Média | Médio | Validar a experiência em diferentes larguras e com tecnologia assistiva. |
| Metas operacionais propostas podem não corresponder às expectativas do negócio ou às dependências externas. | Média | Médio | Aprovar metas de desempenho, disponibilidade, compatibilidade e atualidade antes de definir a aceitação operacional. |

## Out of Scope

- Autenticação, contas de usuário e persistência de dados em servidor.
- Geolocalização automática ou consulta da localização atual; qualquer coleta futura exige decisão e consentimento explícito.
- Favoritos e histórico de buscas, até que sejam aprovados como escopo.
- Idiomas além de pt-BR, até que haja decisão de localização adicional.
- Alertas meteorológicos ou notificações, não solicitados no discovery.
- Garantia de funcionamento offline; a aplicação pressupõe conexão com a internet.

## Open Questions

As perguntas marcadas **Bloqueia produção** precisam de decisão e atualização dos critérios dependentes antes da aprovação para lançamento.

1. **Bloqueia produção — Provedor:** confirmar termos aplicáveis, limites de uso e cobertura do Open-Meteo para o uso pretendido. Se não forem adequados, reabrir a decisão da fonte.
2. **Bloqueia produção — Contrato de dados:** aprovar a lista obrigatória de campos para clima atual e cada dia da previsão, bem como quais campos podem faltar sem invalidar a resposta. Afeta AC-08, AC-09 e AC-11.
3. **Bloqueia produção — Geocoding:** confirmar o provedor; definir campos exibidos para distinguir cidades, tratamento de nomes parciais/localizados e ordenação/limite de resultados. Afeta AC-01, AC-06 e AC-07.
4. **Fora do escopo atual — Localização e favoritos:** não haverá geolocalização, cidade atual, favoritos ou histórico nesta versão. Reabrir apenas se houver mudança de escopo.
5. **Não bloqueia produção — Localidade:** manter pt-BR para textos e formatação de datas/números; qualquer suporte regional adicional exige decisão de expansão de escopo.
6. **Bloqueia produção — SLOs e medição:** aprovar perfil de rede/dispositivo para o limite de 2 s p95, método e escopo de cálculo de 99,5% mensal e estratégia de monitoramento. Afeta AC-25 e RNF-06.
7. **Bloqueia produção — Idade dos dados:** definir a idade máxima aceitável e a apresentação de dados que ultrapassem esse limite. Afeta AC-26 e RNF-07.
8. **Não bloqueia produção — Persistência local:** nesta versão, a unidade começa em Celsius quando não há preferência; não há compromisso de persistir unidade ou buscas entre sessões. Alterações requerem decisão de privacidade e retenção.
9. **Bloqueia produção — Fuso horário:** definir o fuso que determina “hoje” para cada cidade consultada. Afeta AC-10, AC-11 e AC-22.
10. **Não bloqueia produção — Cache:** a versão atual não promete cache nem exibição de dados anteriores após falha. Se cache for introduzido, definir validade e indicação de desatualização antes dessa mudança.
11. **Resolvida — Precisão:** aprovado pelo usuário em 27/10/2026: exibir uma casa decimal em Celsius e Fahrenheit, arredondando somente na apresentação com `Intl.NumberFormat('pt-BR')`. Preservar os valores canônicos em Celsius. Afeta AC-13.
12. **Bloqueia produção — Timeout:** definir limite máximo para geocoding e consulta meteorológica. Afeta AC-19.
13. **Bloqueia produção — Matriz de compatibilidade:** registrar versões mínimas e dispositivos/navegadores móveis suportados no ciclo de lançamento. Afeta AC-27 e RNF-08.