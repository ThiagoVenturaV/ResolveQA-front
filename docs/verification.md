# Verificação da Mola arco-íris

Revisão de 2026-11-07 sobre a base `1eaa6a1`. Arte por Imagegen/Codex, runtime pelo Cursor, revisão visual independente e revisão de código em agente separado. O resultado final da revisão do commit e da publicação fica registrado na [issue 1](https://github.com/ThiagoVenturaV/ResolveQA-front/issues/1).

| Verificação | Resultado |
| --- | --- |
| Extração e inspeção bundled das nove linhas | PASS, exit 0, 57 frames completos; thresholds e relatórios em `docs/rainbow-mascot.md` |
| Despill aplicado uma vez ao atlas composto | PASS, exit 0, alfa preservado |
| `validate_atlas.py` no PNG final distribuído | PASS, exit 0, `ok: true`, sem avisos, SHA256 conferido |
| Revisão visual independente da arte | PASS por contato e quatro stills; highlights claros no violeta são ressalva de acabamento |
| `npx tsc --noEmit` | PASS, exit 0, pelo executor e coordenador |
| HTTP do atlas na prévia | PASS, 200 |
| Hero no Chromium desktop 1440×1100 e mobile 390×844 | PASS, atlas carregado e interface sem overflow horizontal externo |
| Salto e saudação | PASS, frames observados no DOM; salto one-shot retorna ao idle e preserva altura dentro da célula |
| Pausar e retomar durante saudação | PASS, frame/posição preservados na pausa e avanço ao retomar |
| Seguir ponteiro e arrastar/soltar | PASS, eventos reais de mouse via CDP; clipe de trabalho durante drag e retorno pelo runtime |
| Transporte desktop | PASS, fases observadas e contagens 2/2/2 → 2/1/3; contagem só muda após deliver; overlay removido |
| Transporte mobile | PASS, card visível no percurso, Kanban acompanha destino e contagens 2/1/3 → 2/0/4 |
| Resize durante transporte | PASS, overlay removido e botão liberado, atualização única |
| Preferência reduced motion emulada | PASS, hero idle frame 0 e quadro funcional |
| Ocultar/retomar aba | Revisão estática do uso separado de interseção/visibilidade; troca real de aba NOT_RUN |
| Dispositivo físico e gesto touch nativo | NOT_RUN; viewport mobile emulada e alternativa por botão testada |

O portal Maestri confirmou o atlas no DOM, mas a captura visual falhou porque sua janela não estava renderizando. As capturas e eventos desta revisão foram feitos em Chromium headless local com perfil temporário isolado. Relatório, script e capturas da última rodada ficam em `artwork/mola-rainbow-v2/qa/browser/`. As prévias GIF/MP4 são derivadas do arquivo final codificado; o revisor de arte inspecionou contato e stills, sem afirmar revisão temporal do vídeo.

Os testes anteriores de criação de tarefa, detalhes, filtros, persistência e snapshots continuam registrados abaixo. Não há ligação ativa ao backend ou aos agentes.

---

# Verificação da primeira entrega

Verificado em 2026-11-07, após revisão independente de código. A interface usa dados demonstrativos locais.

| Verificação | Resultado |
| --- | --- |
| `npx tsc --noEmit` no código final | PASS, exit 0 pelo executor |
| Exportações dos ícones importados | PASS, exit 0 |
| HTTP da página na prévia Vinext | PASS, 200 |
| Transporte de card no desktop | PASS: overlay com mola/card presente, botão bloqueado durante movimento, contagens 2/2/2 → 2/1/3, evento registrado e overlay removido |
| Criação de tarefa pelo formulário | PASS: título conferido no DOM, sete cards, diálogo fechado e estado salvo |
| Diálogo de detalhes | PASS: nome acessível correto e evento cancel fecha o diálogo |
| Seleção da variante Azul | PASS: seleção persistida no storage |
| Imagens das pranchas | PASS: ambas carregadas, largura natural de 1536 px |
| Layout em 390 px | PASS por DOM: largura do documento 375 px úteis, sem overflow externo; rolagem horizontal limitada ao Kanban |
| Transporte em 390 px | PASS: rolagem do quadro acompanha destino, overlay visível dentro da viewport, lock e atualização de estado conferidos |
| Snapshot com 100 tarefas e mais de 300 KB | PASS: importado, mantido após reload e nova criação bloqueada com aviso |
| Redução de movimento | Revisão estática, mídia correspondente não emulada no navegador |
| Arrastar/soltar com ponteiro e Escape físico | NOT_RUN; handlers e alternativa por botão revisados |

Foi inspecionada uma captura do desktop com hero, personagem e início do quadro. O portal Maestri apresentou intermitência ao capturar imagens e enviar input quando a janela não estava renderizando; as verificações funcionais usaram também eventos DOM pela API documentada do portal. Não se afirma validação visual completa em dispositivos físicos.

O revisor identificou e o executor corrigiu: import incompatível com o próprio export, limite de tarefas que poderia invalidar persistência, destino do card inconsistente com a animação, acompanhamento mobile do destino e acessibilidade do diálogo.

Build e publicação são registrados pelos resultados da entrega no Git/Sites; esta lista não substitui o estado retornado pelo serviço de publicação.
