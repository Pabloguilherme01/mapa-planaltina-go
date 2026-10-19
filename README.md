# Mapa Planaltina GO

Mapa cívico de **Planaltina, Goiás**, código IBGE **5217609**, com React, TypeScript, PWA, testes de navegador e identidade visual inspirada no cerrado.

Site: https://pabloguilherme01.github.io/mapa-planaltina-go/  
Fontes: https://pabloguilherme01.github.io/mapa-planaltina-go/fontes/

## Estado dos dados

O projeto deixou de ser exclusivamente demonstrativo. O catálogo publicado é **misto e explicitamente tipado por procedência**:

- **Saúde real:** o adapter tenta consultar o **CNES/SES-GO** filtrado para o código municipal `521760`. Quando a fonte ao vivo responde, os registros válidos entram como `official`. Quando o órgão bloqueia ou fica indisponível, o projeto preserva somente um **último snapshot previamente validado**, classificado como `verified_open_data`, sem fingir que houve atualização ao vivo.
- **DEMO:** os 20 pontos sintéticos anteriores continuam disponíveis para homologação da interface, sempre com `isDemo: true`, procedência `demo` e aviso de que não servem para deslocamento.
- **Pesquisa comercial:** permanece na página `/fontes` como pesquisa comunitária/checagem pública, sem virar pin enquanto não houver geometria auditável.

A identificação oficial do município usa **IBGE 5217609**. A procedência dos pontos usa `official`, `verified_open_data`, `community` e `demo`, e o status de verificação é armazenado por registro.

### Regras para dado real

Um ponto só pode entrar no snapshot como real quando:

1. pertence inequivocamente a Planaltina-GO;
2. possui identificador estável na fonte;
3. possui latitude e longitude válidas — `0,0`, campos vazios e coordenadas inválidas são rejeitados;
4. registra URL, nome da fonte, data do snapshot, licença/aviso de licença e status de verificação;
5. não depende de inferência silenciosa para preencher atributos ausentes;
6. declara se veio da atualização ao vivo ou de um snapshot de contingência previamente validado.

A fonte CNES estadual não informa zona urbana/rural nesse recurso. Por isso, esses pontos usam **“Não classificada”** em vez de inferir “Urbana”. Telefones e e-mails existentes na base de origem não são replicados no mapa para reduzir o risco de contato operacional desatualizado.

> O recurso CNES/SES-GO informa **“Nenhuma Licença Fornecida”** no portal. O aplicativo preserva essa limitação como metadado; não atribui uma licença que a fonte não declarou.

## Fonte real de Saúde

Fonte live preferencial: **Cadastro Nacional de Estabelecimentos de Saúde (CNES) – SES / Estabelecimentos de Saúde – Goiás**.

- Portal: `dadosabertos.go.gov.br`
- Resource ID: `7559175a-98ac-4719-bf30-5e6455ba57c5`
- Filtro municipal do CNES: `codigo_ibge = 521760`
- Campos cartográficos utilizados: CNES, nome fantasia/razão social, endereço, latitude, longitude, município, UF, tipo do estabelecimento e vínculo SUS.
- Campos deliberadamente não publicados: telefone e e-mail.

O `CnesAdapter` consulta o CKAN DataStore com timeout, valida município/UF/coordenadas e converte somente registros utilizáveis em `MapPoint` real. A resposta também precisa ser JSON; páginas HTML de bloqueio do órgão são tratadas como indisponibilidade, não como dados.

### Last-known-good / contingência

O portal estadual apresentou bloqueios intermitentes nos runners da GitHub Actions. Para impedir que uma falha externa derrube o produto ou substitua dados úteis por uma coleção vazia, o projeto adota o mesmo princípio de robustez usado no **Trajeto**:

- tenta a atualização ao vivo primeiro;
- nunca promove resposta vazia, HTML de bloqueio ou geometria inválida;
- quando a atualização falha, usa apenas o snapshot mínimo versionado e já validado;
- expõe `snapshot_fallback` em `/fontes` e no JSON de fontes;
- mantém a procedência do fallback abaixo de `official` quando sua geometria foi verificada por uma fonte pública derivada.

O snapshot inicial de contingência contém a **UPA de Planaltina-GO, CNES 0112666**. Identidade e endereço foram conferidos no CNES/DataSUS oficial; a geometria pública foi conferida separadamente e, por isso, o ponto é publicado como `verified_open_data`, não como geometria oficial.

## Publicação no GitHub Pages

Cada alteração em `main` executa TypeScript, Vitest, construção estática, verificação do artefato e Browser QA antes/depois da integração. Pull requests executam as mesmas verificações sem publicar o site.

```sh
npm ci
npm run lint
npm test
npm run build:pages
npm run verify:pages
npm run preview
```

