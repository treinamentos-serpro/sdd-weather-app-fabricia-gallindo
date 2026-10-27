# Discovery: Aplicação de Previsão do Tempo

## Contexto

A empresa solicitou uma aplicação para que usuários consultem o tempo em cidades de seu interesse. O produto deve apresentar as condições atuais e a previsão para cinco dias, permitir alternância entre Celsius e Fahrenheit e funcionar em dispositivos móveis.

As decisões deste discovery definem a fonte de dados, o período da previsão, a unidade padrão, a ausência de autenticação e persistência de servidor e o idioma da interface. Ainda precisam ser esclarecidos os dados meteorológicos exibidos, detalhes da experiência de busca e o fuso horário usado para determinar o dia atual.

## Requisitos Funcionais

- **RF1 — Buscar cidades:** permitir que o usuário pesquise cidades pelo nome e selecione a cidade desejada.
- **RF2 — Consultar clima atual:** exibir as condições meteorológicas atuais da cidade selecionada.
- **RF3 — Consultar previsão:** exibir a previsão do tempo para cinco dias.
- **RF4 — Alternar unidades:** permitir alternar entre Celsius e Fahrenheit e atualizar os valores de temperatura exibidos.
- **RF5 — Informar estados da interface:** comunicar quando os dados estão carregando, quando não há resultados e quando ocorre um erro na busca ou consulta.

## Requisitos Não-Funcionais

- **RNF1 — Responsividade:** manter conteúdo e controles utilizáveis em larguras de tela a partir de 320 px, sem rolagem horizontal da página.
- **RNF2 — Acessibilidade:** permitir navegação por teclado, usar rótulos e controles semânticos e atender ao nível AA da WCAG 2.2.
- **RNF3 — Desempenho:** em conexão típica, apresentar resultados de busca e clima em até 2 segundos no percentil 95.
- **RNF4 — Resiliência:** tratar falhas de rede ou indisponibilidade da fonte de dados sem deixar a interface em estado indefinido.
- **RNF5 — Clareza:** apresentar cada temperatura com sua unidade e identificar claramente a cidade e a data ou período a que os dados se referem.
- **RNF6 — Disponibilidade:** buscar disponibilidade mensal mínima de 99,5% para a aplicação; falhas da fonte externa devem ser comunicadas e não contabilizadas como falha silenciosa. Meta proposta, sujeita à validação do negócio e das dependências externas.
- **RNF7 — Atualização dos dados:** informar quando os dados foram consultados e não apresentar dados além da idade máxima acordada para a fonte meteorológica. O limite depende da fonte selecionada.
- **RNF8 — Compatibilidade:** suportar as duas versões estáveis mais recentes de Chrome, Firefox, Safari e Edge, além dos navegadores padrão atuais de Android e iOS.
- **RNF9 — Privacidade e segurança:** usar HTTPS e não coletar ou armazenar localização precisa sem consentimento explícito. Confirmar se consultas ou preferências serão persistidas.

> Os limites numéricos de responsividade, acessibilidade, desempenho e disponibilidade são propostas iniciais para validação; não foram definidos no briefing.

## Riscos

| Risco | Probabilidade | Impacto | Mitigação |
| --- | --- | --- | --- |
| Cidades com nomes iguais ou semelhantes levam à seleção incorreta. | Média | Alto | Apresentar informações de desambiguação, como estado, região ou país. |
| A fonte de dados fica indisponível ou limita consultas. | Média | Alto | Tratar falhas, informar o usuário e avaliar cache ou limites de consulta. |
| O fuso horário usado para determinar “hoje” pode diferir entre a cidade consultada e o dispositivo do usuário. | Média | Médio | Definir o fuso horário de referência e explicitar as datas na interface. |
| Conversão ou apresentação de unidades está incorreta. | Baixa | Alto | Validar a conversão e testar a atualização de todos os valores afetados. |
| A experiência em telas pequenas dificulta a leitura da previsão. | Média | Médio | Adotar abordagem mobile-first e validar em diferentes larguras de tela. |

## Personas

