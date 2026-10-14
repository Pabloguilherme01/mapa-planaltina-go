# Mapa Planaltina GO

Mapa cívico de **Planaltina, Goiás**, código IBGE **5217609**, com React, TypeScript, PWA, testes de navegador e identidade visual inspirada no cerrado.

Site: https://pabloguilherme01.github.io/mapa-planaltina-go/  
Fontes: https://pabloguilherme01.github.io/mapa-planaltina-go/fontes/

## Estado dos dados

O projeto deixou de ser exclusivamente demonstrativo. O catálogo publicado é **misto e explicitamente tipado por procedência**:

- **Saúde real:** estabelecimentos do **CNES/SES-GO** publicados pelo Portal de Dados Abertos de Goiás, filtrados para o código municipal CNES/IBGE `521760`, com identificador CNES, endereço e coordenadas fornecidas pela própria fonte.
- **DEMO:** os 20 pontos sintéticos anteriores continuam disponíveis para homologação da interface, sempre com `isDemo: true`, procedência `demo` e aviso de que não servem para deslocamento.
- **Pesquisa comercial:** permanece na página `/fontes` como pesquisa comunitária/checagem pública, sem virar pin enquanto não houver geometria auditável.

A identificação oficial do município usa **IBGE 5217609**. A procedência dos pontos usa `official`, `verified_open_data`, `community` e `demo`, e o status de verificação é armazenado por registro.

### Regras para dado real

Um ponto só pode entrar no snapshot como real quando:

1. pertence inequivocamente a Planaltina-GO;
2. possui identificador estável na fonte;
3. possui latitude e longitude válidas publicadas pela fonte — `0,0`, campos vazios e coordenadas inválidas são rejeitados;
4. registra URL, nome da fonte, data de coleta, licença/aviso de licença e status de verificação;
5. não depende de inferência silenciosa para preencher atributos ausentes.

A fonte CNES estadual não informa zona urbana/rural nesse recurso. Por isso, esses pontos usam **“Não classificada”** em vez de inferir “Urbana”. Telefones e e-mails existentes na base de origem não são replicados no mapa para reduzir o risco de contato operacional desatualizado.

> O recurso CNES/SES-GO informa **“Nenhuma Licença Fornecida”** no portal. O aplicativo preserva essa limitação como metadado; não atribui uma licença que a fonte não declarou.

## Fonte real de Saúde

Recurso utilizado: **Cadastro Nacional de Estabelecimentos de Saúde (CNES) – SES / Estabelecimentos de Saúde – Goiás**.

- Portal: `dadosabertos.go.gov.br`
- Resource ID: `7559175a-98ac-4719-bf30-5e6455ba57c5`
- Filtro municipal do CNES: `codigo_ibge = 521760`
- Campos cartográficos utilizados: CNES, nome fantasia/razão social, endereço, latitude, longitude, município, UF, tipo do estabelecimento e vínculo SUS.
- Campos deliberadamente não publicados: telefone e e-mail.

O adapter `CnesAdapter` consulta o CKAN DataStore com timeout, valida município/UF/coordenadas e converte somente registros utilizáveis em `MapPoint` real.

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

O `build:pages` gera um **snapshot auditável**. Nesta etapa o projeto exige pelo menos um estabelecimento CNES georreferenciado válido; uma coleta vazia não é promovida como se fosse uma publicação real bem-sucedida. O JSON final informa `realCount`, `demoCount`, município, código IBGE e modo `misto_oficial_demo`.

O Pages hospeda HTML, CSS e JavaScript e não executa o servidor Express. O resultado da coleta é congelado no build e servido por `public/data/points.json`/`dist/data/points.json`, portanto a aplicação não depende do CNES a cada abertura pelo usuário.

## Robustez, PWA e degradação controlada

O projeto segue princípios usados no **Trajeto Águas Lindas**: fontes externas têm contrato explícito, dados vazios ou não verificáveis não são promovidos silenciosamente, funcionalidades secundárias não devem quebrar a navegação central e regressões críticas são cobertas por testes unitários e de navegador.

O mapa esquemático continua disponível como provedor sem chave externa; Google Maps só fica disponível quando `VITE_GOOGLE_MAPS_API_KEY` está configurada. Busca, filtros e leitura do snapshot permanecem locais no Pages.

A publicação gera manifesto instalável e service worker. Depois de uma visita online, shell, `/fontes/`, bundles e snapshots JSON ficam em cache para consulta sem conexão. O Browser QA executa recarga offline real após o service worker assumir o controle.

O verificador de artefato bloqueia o deploy se:

- o base path estiver incorreto;
- um ponto não declarar explicitamente se é DEMO ou real;
- um ponto real não tiver coordenadas válidas e proveniência verificável;
- `realCount`/`demoCount` divergirem do conteúdo;
- controles de protótipo do Stitch vazarem para produção;
- manifesto, service worker ou ícone instalável estiverem ausentes.

## UX de procedência

Desktop, mobile e ficha cadastral diferenciam visualmente:

- **REAL / Verificado:** coordenadas publicadas pela fonte, origem e data de snapshot disponíveis;
- **DEMO:** registro sintético e não utilizável para deslocamento.

A ficha de um ponto real não usa mais linguagem de “simulação”, e exibe a licença/limitação declarada, fonte, snapshot e coordenadas publicadas. A página `/fontes` mostra o estado de cada adapter e diferencia fonte ativa, não configurada e falha de atualização.

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

Há testes para busca, filtros, procedência, integração CNES, rejeição de geometria inválida, falha do IBGE, assistente, roteamento do Pages, disponibilidade do Google Maps, acessibilidade, PWA, reload offline e integridade do artefato. O Browser QA também lê o snapshot publicado, exige ao menos um ponto oficial de Saúde e abre sua ficha para confirmar que a UI o apresenta como dado real verificado.
