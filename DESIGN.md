---
product: "Mapa Planaltina GO"
municipality: "Planaltina, Goiás"
ibge_code: "5217609"
design_system:
  colors:
    cerrado_primary: "#355E3B"
    cerrado_dark: "#27472c"
    cerrado_light: "#44774c"
    linho_background: "#F5F0E6"
    linho_card: "#FFFFFF"
    linho_muted: "#EAE3D2"
    terracota_secondary: "#BA623D"
    terracota_dark: "#984e2e"
    mostarda_tertiary: "#E5B744"
    mostarda_dark: "#c49931"
  typography:
    font_family: "Plus Jakarta Sans, system-ui, sans-serif"
    headline: "Plus Jakarta Sans Bold"
    label: "Plus Jakarta Sans SemiBold / Extrabold"
    body: "Plus Jakarta Sans Regular"
  elevation:
    shadow_sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
    shadow_md: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
    shadow_sheet: "0 -8px 24px rgba(30, 43, 32, 0.12)"
  touch_targets:
    minimum: "44px"
---

# DESIGN.md — Mapa Planaltina GO

## 1. Visão Geral & Identidade Visual
Aplicação cívico-cartográfica para o município de **Planaltina, Goiás** (Código IBGE **5217609**, confirmado em [IBGE Cidades](https://www.ibge.gov.br/cidades-e-estados/go/planaltina.html)), desenvolvida com base no protótipo visual do **Stitch (Google Labs)**.

### Paleta do Cerrado Planaltinense:
- **`#355E3B` (Verde Cerrado / Primary)**: Remete à vegetação nativa preservada do planalto central e à sobriedade dos serviços públicos institucionais.
- **`#F5F0E6` (Linho Suave / Surface)**: Fundo acolhedor e de alto contraste, evitando o cansaço visual de telas puramente brancas.
- **`#BA623D` (Terracota / Secondary)**: Alusão ao solo argiloso e telhas coloniais goianas, usado em pontos de destaque e ações proeminentes.
- **`#E5B744` (Mostarda Cerrado / Warning & Demo)**: Dourado dos campos secos e ipês-amarelos, reservado para resguardos de modo demonstrativo.

## 2. Estrutura Ergonômica & Responsividade
- **Desktop**:
  - Mapa protagonista ocupando todo o viewport central.
  - Sidebar lateral esquerda persistente (`w-[420px]`) com busca instantânea sem acentos (`Ctrl+K`), seletor de categorias, visualizador de estados UX (normal, skeleton, vazio, erro) e lista rolável com cards detalhados.
- **Mobile**:
  - Mapa protagonista em tela cheia com cartão de boas-vindas do Cerrado.
  - Carrossel horizontal deslizável de 9 categorias cívicas.
  - *Bottom Sheet* expansível (modo recolhido para visualização desobstruída do mapa e modo expandido para navegação em lista).
  - Barra de navegação inferior fixa com alvos de toque mínimos de 44px (Mapa, Assistente, Fontes, PostGIS).

## 3. As 9 Categorias Cívicas
1. **Saúde**: Atenção básica, postos de saúde e UBS simuladas (`#D32F2F`).
2. **Educação**: Escolas municipais e colégios modelo (`#303F9F`).
3. **Transporte**: Eixos rodoviários e pontos de conexão (`#00838F`).
4. **Segurança**: Bases comunitárias e defesa civil (`#37474F`).
5. **Serviços Públicos**: Vapt Vupt simulado, saneamento e prefeitura (`#355E3B`).
6. **Comércio**: Feira livre do produtor e armazéns agropecuários (`#BA623D`).
7. **Lazer**: Praças arborizadas e complexos esportivos (`#E5B744`).
8. **Meio Ambiente**: Bacia do Rio Maranhão e ecopontos nativos (`#2E7D32`).
9. **Rural**: Extensão agronômica e agricultura familiar (`#A16207`).

## 4. Política de Proveniência & Rigor Anti-Alucinação
- Nenhum dado fictício é disfarçado de oficial.
- Banner perene obrigatório: **"Modo demonstrativo — locais ilustrativos, não use para deslocamento. Dados não verificados."**
- Quatro níveis de proveniência bem documentados:
  1. `official`: Base institucional governamental.
  2. `verified_open_data`: Dado aberto verificado (ex: API IBGE 5217609 validada).
  3. `community`: Colaborativo comunitário.
  4. `demo`: Simulação didática vigente.
- Omissão intencional de telefones e endereços numéricos para evitar indução a deslocamentos em pontos ilustrativos.
- Geolocalização estritamente local: nenhum dado de GPS é transmitido ou salvo remotamente.
