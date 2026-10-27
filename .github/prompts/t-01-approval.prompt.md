---
mode: agent
description: 'Resolve e documenta as decisões de provedor e geocoding da tarefa T-01.'
---

# Prompt — T-01: Aprovar provedor e regras de geocoding

Implemente a tarefa **T-01 — Aprovar provedor e regras de geocoding** deste repositório.

## Contexto

O projeto é um Weather App desenvolvido seguindo Spec-Driven Development. A especificação e o plano são as fontes da verdade; não comece pela implementação de código.

A spec registra duas questões pendentes relevantes:

- **Open Question 1:** confirmar termos, limites de uso e cobertura do Open-Meteo para o uso pretendido. Se não forem adequados, reabrir a decisão da fonte meteorológica.
- **Open Question 3:** confirmar o provedor de geocoding e definir os atributos para distinguir cidades, o tratamento de nomes parciais/localizados e a ordenação/limite de resultados.

O plano técnico apresenta Open-Meteo Geocoding como candidato, não como decisão já aprovada. Ele descreve a chamada candidata `GET https://geocoding-api.open-meteo.com/v1/search` e propõe `name`, `language=pt`, `count` e `format=json`; o valor de `count` é apenas ilustrativo e não deve ser tratado como decisão de produto.

A spec exige que:

- Resultados permitam seleção explícita e distingam homônimos pelos atributos aprovados (AC-01, AC-07).
- A consulta preserve acentos, apóstrofos e hífens após aparar espaços externos (AC-05).
- A fonte meteorológica aprovada não exija credenciais e tenha termos, cobertura e limites adequados ao uso pretendido (AC-20).

## Objetivo

Resolver, documentar e rastrear as decisões das Open Questions 1 e 3. Não implementar services, componentes ou qualquer código de aplicação nesta tarefa.

## Trabalho

1. Examine a spec e o plano antes de editar.
2. Verifique evidências atuais em fontes oficiais do provedor para:
   - Termos aplicáveis ao uso pretendido.
   - Limites de uso relevantes.
   - Cobertura geográfica do serviço meteorológico.
   - Disponibilidade e comportamento do serviço de geocoding.
   - Suporte a busca por nomes parciais e nomes localizados.
   - Parâmetros de idioma, quantidade de resultados e ordenação, quando documentados.
3. Prefira documentação oficial e inclua links diretos para as fontes e, quando possível, a data da verificação. Diferencie fatos documentados, inferências e decisões de produto.
4. Registre na spec:
   - A decisão do provedor meteorológico e o estado de aprovação da Open Question 1.
   - A decisão do provedor de geocoding.
   - Os atributos geográficos exibidos para desambiguação.
   - O comportamento aprovado para nomes parciais/localizados.
   - A regra de ordenação e o limite de resultados, com o valor exato aprovado.
   - As fontes que justificam cada decisão.
5. Atualize os critérios afetados (AC-01, AC-05, AC-07 e AC-20) para refletir decisões aprovadas, mantendo-os coerentes com os requisitos RF-01 e RF-06.
6. Atualize a seção de APIs externas no plano para remover contradições entre decisões aprovadas e propostas. Não converta exemplos ou valores ilustrativos em requisitos sem aprovação explícita.
7. Se as fontes não forem suficientes para aprovar uma decisão de produto — por exemplo, definir o limite de resultados ou os campos de desambiguação — mantenha a questão explicitamente pendente, registre as opções e evidências disponíveis e informe qual decisão ainda precisa de aprovação. Não invente uma aprovação nem marque T-01 como concluída.

## Critérios de aceite

- Termos, cobertura e limites do provedor meteorológico estão documentados com fonte oficial e estado de aprovação explícito.
- Provedor, atributos de desambiguação, tratamento de localização/idioma e ordenação/limite de resultados estão documentados com fonte ou aprovação identificada.
- AC-01, AC-05, AC-07 e AC-20 refletem as decisões aprovadas; itens sem decisão permanecem claramente marcados como bloqueados/pendentes.
- Spec e plano não se contradizem e não apresentam sugestões ou exemplos como decisões aprovadas.
- Nenhum arquivo de `src/` ou `tests/` é alterado; não são introduzidas dependências nem implementação.
- O relatório final identifica arquivos alterados, decisões aprovadas e pendentes, links das evidências consultadas e validações executadas.

## Arquivos no escopo

- `specs/weather-app-spec.md`
- `plans/weather-app-plan.md`

Não altere outros arquivos sem necessidade demonstrável. Se uma decisão de produto depender de aprovação humana que não esteja registrada, pare nessa decisão, documente o bloqueio e solicite a aprovação em vez de presumir uma resposta.
