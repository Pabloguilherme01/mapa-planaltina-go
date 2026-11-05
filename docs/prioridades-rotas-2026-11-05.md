# Prioridades de rotas de Planaltina-GO — 5 de novembro de 2026

Esta lista identifica ligações prioritárias para pesquisa e validação. Não afirma que cada via está ausente do mapa, nem apresenta itinerários calculados ou horários vigentes. A malha local é recortada pelo limite municipal; portanto não calcula viagens completas para outras cidades.

## Vias urbanas prioritárias para avaliação

O memorial estadual das circunscrições de Planaltina-GO descreve os cruzamentos abaixo. A prioridade é proposta para testar a rede; o documento não classifica fluxo de veículos nem prova que exista falha no aplicativo. A grafia e o enquadramento espacial devem ser conferidos no OSM e em campo antes de destacar trechos no mapa.

| Via ou trecho | Referência documental | Teste prioritário |
| --- | --- | --- |
| Avenida Elísio Vaz | Conecta-se à Rua 7 e à Avenida Pedro Ludovico no memorial; há também endereço de serviço público estadual nessa avenida. | Testar acessos entre os dois cruzamentos e destinos verificados próximos, nos dois sentidos e por modo. |
| Avenida Pedro Ludovico | O memorial a liga à Elísio Vaz e à Rua 16. | Testar a continuidade com os trechos vizinhos, direções permitidas e acesso a serviços. |
| Rua dos Carbonari / GO-534 | O memorial descreve mudança de nome após o cruzamento da Pedro Ludovico com a Rua 16 e continuidade em direção à divisa do DF. | Testar o trecho municipal e a transição na Rua 16; viagens além da divisa não são cobertas pelo grafo atual. |
| Avenida B / GO-430 | O memorial usa ambos os nomes no trecho que cruza a Rua 7. | Testar o acesso à Rua 7 e a conectividade com a rede urbana em ambos os sentidos. |
| Rua 7 | O memorial identifica seus cruzamentos com Avenida B/GO-430 e Elísio Vaz. | Verificar conexão aos dois eixos, sentidos e acessos para pedestres e bicicletas. |
| Rua 16 | O memorial a usa como referência para a mudança entre Pedro Ludovico e Rua dos Carbonari/GO-534. | Testar continuidade e opções legais de conversão; relações de restrição ainda não são processadas pelo grafo. |

Fontes: [memorial estadual das circunscrições de Planaltina](https://legisla.casacivil.go.gov.br/api/v1/arquivos/18608) e [endereço estadual de serviço na Avenida Elísio Vaz](https://goias.gov.br/administracao/inexigibilidade-2024/). Consultadas em 05/11/2026.

| Prioridade | Ligação a estudar | Evidência e próximo passo | Aceite |
| --- | --- | --- | --- |
| P0 | Deslocamentos locais: bairros, saúde e serviços | Medir conectividade no grafo OSM publicado usando origens e destinos com coordenadas verificadas, nos dois sentidos e por modo. Registrar data do snapshot e pontos sem ligação. | Testes de trajetos representativos e checagem de campo; corrigir no OSM com evidência, sem gerar segmentos artificiais. |
| P1 | Planaltina-GO–Planaltina-DF e Sobradinho-DF | A ANTT lista ligações por Planaltina-DF via Jardim Roriz e Estância e ligação com Sobradinho. É documento de planejamento, não prova de operação atual ou do itinerário detalhado. Consultar bases operacionais e arquivos geográficos vigentes. | Confirmar linha, operadora, sentido, geometria e atualização; desenvolver e testar cobertura fora do município antes de publicar roteiro. |
| P1 | Planaltina-GO–Brasília/DF | A ANTT lista ligações com Mutirão e Bairro das Palmeiras, entre outras. Confirmar a operação atual, variantes e itinerários na fonte oficial. | Mesmo aceite do eixo para o DF; horários e tarifas só após validação de vigência. |
| P1 | Planaltina-GO–Formosa-GO | A AGR publica quadro de fevereiro de 2026 para a linha 1332.1239-01, com GO-430, BR-010 e GO-430; conferir eventuais alterações com a AGR. | Confirmar vigência e geometria, cruzar com OSM e testar o percurso completo nos dois sentidos. |
| P2 | GO-118/BR-010: divisa DF–Planaltina–São Gabriel | A relação estadual descreve os segmentos. Verificar conectividade e restrições por modo na malha regional atualizada. | Grafo regional verificado, testes de fronteira e comportamento sem conexão. |

## Limitações que precisam ser resolvidas

- Não há cobertura fora do município no grafo atual; ampliar o recorte sem perder continuidade nas fronteiras, observando tamanho do download e armazenamento em celulares.
- O importador não incorpora relações de restrição de conversão do OSM; o menor caminho não equivale a navegação segura ou a instruções curva a curva.
- Validar linhas e horários diretamente nas bases oficiais, diferenciando serviço ativo de documento de licitação ou quadro antigo. Não inferir paradas, trajetos ou coordenadas.
- Executar testes físicos da issue #27 para GPS, rede instável, PWA e navegação externa; emulação não substitui campo.

## Fontes consultadas

- [ANTT — relação de linhas em documento de licitação](https://www.gov.br/antt/pt-br/assuntos/passageiros/transportesemiurbano/convenio-taguatur/licitacoes-de-linhas-do-sistema-de-transporte-rodoviario-coletivo-interestadual-e-internacional-de-passageiros.pdf/%40%40download/file).
- [ANTT — informações operacionais vigentes](https://www.gov.br/antt/pt-br/assuntos/passageiros/transportesemiurbano/informacoes-operacionais-do-semiurbano).
- [AGR — quadro Formosa/Planaltina de 06/02/2026](https://goias.gov.br/agr/wp-content/uploads/sites/43/2026/02/QH-Semiurbana-no-1332.1239-01-Formosa-a-Planaltina.pdf) e [página de quadros da empresa](https://goias.gov.br/agr/quadros-de-horarios-da-viacao-lider-ltda/).
- [Governo de Goiás — relação de trechos rodoviários](https://legisla.casacivil.go.gov.br/api/v2/pesquisa/legislacoes/114433/pdf).
- [OpenStreetMap — regras de sentido específicas para bicicletas](https://wiki.openstreetmap.org/wiki/Key:oneway:bicycle).