O `build:pages` gera um **snapshot auditável**. Ele exige pelo menos um ponto real verificável, vindo da fonte live ou do last-known-good. O JSON final informa `realCount`, `demoCount`, município, código IBGE, modo `misto_oficial_demo` e `realSourceMode` (`live` ou `snapshot_fallback`).

O Pages hospeda HTML, CSS e JavaScript e não executa o servidor Express. O resultado da coleta é congelado no build e servido por `public/data/points.json`/`dist/data/points.json`, portanto a aplicação não depende do CNES a cada abertura pelo usuário.

## Robustez, PWA e degradação controlada

O projeto segue princípios usados no **Trajeto Águas Lindas**: fontes externas têm contrato explícito, dados vazios ou não verificáveis não são promovidos silenciosamente, funcionalidades secundárias não devem quebrar a navegação central e regressões críticas são cobertas por testes unitários e de navegador.

O mapa esquemático continua disponível como provedor sem chave externa; Google Maps só fica disponível quando `VITE_GOOGLE_MAPS_API_KEY` está configurada. O fundo é claramente rotulado como esquemático, enquanto cada pin mostra se é **REAL** ou **DEMO**. Busca, filtros e leitura do snapshot permanecem locais no Pages.

A publicação gera manifesto instalável e service worker. Depois de uma visita online, shell, `/fontes/`, bundles e snapshots JSON ficam em cache para consulta sem conexão. O Browser QA executa recarga offline real após o service worker assumir o controle.

O verificador de artefato bloqueia o deploy se:

- o base path estiver incorreto;
- um ponto não declarar explicitamente se é DEMO ou real;
- um ponto real não tiver coordenadas válidas e proveniência verificável;
- `realCount`/`demoCount` divergirem do conteúdo;
- controles de protótipo do Stitch vazarem para produção;
- manifesto, service worker ou ícone instalável estiverem ausentes.

## UX de procedência

Desktop, mobile, mapa e ficha cadastral diferenciam visualmente:

- **REAL / Verificado:** origem, data de snapshot e geometria verificável disponíveis;
- **Snapshot preservado:** dado real mantido como contingência porque a atualização ao vivo não respondeu;
- **DEMO:** registro sintético e não utilizável para deslocamento.

A ficha de um ponto real não usa linguagem de “simulação”, e exibe licença/limitação declarada, fonte, snapshot e coordenadas. A página `/fontes` diferencia fonte ativa, snapshot preservado, não configurada e falha de atualização.

## Servidor, Gemini e integrações futuras

O código full-stack está preservado em `server/`. Para executá-lo:

```sh
npm ci
npm run build
npm start
```

Configure `GEMINI_API_KEY` somente no ambiente do servidor e `GEMINI_MODEL` conforme o modelo autorizado. Nenhuma chave privada deve ser inserida no frontend ou no repositório. Texto livre de modelo não deve ser promovido a fato territorial sem evidência cadastrada.

Depois de hospedar a API HTTPS com CORS restrito ao site, configure `VITE_API_BASE_URL`. As rotas `/api/points`, `/api/sources`, `/api/municipality`, `/api/assistant` e `/api/health` estão implementadas. A publicação oficial atual continua sendo o snapshot estático do GitHub Pages.

PostgreSQL/PostGIS permanece como evolução futura para ingestão maior, histórico e consultas espaciais.

## Próximas fontes reais

A ordem recomendada segue o mesmo padrão de qualidade desta camada CNES:

1. **Educação:** Catálogo de Escolas/Censo Escolar do INEP e base de endereços da SEDUC-GO; só publicar pins após obter geometria auditável, sem geocodificação opaca.
2. **Mobilidade:** linhas, terminais e itinerários a partir de fontes regulatórias/operacionais identificáveis.
3. **OSM:** geometria colaborativa sob ODbL, em camada separada da fonte oficial.
4. **Equipamentos municipais:** apenas quando houver endpoint, arquivo ou catálogo da Prefeitura com origem e data de atualização claras.

## Verificação

Há testes para busca, filtros, procedência, integração CNES live, fallback last-known-good, rejeição de geometria inválida, falha do IBGE, assistente, roteamento do Pages, disponibilidade do Google Maps, acessibilidade, PWA, reload offline e integridade do artefato. O Browser QA lê os snapshots publicados, exige ao menos um ponto real de Saúde, valida a procedência e abre sua ficha para confirmar que a UI o apresenta como dado real verificado.

## Retenção CNES entre builds

