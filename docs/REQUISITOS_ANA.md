# Requisitos consolidados — Ana / relatório Solocontrol

Este documento registra o que foi incorporado ao sistema a partir dos materiais enviados na conversa: referência visual do relatório, vídeos mostrando a NBR 5564:2021 e observações da Ana sobre o gráfico e o cabeçalho.

## 1. Faixa granulométrica dinâmica

O técnico deve selecionar o tipo de faixa e o sistema deve exibir **somente as peneiras aplicáveis**.

### Padrão A — Linhas principais
- 2½" — 63,5 mm — retida acumulada 0–0%
- 2" — 50,8 mm — 0–10%
- 1½" — 38,0 mm — 30–65%
- 1" — 25,4 mm — 85–100%
- ½" — 12,5 mm — 95–100%

### Padrão B — Pátios
- 3" — 76,2 mm — 0–0%
- 2½" — 63,5 mm — 0–10%
- 1½" — 38,0 mm — 40–75%
- ¾" — 19,0 mm — 90–100%
- ½" — 12,5 mm — 98–100%

## 2. Gráfico — padrão visual obrigatório

O gráfico do PDF deve seguir a referência enviada:
- peneiras identificadas no topo;
- diâmetro das partículas (mm) no eixo inferior;
- eixo X em escala logarítmica;
- porcentagem que passa (%) no eixo esquerdo;
- porcentagem retida (%) no eixo direito, com escala inversa complementar;
- linhas verticais das peneiras;
- malha de grade densa;
- curva obtida em azul;
- limites da faixa em vermelho;
- título: CURVA GRANULOMÉTRICA.

O componente `GranulometryChart.tsx` é SVG próprio e não depende de biblioteca de gráficos, para o desenho ficar estável no relatório e no PDF.

## 3. Cabeçalho padronizado

Campos previstos no relatório:
- número do relatório e revisão;
- interessado;
- endereço do contratante;
- obra;
- procedência/fornecedor;
- material;
- amostra;
- tipo/designação da amostra;
- data de finalização do ensaio;
- litologia/tipo petrográfico presumido;
- responsável pelo ensaio;
- responsável técnico;
- CREA;
- observações complementares;
- referência normativa.

## 4. Requisitos exibidos no vídeo — Anexo A.6 da NBR 5564:2021

O vídeo mostra a seção **A.6 — Relatório de ensaio**. Para o módulo de índice de forma, a arquitetura deve suportar também:
- nome/endereço do laboratório responsável e número do relatório;
- nome/endereço do contratante;
- procedência da amostra (estado, cidade, mina/local de coleta etc.);
- tipo petrográfico presumido e/ou designação da amostra;
- dimensões dos fragmentos em milímetros;
- relações b/a e c/b individuais e respectivas médias;
- classes das formas individuais e da forma média;
- média aritmética dos resultados e estatística indicada pela norma;
- data da finalização;
- nome e assinatura do responsável pelo ensaio;
- referência à norma;
- observações complementares.

A V8 implementa a ficha **multien­saios**, incluindo o módulo de forma com lançamento individual dos fragmentos (pedras), cálculos b/a e c/b e consolidação automática. Os demais ensaios da matriz NBR 5564 também podem ser selecionados pelo técnico na mesma ficha.

## 5. Rodapé do relatório

Conforme o modelo enviado:
- notas de controle do documento;
- logo Solocontrol;
- responsável técnico e CREA;
- `SOLOCONTROL - Engenharia e Consultoria`;
- telefone, e-mail e endereço;
- aviso de proibição de reprodução parcial.

## 6. Regra de emissão

O PDF é o registro principal enviado ao cliente. Por isso:
- relatório incompleto **não pode ser emitido**;
- balanço de massa acima de 0,3% bloqueia emissão;
- repetibilidade acima de 4% por peneira bloqueia emissão;
- resultado fora da faixa **pode e deve ser emitido** como NÃO CONFORME, desde que o ensaio seja tecnicamente válido;
- o PDF emitido é salvo no Firebase Storage;
- o documento no Firestore passa para status `issued`;
- todas as alterações relevantes geram audit log.


## 7. Ficha multien­saios — V8

O técnico seleciona quais ensaios serão executados. O sistema exibe somente os módulos marcados e o PDF inclui somente os resultados efetivamente selecionados. A ficha suporta:
- Granulometria;
- Índice de forma;
- Massa específica aparente, porosidade e absorção;
- Resistência à intempérie;
- Massa unitária no estado solto;
- Material pulverulento;
- Torrões de argila e materiais friáveis;
- Abrasão Los Angeles;
- Treton;
- Fragmentos macios/friáveis;
- Micro-Deval;
- Point Load.

Também foram incorporados geolocalização, evidências fotográficas, edição de rascunhos/revisão e PDF multipágina.
