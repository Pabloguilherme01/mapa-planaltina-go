# Recursos do Trajeto adaptados a Planaltina

Comparação em 15/10/2026 do código local de `trajeto-web`, preservado sem alterações, com o produto municipal. Paridade funcional ainda não é completa.

| Recurso de referência | Estado em Planaltina |
| --- | --- |
| Mapa geográfico, agrupamento, fontes e localização consentida | Existente; limites IBGE e CNES municipal, sem copiar pontos de Águas Lindas |
| Automático / próxima viagem | Adaptado: planejamento online ou consulta offline conforme conexão |
| Repetir | Adaptado: restaura destino verificado e deslocamento salvos explicitamente |
| Economia | Adaptado: estimativa manual distância / consumo × preço; sem preço ou distância fictícios |
| Sem internet | Endereço e coordenadas do catálogo carregado; não equivale a rota viária calculada offline |
| Condução | Orientação para abrir navegação externa com veículo parado; não fornece navegação curva a curva |
| Carro, a pé e bicicleta | Handoff explícito ao Google Maps; origem definida pelo usuário no serviço externo |
| Privacidade e exclusão local | Salva somente identificador do destino e modo; botão de exclusão; sem origem/localização precisa |
| Catálogo, filtros, fontes e assistente local | Existentes; catálogo real separado das demonstrações |
| Escolas | Cadastro oficial disponível em Fontes, sem coordenadas verificadas para o planejador |
| CNPJ e comércio | Pesquisa documental existente; falta base municipal com identidade e geometria auditáveis |
| Corredores, linhas e horários de ônibus | Dependem de fonte de Planaltina; não copiar corredores de Águas Lindas |
| Postos/preços ANP, consumo histórico e comparação | Pendente adaptação de dados e validação municipal |
| Rotas com alternativas, duração, chegada e tráfego | Pendente provedor de rotas e backend; não estimar com linha reta |
| Múltiplas rotas offline, destinos frequentes, notificações | Pendente implementação além da última viagem local |
| Instalação PWA e cache do catálogo | Infraestrutura existente; teste físico iOS/Android ainda necessário |

## Verificações desta entrega

Testes unitários cobrem URLs de deslocamento sem origem, coordenadas inválidas, custo manual e armazenamento corrompido. Browser QA acrescenta salvar/repetir/apagar, economia, perda de conexão, foco nativo do diálogo e acessibilidade. O diálogo nativo limita o foco e fecha com Escape. Não foram acrescentadas dependências, cobranças, autenticação ou permissões automáticas.

## Próximas etapas

Adaptar busca de destinos e favoritos múltiplos; filtros de proximidade apenas após consentimento; exportação com procedência; instalação guiada e preferências acessíveis. Integrações viárias, ônibus e ANP devem entrar separadamente com contratos, fallback auditável e testes municipais. Marcar cada linha como concluída somente com implementação e verificação próprias.
