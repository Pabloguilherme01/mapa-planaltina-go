# Mapa Planaltina GO

Mapa cívico de **Planaltina, Goiás**, código IBGE **5217609**, com React, TypeScript, PWA, testes de navegador e identidade visual inspirada no cerrado.

Site: https://pabloguilherme01.github.io/mapa-planaltina-go/  
Fontes: https://pabloguilherme01.github.io/mapa-planaltina-go/fontes/

## Estado dos dados

O catálogo público agora prioriza **pontos reais, sem DEMO por padrão**. Os registros são classificados por procedência, e presença na base colaborativa **não** equivale a confirmação municipal de endereço ou funcionamento:

- **Saúde real:** o adapter tenta consultar o **CNES/SES-GO** filtrado para o código municipal `521760`. Quando a fonte ao vivo responde, os registros válidos entram como `official`. Quando o órgão bloqueia ou fica indisponível, o projeto preserva somente um **último snapshot previamente validado**, classificado como `verified_open_data`, sem fingir que houve atualização ao vivo.
- **OpenStreetMap colaborativo:** escolas geolocalizadas, lojas, bancos, serviços, órgãos e paradas de transporte nomeados na base OSM são selecionados pela malha IBGE e apresentados como `community` / `unverified`. **Não são verificados oficialmente**; consultar nome, fonte e localização antes de sair. O build consulta Overpass uma vez (não a cada visita) e, se falhar, mantém a camada CNES sem inventar pontos.
- **DEMO:** os 20 pontos sintéticos permanecem apenas no repositório para teste da interface, sem publicação normal; podem ser exportados exclusivamente em homologação com `INCLUDE_DEMO_POINTS=true`.
- **Pesquisa comercial e escolas:** a página `/fontes` conserva as listas institucionais de referência; somente entradas com geometria OSM e procedência registrada viram pins, sem geocodificação presumida. A lista escolar institucional não deve ser confundida com a cobertura dos pins mapeados.

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

## Evolução: malha viária, acessibilidade e atualização automática

- **Mapa noturno:** seletor Aparência (Sistema/Claro/Escuro), seguindo `prefers-color-scheme` e salvando somente essa preferência no navegador. Tiles de ruas recebem um tratamento visual noturno sem alterar as coordenadas, os marcadores ou a atribuição OpenStreetMap.
- **Rotas locais sem API paga:** o GitHub Actions extrai uma malha viária real de Planaltina-GO de um arquivo regional OpenStreetMap/Geofabrik; o navegador calcula o menor percurso em comprimento pelas vias representadas no grafo para carro, caminhada ou bicicleta. O planejador permite duas localidades cadastradas ou GPS com consentimento como origem; não envia a origem ao serviço de rotas. Exibe o traçado e distância aproximada no mapa; recusa ruas sem ligação e pontos distantes da rede em vez de desenhar linhas inventadas. **Não contempla restrições temporárias, obras, velocidade, tráfego ao vivo, proibições complexas de manobra, segurança, nem itinerários e horários de ônibus.** Para instruções curva a curva, permanece a abertura em Google Maps, Waze, Apple Maps ou Organic Maps.
- **Filtros refinados:** categoria, fonte/procedência, estado da verificação, tipo, zona, ordenação alfabética ou por distância e raio de até 10 km com GPS autorizado. Sem permissão de geolocalização, a busca e os filtros não dependentes da posição continuam disponíveis.
- **Atualização sem custo de API:** o workflow Pages faz coleta diária (09h27 UTC) e a vigia já existente verifica diariamente idade/integridade do catálogo e, agora, da malha viária. O último site publicado permanece disponível se uma coleta falhar. GitHub Actions, Geofabrik e tiles comunitários têm políticas de uso e limites; não há garantia de serviço ilimitado ou tráfego ao vivo.
- **PWA:** a malha de ruas não é baixada silenciosamente no primeiro acesso; é obtida sob demanda no planejamento e guardada pelo service worker após a primeira consulta bem-sucedida. Isso evita transferências desnecessárias em planos móveis.

## Mapas, filtros e custo zero

