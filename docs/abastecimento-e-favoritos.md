# Abastecimento e destinos salvos

## Cadastro ANP

A seção Fontes incorpora 17 registros identificados de revendedores de Planaltina-GO, extraídos do cadastro oficial ANP consultado em 15/10/2026. A fonte possui razão social, endereço, bairro, bandeira e autorização; **não fornece coordenadas ou preços** nesse arquivo. Nenhum registro vira pin, estimativa de preço ou rota por aproximação. Cadastro não é garantia de operação ou horário atual.

O snapshot `src/data/fuelRegistry.json` guarda apenas os campos necessários e o SHA-256 do arquivo original para rastreabilidade. Não replica CNPJ, telefone ou e-mail. Todas as empresas precisam ter nome com letras, UF GO e município PLANALTINA. O importador rejeita identidades ou autorizações duplicadas; o build valida datas e campos e bloqueia coordenadas, preços ou contatos fora do contrato. Não há nova dependência de rede no build.

Atualização manual: obter o arquivo oficial em uma pasta de pesquisa e executar:

```powershell
python scripts/import-fuel-registry.py CAMINHO_DO_CSV_OFICIAL
npm test -- src/utils/fuelRegistry.test.ts --maxWorkers=1
npm run build:pages
npm run verify:pages
```

O importador filtra em fluxo o arquivo UTF-8 com `;`, valida antes de trocar o snapshot e mantém o arquivo anterior quando a entrada é inválida. Revisar diff e fonte antes de publicar. A interface não oferece downloads ou exportações.

[Fonte institucional ANP](https://www.gov.br/anp/pt-br/centrais-de-conteudo/dados-abertos/dados-cadastrais-dos-revendedores-varejistas-de-combustiveis-automotivos). Recurso original: `dados-cadastrais-revendedores-varejistas-combustiveis-automoveis.csv` no diretório de arquivos correspondente da ANP. Dados abertos; consultar condições da fonte ao reutilizar.

## Destinos favoritos

O mesmo botão de salvar viagem mantém a última viagem e acrescenta o destino a uma lista compacta de até oito favoritos, inspirada no uso do Trajeto. Não há novo botão redundante de salvar. Um destino ocupa uma entrada: salvar outro modo atualiza e move a entrada para o início. Armazenamento é opcional e local, limitado a identificador e modo de deslocamento; não guarda origem ou GPS.

O painel fica recolhido e oferece seleção e remoção por destino. Só permite navegar quando o identificador continua no catálogo real verificado. Um snapshot reduzido pode deixar favoritos temporariamente indisponíveis: eles não são promovidos a pontos reais nem apagados silenciosamente. A remoção funciona sem internet. A exclusão da última viagem permanece separada da remoção dos favoritos, com rótulos próprios. Alterações em outra aba são sincronizadas pelo evento storage.

Limites: não calcula nem armazena rota viária, trânsito ou horário de chegada; consulta offline depende de o catálogo ter sido carregado. Os seis modos e o fallback auditável anteriores permanecem.
