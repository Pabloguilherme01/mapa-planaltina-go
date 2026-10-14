# Mapa Planaltina GO

Mapa cívico de **Planaltina, Goiás**, código IBGE **5217609**, com React, TypeScript e identidade visual inspirada no cerrado.

Site: https://pabloguilherme01.github.io/mapa-planaltina-go/
Fontes: https://pabloguilherme01.github.io/mapa-planaltina-go/fontes/

## Estado dos dados

Os 20 pontos e as geometrias são DEMO, sintéticos e sem validade para deslocamento. Os nomes, endereços e horários não representam um cadastro municipal real. A consulta pública do IBGE valida somente a identificação municipal; a data e o estado dessa consulta aparecem na página de fontes. Prefeitura, CNES, INEP e OpenStreetMap têm adaptadores separados e permanecem não configurados. Origem oficial não implica auditoria de um ponto.

A procedência usa `official`, `verified_open_data`, `community` e `demo`. Licenças não verificadas são marcadas como pendentes. A geometria demonstrativa não é um cadastro legal de imóveis.

## Publicação no GitHub Pages

Cada alteração em `main` executa a checagem TypeScript, os testes e a construção estática, depois publica via GitHub Actions. O prefixo `/mapa-planaltina-go/` e o acesso direto a `/fontes/` estão configurados.

```sh
npm ci
npm run lint
npm test
npm run build:pages
npm run preview
```

O Pages hospeda HTML, CSS e JavaScript e não executa o servidor Express. Os dados DEMO e o resultado da consulta IBGE são exportados durante a construção. Se a consulta falhar, o site mostra a falha sem inventar metadados oficiais. A busca local do assistente funciona sem servidor e identifica explicitamente que não é uma chamada Gemini. A localização é solicitada com consentimento e permanece no dispositivo.

## Servidor, Gemini e integrações futuras

O código full-stack está preservado em `server/`. Para executá-lo:

```sh
npm ci
npm run build
npm start
```

Configure `GEMINI_API_KEY` somente no ambiente do servidor e `GEMINI_MODEL` conforme o modelo autorizado. Nenhuma chave privada deve ser inserida no frontend ou no repositório. As respostas exibidas usam apenas os registros selecionados e validados; texto livre do modelo não é mostrado como fato.

Depois de hospedar a API HTTPS com CORS restrito ao site, configure a variável de repositório `VITE_API_BASE_URL` e execute novamente o workflow de publicação. As rotas `/api/points`, `/api/sources`, `/api/municipality`, `/api/assistant` e `/api/health` estão implementadas.

Para o mapa real, configure `VITE_GOOGLE_MAPS_API_KEY` como chave de navegador restrita ao domínio `pabloguilherme01.github.io` e à Maps JavaScript API. O código implementa clusters e camadas GeoJSON; sua conexão real exige essa chave. O fallback DEMO permanece disponível.

PostgreSQL/PostGIS é uma integração futura. A migração SQL e a interface do repositório estão preparadas; não há banco provisionado ou conectado. As fontes reais devem ser importadas, licenciadas e verificadas antes de substituir os dados DEMO.

## Verificação

Há testes para busca, filtros, procedência, falha do IBGE, resposta inventada pelo modelo, roteamento do Pages e busca local sem servidor. O workflow deve passar integralmente antes da publicação.