- Leaflet com limite territorial IBGE e ruas OpenStreetMap sob demanda online: sem provedor comercial obrigatório e sem baixar tiles para uso offline. Exibir crédito **© OpenStreetMap contributors (ODbL)** e respeitar a [política de tiles](https://operations.osmfoundation.org/policies/tiles/), que proíbe pré-download/offline no servidor comunitário.
- Fontes OSM são processadas em **lote durante o build**: o pipeline reúne os POIs públicos do extrato Centro-Oeste da Geofabrik (recortado pela malha IBGE) com a coleta urbana Overpass, removendo identidades duplicadas e preferindo dados mais recentes; na indisponibilidade de uma fonte, preserva-se a parte já validada. O workflow publica o modo de obtenção em `osmSourceMode` e `/fontes`, preserva o snapshot e **não** geocodifica estabelecimentos por inferência. Não há busca remota nem geolocalização automática enquanto o cidadão pesquisa o catálogo.
- Filtros locais: texto, categorias, procedência, tipo de estabelecimento e zona (não classificada quando a fonte não informa). Listas longas exibem lotes de 60/80 resultados, reduzindo custo de renderização em celulares.
- **Google Maps, Waze, Apple Maps, Organic Maps:** links oficiais de destino sem chave nem cobrança por chamada da nossa aplicação. Google, Waze e Apple calculam rotas externamente; Organic abre o ponto para a pessoa decidir a rota no app. O navegador não envia origem GPS nos links.
- Renderização Google Maps JavaScript é **opcional** e depende de chave com faturamento/quotas próprios; não é ativada para atender ao requisito de zero custo.
- O catálogo cartográfico **não cobre necessariamente todos** os serviços, escolas ou CNPJs da cidade. Ausência de pin não prova ausência de serviço, e registro OSM não prova funcionamento. Os 63 registros da base escolar do painel `/fontes` não são automaticamente convertidos em pins sem geometria confiável.

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

O `build:pages` gera um **snapshot auditável**. Ele exige pelo menos um ponto real verificável, vindo da fonte live ou do last-known-good. O JSON final informa `realCount`, `verifiedCount`, `communityCount`, `demoCount` (zero normalmente), município, código IBGE, modo de catálogo real e `realSourceMode` (`live` ou `snapshot_fallback`) para CNES.

**Proteção de configuração:** a publicação GitHub Pages sempre utiliza o snapshot
estático verificado, inclusive se `VITE_API_BASE_URL` estiver definido no ambiente
de execução. O build Pages limpa essa variável antes de gerar os arquivos e o
cliente prioriza `VITE_STATIC_MODE=true`. A API Express continua disponível somente
em builds específicos de servidor, e deve ter catálogo/procedência compatíveis antes
de qualquer ativação pública.

O Pages hospeda HTML, CSS e JavaScript e não executa o servidor Express. O resultado da coleta é congelado no build e servido por `public/data/points.json`/`dist/data/points.json`, portanto a aplicação não depende do CNES a cada abertura pelo usuário.

## Robustez, PWA e degradação controlada

O projeto segue princípios usados no **Trajeto Águas Lindas**: fontes externas têm contrato explícito, dados vazios ou não verificáveis não são promovidos silenciosamente, funcionalidades secundárias não devem quebrar a navegação central e regressões críticas são cobertas por testes unitários e de navegador.

O **mapa geográfico Leaflet** é o provedor público padrão. O mapa esquemático e a visualização via Google Maps JavaScript ficam reservados à execução local em desenvolvimento. O build do GitHub Pages **não injeta a chave Google Maps**, mesmo que exista uma variável configurada no repositório, evitando a ativação acidental de APIs faturáveis. Os links de Google Maps, Waze, Apple Maps e Organic Maps continuam disponíveis nas fichas dos locais. Busca, filtros e leitura do snapshot permanecem locais no Pages.

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

**API Express opcional — catálogo real somente com snapshot validado.** A API de produção
requer `NODE_ENV=production` e `CATALOG_SNAPSHOT_PATH` apontando para o
`points.json` auditado do mesmo build. Se o arquivo estiver ausente, ilegível,
tiver município diferente de 5217609, registros reais sem procedência/geometria
ou contagens incompatíveis, o servidor **não inicia**; nunca substitui um snapshot
inválido por pontos demonstrativos. Sem esta configuração, apenas ambiente de
desenvolvimento/teste usa o repositório DEMO explícito.

Exemplo de preparação com snapshot local (não é publicação automática de API):

```bash
npm ci
npm run build
npm run build:pages
NODE_ENV=production CATALOG_SNAPSHOT_PATH=dist/data/points.json npm start
```

Em PowerShell, depois dos dois builds:

```powershell
$env:NODE_ENV = 'production'
$env:CATALOG_SNAPSHOT_PATH = (Resolve-Path 'dist/data/points.json').Path
npm start
```

**A ordem dos builds é obrigatória:** `npm run build` gera o servidor Express
(`server.js`) e pode limpar o diretório `dist` ao compilar o Vite; por isso,
execute `npm run build:pages` por último para regenerar o
`dist/data/points.json` com validação e proteger o frontend estático.
Antes de iniciar, confira se esse arquivo existe e passou por `npm run verify:pages`. Para hospedagem de verdade, exigir HTTPS e limites de custo,
rever CORS/origens confiáveis, proxy, rate limiting centralizado, segredos e
observabilidade. Em uma eventual API separada, configure
`API_ALLOWED_ORIGIN=https://pabloguilherme01.github.io` **somente no servidor**
para permitir chamadas do Pages no navegador; por padrão não há CORS cruzado.
A variável aceita exclusivamente uma origem HTTPS completa, sem wildcard,
caminho ou credenciais. O preflight de origem não permitida recebe 403.
**CORS não é autenticação nem substitui limite de requisições ou firewall.** O Express opcional limita corpos JSON a 16 KiB e devolve
mensagens HTTP genéricas para JSON malformado, payload excessivo e parâmetros
inválidos, sem divulgar detalhes de exceções ou campos internos do schema. O assistente seleciona IDs do catálogo ativo e identifica REAL/DEMO
por registro; não usa texto livre do Gemini como prova territorial. As rotas
`/api/points`, `/api/sources`, `/api/municipality`, `/api/assistant` e
`/api/health` continuam opcionais. `/api/sources` consulta adaptadores e pode
refletir status de coleta diferente da data do snapshot carregado, que deve ser
lida no registro. **O GitHub Pages permanece estático e não ativa nem consome
esta API por configuração de ambiente.**

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
identidades, proveniência e datas UTC válidas. Também verifica que a página
`/fontes/`, o arquivo `data/sources.json`, o manifesto PWA e o service worker
estão publicados no mesmo domínio, e correspondem ao município e à base URL.
Falhas HTTP, respostas HTML no lugar de JSON ou recursos estáticos inconsistentes
reprovam o monitor sem alterar o site. Um registro real com 30 dias ou
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
npm test -- tests/snapshot_health.test.ts tests/published_site_health.test.ts
```
