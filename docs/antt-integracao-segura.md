# ANTT: fontes e gate para integração de horários e linhas

**Estado: integração de navegação a fontes oficiais, sem importar linhas, tarifas ou horários ao produto.**

A página `/fontes` oferece consultas diretas à [planilha de quadros de horários](https://www.gov.br/antt/pt-br/assuntos/passageiros/transportesemiurbano/informacoes-operacionais-do-semiurbano/quadro-de-horarios) e à [relação de empresas, linhas e tarifas](https://www.gov.br/antt/pt-br/assuntos/passageiros/transportesemiurbano/informacoes-operacionais-do-semiurbano/relacao-de-empresas-linhas-e-tarifas). O conteúdo dessas planilhas não foi validado linha a linha para Planaltina-GO.

## Requisitos antes de publicar horários ou rotas
1. Validar origem/destino com UF e **município IBGE 5217609**, diferenciando Planaltina-GO da região administrativa Planaltina-DF.
2. Registrar URL específica, data de atualização e de consulta, versão da planilha, identificador do serviço e operadora autorizada.
3. Separar serviço semiurbano regular de serviço diferenciado ou não aplicável. Validar tarifa vigente, período e tipo de serviço; tarifa histórica não vira preço atual.
4. Documentar sentido, variações dias úteis/sábado/domingo/feriado, fuso horário local e restrições operacionais sem inferir frequência.
5. Não usar coordenadas inventadas para terminais e paradas; ausência de dados espaciais impede pin e navegação própria.
6. Validar permissão de reutilização e plano de atualização; identificar quando a informação é arquivo histórico ou potencialmente defasado.
7. Criar testes para divergências de município, duplicatas, dados incompletos e a diferença entre horário programado e chegada em tempo real.
8. Somente após aprovação, integrar um snapshot versionado. Manter funcional a consulta externa oficial como fallback.

A issue [#26](https://github.com/Pabloguilherme01/mapa-planaltina-go/issues/26) continua aberta até o recorte operacional e as informações territoriais estarem validados.
