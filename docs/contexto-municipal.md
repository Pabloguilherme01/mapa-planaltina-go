# Contexto municipal e consulta escolar

## Dados IBGE

O painel em Fontes usa a tabela SIDRA 4714, período **2022**, variáveis 93 (população residente), 6318 (área territorial) e 614 (densidade). Todos os registros devem pertencer ao nível N6 e município **5217609**. O valor censitário não é apresentado como estimativa atual; referências de outras publicações, inclusive estimativas e decisões judiciais, podem diferir.

Os três distritos vêm da API oficial de localidades, com identificadores municipais conferidos. Não são bairros, centros geográficos nem polígonos distritais. Não há coordenadas inferidas ou novos pins.

O arquivo `src/data/municipalContext.json` preserva as respostas e a data da coleta. Build Pages e testes validam presença, unidades, período, município, valores finitos positivos, unicidade de distritos e data UTC não futura. O build usa o snapshot validado, sem acrescentar uma nova dependência de rede em produção.

Atualização manual, com revisão do diff:

```powershell
node --use-system-ca --import tsx scripts/sync-municipal-context.ts
npm test -- src/utils/municipalContext.test.ts --maxWorkers=1
npm run build:pages
npm run verify:pages
```

O script consulta somente endpoints fixos do IBGE. Qualquer falha HTTP, TLS, JSON ou contrato mantém o snapshot anterior; só troca o arquivo depois de validar as duas respostas. `--use-system-ca` usa as autoridades confiáveis do Windows, sem desativar a verificação TLS. Coleta não muda automaticamente o período censitário. Não há cron novo nem publicação automática desses dados.

## Consulta e exportações

- IBGE: download JSON com ano, unidades, códigos e URLs de procedência.
- SEDUC: busca por múltiplos termos sem acentos, filtros cumulativos por rede e zona, limpeza de filtros e download CSV somente das escolas encontradas.
- CSV: separador `;`, BOM UTF-8 para acentos, campos escapados, fonte/coleta/referência e ausência de geometria em cada linha. Não inclui telefone/e-mail. Células que poderiam executar fórmulas são prefixadas com apóstrofo.
- Cadastro SEDUC continua na referência **2024**, com 63 registros. Filtro não é confirmação de atendimento ou funcionamento atual. Não há geometria escolar.
- No celular, o filtro de procedência compartilha estado com o desktop e aplica-se ao mapa e à lista. DEMO continua separado e excluído do planejador.

## Fontes

- [SIDRA — tabela 4714 / Planaltina](https://servicodados.ibge.gov.br/api/v3/agregados/4714/periodos/2022/variaveis/93%7C6318%7C614?localidades=N6%5B5217609%5D)
- [Localidades — distritos de Planaltina](https://servicodados.ibge.gov.br/api/v1/localidades/municipios/5217609/distritos)
- [SEDUC — endereço das escolas](https://dadosabertos.go.gov.br/dataset/endereco-das-escolas-de-goias)