O Pages restaura um cache do snapshot CNES e o adapter tenta a fonte ao vivo primeiro. Somente uma coleta completa e validada substitui o arquivo, por gravação temporária e renomeação. São persistidos apenas campos cadastrais usados no mapa, sem telefone, e-mail ou URL de contato. Na falha live, os registros persistidos são revalidados pelo filtro municipal e coordenadas; conservam a data original e status snapshot_fallback. Snapshot inválido ou ausente usa a contingência versionada.

PRs podem restaurar cache, mas não gravam o cache de produção. O cache só é salvo no fluxo da main após verify:pages. O cache do GitHub pode expirar/ser removido; não equivale a arquivo histórico permanente. O primeiro snapshot completo só estará disponível após uma coleta live bem-sucedida com essa versão. Para uso local, configure CNES_SNAPSHOT_PATH com um arquivo fora do controle de versão. Não sincronize caches entre municípios.

## Entrega cartográfica e catálogo de Educação

Mapa padrão: Leaflet carregado sob demanda, com limite simplificado oficial IBGE (malhas API v3, codarea 5217609), agrupamento por proximidade no zoom e pontos geográficos. Não usar o antigo GeoJSON didático para delimitação real. A simplificação não substitui cadastro/levantamento de precisão. CNES coletado é preservado no cache; na publicação, pontos fora da malha são separados em data/territorial-review.json para revisão, sem mover coordenadas. A contagem real do mapa pode ser menor que a coleta da fonte.

Ruas online OpenStreetMap são opcionais, com atribuição visível, carregadas só por ação do usuário. Nenhum prefetch ou cache offline de tiles externos; service worker intercepta apenas mesma origem. Sem rede, vetor municipal e catálogo continuam disponíveis. Serviço de tiles não tem SLA; para uso de grande escala, escolher fornecedor/hospedagem com capacidade e termos adequados.

Educação: 63 registros SEDUC da referência 2024, coletados do recurso CSV escolas_endereco_seduc_2025, disponíveis em Fontes com busca por código/nome/bairro. Filtragem por Município=Planaltina e maior ano efetivamente disponível; telefones excluídos. CSV não contém geometria, logo não se transforma endereço em pin. INEP e coordenadas escolares permanecem integração pendente. Tentativa complementar Overpass bloqueada com HTTP 406; nenhum dado fictício usado no lugar.

Ônibus: canal oficial ANTT vinculado em Fontes. Linhas, paradas, GTFS, tarifas e horários operacionais ainda não foram validados; não há roteamento ou previsão de chegada. Pesquisa comercial permanece separada, sem pins até existir geometria verificável. API Gemini/rotas com custos não foram ativadas; o assistente local distingue REAL/DEMO e mostra fontes e datas.

Operação: coleta CNES agendada às segundas-feiras 12h UTC (9h São Paulo), sujeita à disponibilidade do GitHub/fontes. Snapshots publicados arquivados por 90 dias em Artifacts com SHA/run, além do cache de contingência. Isso é retenção limitada, não arquivo eterno. Revisar escolas anualmente na fonte SEDUC antes de atualizar o snapshot versionado. Indicação de idade mostra aviso após 30 dias, sem descartar automaticamente o último snapshot válido.

Rollback: abrir PR revertendo o squash desta entrega, aprovar testes/tipos/build/Browser QA e integrar para gerar novo Pages. Manter a última versão dos artefatos e verificar points/sources/territorial-review após deploy. Não alterar coordenadas da fonte para passar no teste territorial.

QA: Chromium mobile/desktop e WebKit emulado iPhone no CI, um worker por vez; não equivale a teste em aparelhos físicos. Antes de anunciar navegação de campo, validar pessoalmente em iPhone/Android, rede móvel e condições de acesso locais. Nenhuma promessa de paridade territorial completa com o Trajeto.


## Vigia independente do snapshot publicado

O workflow `.github/workflows/snapshot-health.yml` consulta diariamente o
`data/points.json` publicado, em horário diferente da coleta semanal do CNES.
Pode ser executado manualmente com `workflow_dispatch` e gera um resumo no
GitHub Actions. Ele verifica município IBGE, presença de pontos reais, contagens,
identidades, proveniência e datas UTC válidas. Um registro real com 30 dias ou
mais de idade sinaliza falha na Action para investigação; os dados DEMO não
participam da idade.

A idade é calculada pelo campo original `retrievedAt`: restaurar um snapshot
anterior **não** reinicia a contagem. Esta verificação é somente leitura:
não remove pontos, não altera o deploy nem substitui o last-known-good.
Falhas podem aparecer nas notificações configuradas do GitHub Actions; uma
execução agendada do GitHub não é garantia de pontualidade. Para produção
crítica, completar o monitoramento com uma checagem externa independente.

Execução local, exigindo rede HTTPS:

```sh
npm ci
npx tsx scripts/snapshot-health.ts
npm test -- tests/snapshot_health.test.ts
```
