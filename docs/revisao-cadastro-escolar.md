# Revisão de regionais — Escolas SEDUC de Planaltina-GO

**Situação: pendente de validação individual; não publicar coordenadas presumidas.**

## Evidência atual
- Snapshot SEDUC: referência **2024**, derivado do recurso `Escolas_endereco_seduc_2025.csv`, 63 escolas com campo `Municipio=Planaltina`.
- Dessas 63, **37** têm `Regional=CRE Planaltina`; **26** registram CRE diferente. Esse contraste é **um aviso de qualidade do cadastro**, não prova de que a escola esteja fora do município.
- A base não inclui latitude/longitude; nenhuma das 63 deve virar marcador por geocodificação sem prova cartográfica.
- Exemplo importante: a escola código **52074072 — Escola Municipal Professor Francisco Alan** aparece como `CRE Goiânia` na base, mas o FNDE a registra como **Planaltina-GO**. Portanto, não remover automaticamente as escolas que tiverem CRE divergente.

## Procedimento de reconciliação
1. Partir do **código de escola**; pesquisar no [Catálogo de Escolas do INEP](https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/inep-data/catalogo-de-escolas/), filtrando UF=GO e município=Planaltina.
2. Comparar código, nome, dependência administrativa, situação de funcionamento e ano-base; manter os valores divergentes visíveis até existir confirmação.
3. Conferir a [fonte original SEDUC](https://dadosabertos.go.gov.br/dataset/endereco-das-escolas-de-goias), registrar a data da coleta e evitar reclassificar campo `Regional` por inferência.
4. Apenas com geometria auditável e fonte/licença compatíveis, criar registro de destino real. Coordenadas externas por busca aproximada não bastam.
5. Documentar cada decisão com código da escola, fonte, referência temporal, revisão humana e evidência (URL/registro); não copiar telefone ou outras informações pessoais desnecessárias.

## Gate de aceite
O cadastro publicado continua consultável em `/fontes` com as 63 escolas e um aviso transparente de reconciliação. O mapa continua sem pins escolares não verificados. Testes automatizados validam a contagem de regionais e um exemplo de registro municipal com CRE distinta. Esse gate **não significa** que as 26 divergências já tenham sido verificadas individualmente.

A ação permanece rastreada em [issue #25](https://github.com/Pabloguilherme01/mapa-planaltina-go/issues/25).
