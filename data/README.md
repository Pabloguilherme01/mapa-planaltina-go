# Estabelecimentos históricos de Planaltina (IBGE 5217609)

`cnefe-2022-planaltina.json` contém registros do CNEFE/Censo 2022. Não comprova funcionamento atual. A data de obtenção é distinta do ano de referência.

Fonte oficial: https://ftp.ibge.gov.br/Cadastro_Nacional_de_Enderecos_para_Fins_Estatisticos/Censo_Demografico_2022/Arquivos_CNEFE/CSV/Municipio/52_GO/5217609_PLANALTINA.zip

Dicionário: https://ftp.ibge.gov.br/Cadastro_Nacional_de_Enderecos_para_Fins_Estatisticos/Censo_Demografico_2022/Arquivos_CNEFE/CSV/Dicionario_CNEFE_Censo_2022.xls

Importação: extrair o CSV e executar `python3 scripts/import-cnefe.py origem.csv data/cnefe-2022-planaltina.json`.

Somente coordenadas originais (`NV_GEO_COORD=1`) e estabelecimentos identificados das espécies 3, 4, 5, 6 e 8. Domicílios, obras, nomes vazios e indicações de unidades vagas são descartados. O build aplica ainda a malha municipal IBGE. Nenhum endereço é geocodificado ou inventado. Não são copiados nomes de moradores, contatos, dados de unidades residenciais ou coordenadas estimadas.

Cada tupla contém ID estável, identificação censitária, espécie, latitude, longitude, logradouro/número e localidade. IDs usam o código original e hash do registro sanitizado; reordenar a entrada não altera os IDs. Duplicações exatas são removidas. Nomes iguais em endereços distintos são preservados. Registros de fontes distintas permanecem auditáveis e não equivalem necessariamente a estabelecimentos únicos.

O aplicativo exibe origem oficial com confirmação pendente, rótulo Censo 2022 e aviso de funcionamento não confirmado. Vínculo SUS nunca é inferido do CNEFE. O snapshot é lido somente no build e publicado no catálogo estático, sem aumentar o JavaScript inicial.
