# Redesenho mobile inspirado no Trajeto

Referência consultada: `trajeto-web/client/src/index.css`, superfícies legíveis, controles com área de toque e formulários progressivos. Mantida a identidade municipal de Planaltina-GO.

## Mudanças

- Busca recolhida de 300 para 166 px; resultados montados somente ao expandir.
- Busca expande ao receber foco; Focar recolhe os resultados para mostrar o mapa.
- Filtros avançados em seção expansível para preservar espaço de resultados.
- Área do mapa usa altura dinâmica da janela e reserva o espaço da busca e da navegação com safe area.
- Marcação de origem/destino remove temporariamente busca e botão do planejador para liberar os gestos.
- Estados de carregamento, falha e nova tentativa na busca mobile.
- Cabeçalho escuro inspirado no Trajeto, navegação ativa sinalizada e campos de 16 px no celular.

## Evidência e limites

253 testes unitários existentes aprovados; typecheck e build aprovados. Build estático executado via `node --import tsx scripts/build-pages.ts` porque o launcher tsx tentou criar um pipe não permitido no ambiente.

A verificação do artefato estático não passou: a cópia local não contém `data/road-graph.json`. Não foi criada malha fictícia. O workflow Browser QA existente restaura a malha validada antes dos testes.

Regressões de navegador adicionadas para 320/390/768 px: overflow, busca, estado vazio, foco de local, recolhimento e cancelamento da marcação no mapa. Testes de filtros e catálogo adaptados ao novo fluxo. Execução local de navegador pendente: download do Chromium retornou arquivo inválido.

## Aceite físico — issue #27 permanece aberta

Em Android modesto e iPhone, registrar modelo, SO, navegador, SHA, rede e vídeo:
1. Abrir, buscar, filtrar, focar e consultar ficha; nenhum controle encoberto, texto cortado ou scroll horizontal.
2. Abrir planejador, marcar origem/destino, cancelar e repetir; mapa recebe toque e lista retorna.
3. Negar e permitir GPS por ação explícita; confirmar que posição não entra na URL ou armazenamento.
4. Salvar favorito, reabrir PWA e retomar offline após visita inicial; distinguir catálogo disponível de ruas ainda não armazenadas.
5. Alternar 4G/modo avião e atualizar PWA; verificar ausência de listeners duplicados e perda de navegação.
6. Medir LCP, INP, CLS, memória e fluidez de panning antes/depois, sob condições equivalentes; não declarar melhoria de desempenho sem medição.

Esta alteração não encerra #27 nem comprova publicação.
