# Validação física Android/iPhone — Mapa Planaltina-GO

**Situação:** roteiro de execução, NÃO é evidência de testes já realizados.
**Issue:** [#27](https://github.com/Pabloguilherme01/mapa-planaltina-go/issues/27).
**Referência de versão:** anotar SHA de `main`, URL, data e snapshot antes de começar.

## Preparação e critérios gerais

Testar pelo menos um Android modesto (memória e versão do sistema anotadas) e um iPhone real, em Wi-Fi, rede móvel instável e modo avião. Registrar versão do navegador, versão do PWA, conexão, horário, `realSourceMode`, `realCount`, `demoCount` e idade da coleta em `/data/points.json` **sem gravar localização precisa do usuário**.

Comparar os resultados com uma versão anterior ao agrupamento otimizado (PR #23) **apenas em ambiente de teste separado e com o mesmo snapshot e dispositivo**. Não mexer na produção para construir o baseline.

Uma tarefa crítica só é considerada aprovada quando o resultado real coincide com o critério abaixo. Em caso de divergência, abrir issue com código da etapa, aparelho, condição de rede, SHA e reprodução; guardar vídeo/trace localmente sem expor GPS, contatos ou dados pessoais.

| ID / prioridade | Passos objetivos | Sinal de falha | Critério de aprovação |
| --- | --- | --- | --- |
| F01 / P0 | Abrir o site em Wi-Fi; verificar `/fontes`; abrir uma ficha CNES real e uma ficha DEMO. | Ficha real rotulada DEMO, fonte ausente, data futura ou DEMO parecendo serviço disponível. | Real e DEMO são inequivocamente distinguíveis; fonte, data e aviso aparecem corretamente. |
| F02 / P0 | Buscar pelo nome/CNES real, filtrar procedência e selecionar um pin na lista e mapa. | Contagens divergentes, item diferente ou ficha incorreta. | Lista, filtros, mapa e ficha correspondem ao mesmo ponto verificado. |
| F03 / P0 | Abrir `Planejar viagem`, selecionar destino real e modo carro/a pé/bicicleta; abrir aplicativo externo. | Coordenadas inexistentes, origem GPS enviada pelo site ou navegação apontando a DEMO. | Link usa só destino válido e opção escolhida; origem é resolvida externamente; DEMO nunca é destino. |
| F04 / P0 | Salvar favorito, fechar o planejador, reabrir, repetir e depois remover. | Recuperação de destino obsoleto como válido ou favorito apagado sem comando. | Até oito favoritos válidos; exclusão explícita; destino indisponível identificado e não promovido. |
| F05 / P0 | Após visita online e controle pelo service worker, ativar modo avião; atualizar mapa e `/fontes`. | Tela branca, spinner permanente, falso dado ao vivo ou solicitação automática a tiles externos. | Shell, fontes e último snapshot carregado continuam legíveis; offline é informado honestamente. |
| F06 / P0 | Com app aberto, alternar offline/online três vezes e retornar da navegação externa. | Banner duplicado, eventos perdidos, travamento ou perda do destino. | Um estado de conexão coerente por vez, sem travar interação ou alterar favoritos. |
| F07 / P0 | Negar permissão de localização; seguir usando busca, mapa e planejamento. Depois conceder em sessão de teste. | GPS solicitado sem ação clara, tela bloqueada ou localização enviada sem consentimento. | Recusa não bloqueia o fluxo; localização aparece apenas após consentimento explícito. |
| F08 / P0 | Instalar PWA pelo navegador; abrir pelo ícone, fechar, reabrir e usar offline após cache inicial. | Falha na abertura standalone, rota `/fontes` quebrada ou recursos essenciais ausentes. | PWA inicia, navega e restaura o snapshot sem nova rede. |
| F09 / P1 | Em Android/iPhone, abrir diálogos, percorrer controles com teclado assistivo/leitor de tela, fechar e retornar foco. | Foco preso/escapando do diálogo, botões sem nome ou alvo de toque pequeno. | Foco segue ordem funcional, rótulos anunciam função, fechamento devolve foco e alvos são utilizáveis. |
| F10 / P1 | Fazer zoom/pan em área com muitos pins reais/DEMO, alternar filtros e repetir ao menos dez vezes. | Stutter prolongado, marcadores repetidos, FPS baixo persistente, toque ignorado. | Nenhum crash/congelamento; seleção coerente. Medir duração/FPS/memória antes e depois; não alegar ganho sem comparação. |
| F11 / P1 | Repetir F01–F04 em 4G instável e durante transição de rede. | Tela fica permanentemente vazia ou troca dados antigos por registros fictícios. | Fallback identificado, ação local funcionando e recuperação online sem dados presumidos. |
| F12 / P1 | Com captura autorizada de DevTools/Lighthouse, carregar página fria e testar interação principal. | Layout muda excessivamente, input demora ou conteúdo principal tarda. | Metas indicativas: LCP ≤ 2,5 s, INP ≤ 200 ms, CLS ≤ 0,1 no percentil 75; registrar valores mesmo quando não atingidos. |

## Evidência mínima por rodada

| Campo | Registrar |
| --- | --- |
| Execução | Data, executor, SHA testado, URL e SHA da publicação (quando disponível) |
| Aparelho | Modelo, RAM aproximada, Android/iOS, navegador/versão |
| Dataset | `realCount`, `demoCount`, `realSourceMode`, data de coleta |
| Rede | Wi-Fi, 4G/5G instável ou offline; cache quente/frio |
| Casos | F01–F12: aprovado / reprovado / bloqueado + evidência |
| Métricas | LCP, INP, CLS; latência de seleção, tempo de render e FPS sob mesmo dataset |
| Riscos | Falhas reproduzíveis, prioridade, issue vinculada e responsável |
| Segurança | Não publicar gravações com GPS preciso, token, IP pessoal, nomes de contatos |

**Gate:** qualquer falha P0 impede afirmar que a experiência de campo foi validada. A aprovação de Chromium/WebKit emulados no CI não substitui aparelhos físicos. Sem linha de base comparável, reportar FPS/memória como observação, nunca como melhoria demonstrada. Em caso de problemas, reverter o PR pertinente por novo PR e repetir os testes críticos antes do deploy.
