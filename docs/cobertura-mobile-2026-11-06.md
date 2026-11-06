# Ampliação de cobertura e acesso mobile — Planaltina-GO (06/11/2026)

## Diagnóstico reproduzível

No build do GitHub Pages #371 (commit `2e2d05d`, em 06/11/2026), os logs registram:
- **99** pontos reais do CNES (saúde);
- **31** pontos OSM/Geofabrik aceitos; o Overpass público expirou por timeout e não acrescentou dados;
- **45.301 nós e 96.262 arestas** no grafo viário municipal.

O total publicado nessa execução foi **130 destinos**, sem pontos fictícios. A quantidade de POIs não representa cobertura integral do município. O grafo representa vias OSM do recorte, mas não certifica todos os logradouros, direções ou restrições de conversão.

## Correções nesta proposta

1. A importação de POIs OSM passa a admitir **equipamentos de tipos bem definidos sem tag `name`**, por exemplo escola, correios e posto de combustível, *somente* com geometria OSM, ID rastreável, dentro da malha IBGE e sem marcação de acesso privado/inatividade. A interface indica claramente “sem nome no OpenStreetMap” e “colaborativo não verificado”; não presume existência, funcionamento nem horário.
2. A consulta Overpass em lote contempla esses equipamentos sem nome, mas continua **apenas no build**. Não há requisições OSM por usuário e nem geocodificação individual.
3. O importador Geofabrik preserva essas ocorrências na transformação GeoJSON → catálogo.
4. No mobile, os pins em coordenadas idênticas ficam agrupados mesmo no zoom alto. Um painel acessível oferece seleção individual, sem nomes inseridos como HTML, e respeita o modo de seleção de rota. Toques no painel e nos marcadores não são confundidos com toques livres no mapa.
5. Testes unitários protegem os filtros territorial/de procedência, a transformação real do extrato e o agrupamento em zoom alto.

## Verificação e limitações

A melhoria **não garante quantidade mínima nova** antes de rodar o build com o extrato OSM atualizado. Consultar `osm-planaltina.count` e `geofabrik-planaltina.accepted` nos logs e `data/points.json` publicado. Se a origem retornar menos POIs, não apresentar números inventados.

Ruas e rotas: preservar o grafo local sem criar arestas fictícias, sem enviar localização por URL, e sem alegar navegação curva a curva confiável. Itinerários para fora do município, horários e tarifas de ônibus exigem fontes operacionais verificáveis.

## Aceite de publicação

- `npm run lint`, `npm test` e build Pages verdes.
- GitHub Browser QA: larguras 320/390/768, mapa/pan/zoom, seleção de pontos e roteamento, sem overflow ou interceptação dos controles.
- Confirmar contagem antes/depois pelo artefato da publicação, com identificação das fontes.
- A issue #27 de teste físico Android/iPhone continua aberta: GPS consentido, offline, navegação externa, desempenho e PWA não são comprovados por emulação.

Fontes: [CI Pages #371](https://github.com/Pabloguilherme01/mapa-planaltina-go/actions/runs/42146997675), [OSM/ODbL](https://www.openstreetmap.org/copyright), [dados públicos SEDUC Goiás](https://dadosabertos.go.gov.br/dataset/endereco-das-escolas-de-goias).