- **Camila, decisão antes de sair:** consulta o clima atual no celular para decidir o que vestir ou levar. Considera sucesso encontrar a cidade e entender a temperatura e a condição atual rapidamente.
- **Rafael, planejador de viagem:** consulta a previsão no desktop antes da viagem e no celular durante o percurso para organizar atividades e bagagem. Considera sucesso comparar as condições dos próximos cinco dias.
- **Joana, organizadora de atividades externas:** consulta no celular ou desktop a previsão diária para escolher uma data adequada a atividades ao ar livre. Considera sucesso identificar temperaturas e condições por dia sem recorrer a outra fonte.

## Perguntas em Aberto

1. **Open-Meteo:** quais limites de uso, termos comerciais e requisitos de cobertura se aplicam? **Impacto:** a fonte pode não atender à cobertura ou ao uso pretendidos, alterando custo, disponibilidade ou a escolha do provedor.
2. **Dados exibidos:** quais informações devem compor o clima atual e a previsão diária? **Impacto:** indefinição muda o modelo de dados, as chamadas à API e o layout.
3. **Busca:** como tratar cidades homônimas, nomes parciais e resultados sem correspondência? **Impacto:** o usuário pode selecionar a cidade errada ou não conseguir encontrar a desejada; também afeta geocoding e estados vazios.
4. **Localização e favoritos:** haverá geolocalização, favoritos ou busca pela localização atual? **Impacto:** essas funções alteram escopo, permissões, privacidade e possível persistência local.
5. **Idiomas e regiões:** haverá suporte além da interface em pt-BR? **Impacto:** afeta localização de textos, formatos de data e número e configuração do geocoding.
6. **Qualidade operacional:** quais metas de desempenho, disponibilidade e compatibilidade com navegadores são necessárias? **Impacto:** sem metas acordadas, não é possível validar a experiência nem definir limites operacionais e de suporte.
7. **Atualização:** qual idade máxima dos dados é aceitável? **Impacto:** pode levar à exibição de dados desatualizados e determina cache, atualização e mensagens de validade.
8. **Persistência local:** histórico de buscas ou preferências poderão ser salvos no dispositivo? Quais dados e por quanto tempo? **Impacto:** afeta privacidade, armazenamento e se a unidade escolhida permanece entre sessões.
9. **Fuso horário:** qual fuso deve definir “hoje” para a cidade selecionada? **Impacto:** pode deslocar datas e incluir o dia errado na janela de cinco dias, sobretudo perto da virada do dia.

## Decisões

- **Fonte de dados: Open-Meteo, sem API key.** Define o provedor e elimina a necessidade de gerenciar uma chave de API. Resolve a escolha da fonte e a pergunta sobre chave; limites de uso, termos e cobertura ainda precisam ser validados.
- **Previsão de cinco dias: hoje mais os quatro dias seguintes.** Resolve a ambiguidade sobre incluir o dia atual. O fuso horário usado para determinar “hoje” permanece em aberto.
- **Unidade padrão: Celsius.** Define a unidade inicial e resolve a escolha entre Celsius e Fahrenheit; a alternância entre ambas continua disponível.
- **Sem autenticação e sem persistência de servidor.** Exclui contas e armazenamento de dados no servidor do escopo atual. Resolve as perguntas sobre login e persistência de servidor; persistência local de preferências ainda precisa ser decidida.
- **Idioma da interface: pt-BR.** Define o idioma inicial da UI e resolve a pergunta sobre o idioma padrão; idiomas adicionais e cobertura regional permanecem em aberto.

## Suposições

- O usuário informa uma cidade para consultar o clima; geolocalização automática não foi solicitada.
- A aplicação depende de conexão com a internet para buscar dados atualizados.
- O uso principal é individual e não exige autenticação, conforme decisão de escopo.
- A previsão cobre hoje e os quatro dias seguintes; o fuso horário de referência ainda precisa ser definido.
- Celsius é a unidade inicial e a interface está em pt-BR, conforme decisões deste discovery.
- Não haverá persistência de servidor; eventual persistência local de preferências ainda precisa ser decidida.
