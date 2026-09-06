# Solocontrol Lab V11

## Exportação Excel fiel ao PDF

A V11 altera a exportação Excel para que a primeira aba **Relatório Oficial** seja um espelho visual das mesmas páginas A4 exibidas no sistema e usadas para gerar o PDF. No momento da exportação, o navegador captura cada `.report-a4` e a insere no XLSX, preservando logo, cabeçalho, tabelas, gráfico, rodapé, fotos, assinaturas e paginação.

As demais abas continuam técnicas e auditáveis, com os valores e **fórmulas reais** (granulometria, índice de forma, material pulverulento, torrões de argila, propriedades físicas, massa unitária e demais ensaios selecionados). Assim o Excel reúne duas necessidades: fidelidade visual do relatório oficial e rastreabilidade dos cálculos.

O gráfico granulométrico também continua presente na aba técnica e aparece exatamente como no relatório oficial.

---

# Solocontrol Lab V8 — Multien­saios

Sistema web/PWA para a rotina do laboratório Solocontrol: **amostra → seleção dos ensaios → lançamento → cálculo → pré-validação → revisão → relatório PDF multipágina → nuvem**.

## Principais melhorias da V8

- Ficha única da amostra com seleção dinâmica dos ensaios.
- Ensaios obrigatórios disponíveis: Granulometria, Índice de Forma, Massa específica/Porosidade/Absorção, Intempérie, Massa Unitária, Material Pulverulento, Torrões de Argila e Los Angeles.
- Ensaios opcionais: Treton, Fragmentos macios/friáveis, Micro-Deval e Point Load.
- Índice de forma com tela própria de **Medição dos fragmentos (pedras)**: fração, a, b, c, b/a, c/b e classificação automática.
- A granulometria indica as frações com retenção ≥ 10% para orientar o ensaio de forma.
- Cálculos automáticos já estruturados para granulometria, forma, propriedades físicas, material pulverulento, torrões e massa unitária.
- Critérios automáticos por litologia para forma, massa específica, absorção e Los Angeles.
- Geolocalização pelo celular.
- Fotos/evidências anexadas à ficha e arquivadas no Firebase Storage.
- Edição de rascunhos/revisão.
- Fluxo `draft → review → issued`.
- Relatório A4 **multipágina**: uma página por módulo relevante, matriz final de resultados e páginas de registro fotográfico quando houver imagens.
- Cabeçalhos de tabelas do relatório em azul Solocontrol com texto branco para alta legibilidade.
- Curva granulométrica com escala logarítmica 0,01–100 mm, peneiras no topo, % passante à esquerda e % retida à direita.
- PDF oficial arquivado no Storage, com histórico no Firestore.

> Importante: os módulos de Intempérie, Los Angeles, Treton, Fragmentos macios, Micro-Deval e Point Load estão disponíveis como lançamento estruturado de resultado + análise de critério/referência. Para transformar cada um deles em roteiro completo de laboratório com todas as pesagens/intermediários, deve-se homologar o método com a edição da norma específica usada pela Solocontrol.

## Atualização do projeto existente

1. Faça backup do repositório atual.
2. Substitua os arquivos pelos da V8.
3. Faça commit/push para `main`.
4. **Atualize as regras do Storage**, pois fotos usam subpastas dentro de `reports/{companyId}/{reportId}/evidencias/`.
5. Faça novo deploy na Vercel.

### Publicar regras do Firebase

```bash
npm install
npx firebase-tools login
npx firebase-tools use --add
npx firebase-tools deploy --only firestore:rules,firestore:indexes,storage
```

## Firebase / Vercel

As variáveis `NEXT_PUBLIC_*` continuam suportadas. O projeto também mantém o fallback Web Config do Firebase já utilizado na versão que estava publicada, evitando quebra do build quando a variável não estiver presente.

## Perfis

- `admin`: configurações, usuários, revisão e emissão.
- `coordenador`: revisão e emissão.
- `tecnico`: cria e preenche fichas/ensaios; não emite documento oficial.

## Fluxo recomendado

1. Criar ficha.
2. Preencher identificação e litologia.
3. Capturar geolocalização e anexar fotos quando necessário.
4. Selecionar os ensaios.
5. Executar cada módulo.
6. Resolver pendências da pré-validação.
7. Salvar rascunho.
8. Enviar para revisão.
9. Coordenador confere o PDF.
10. Emitir e arquivar a versão oficial.

## Referências de projeto usadas nesta etapa

A estrutura da V8 foi organizada com base nos materiais fornecidos para o projeto, especialmente NBR 5564:2021, NBR 17054:2022, NBR 7218:2025 e a planilha Solocontrol desenvolvida/validada na conversa.

## V9 — melhorias solicitadas em campo/laboratório (06/09/2026)

- Campos numéricos refeitos para aceitar **vírgula ou ponto decimal** sem apagar a casa decimal durante a digitação.
- Aceita exemplos como `1874,9`, `1874.9`, `1.874,9` e `1,874.9`.
- Enter avança para o próximo campo numérico, agilizando o lançamento de várias pesagens.
- Exibição dos cálculos padronizada em **pt-BR** (vírgula decimal).
- Índice de Forma ganhou cartões de progresso das frações com retenção relevante e atalhos para preparar lotes de fragmentos.
- O PDF do Índice de Forma passou a trazer, além do resumo, **as medições individuais de cada fragmento**: fração, a, b, c, b/a, c/b e classificação.
- O relatório também apresenta média, desvio-padrão e coeficiente de variação de b/a e c/b.
- As medições individuais são paginadas automaticamente para evitar corte em A4.

A V9 mantém o mesmo Firebase, Firestore, Storage e projeto Vercel das versões anteriores.

## V10 — exportação Excel técnico fiel ao relatório

- Novo botão **Exportar Excel** na tela do relatório.
- Geração `.xlsx` no navegador, sem depender de servidor externo.
- Aba **Relatório Oficial** diagramada com a identidade Solocontrol e preparada para impressão A4.
- Abas técnicas criadas apenas para os ensaios selecionados/realizados.
- Fórmulas reais nas células para granulometria, índice de forma e módulos calculados, permitindo auditoria do cálculo no Excel.
- Cabeçalhos, unidades, número do relatório, revisão, identificação da amostra, litologia e matriz de resultados mantidos no arquivo.
- Gráfico granulométrico é exportado para o Excel quando o ensaio estiver presente.
- O arquivo de teste foi reaberto e verificado quanto a estrutura, fórmulas e erros de referência.

## V12 — PDF oficial + Excel espelho do sistema

A V12 consolida o fluxo definitivo do laboratório:

1. O técnico preenche **somente o Solocontrol Lab**.
2. O sistema executa cálculos, critérios e pré-validações.
3. O mesmo conjunto de dados gera o **PDF oficial**.
4. O botão **Exportar Excel** gera um `.xlsx` sem novo lançamento de dados.

### Como o Excel foi estruturado

- **Relatório Oficial:** captura as mesmas páginas A4 renderizadas pelo Solocontrol Lab e usadas como base do PDF. Isso mantém no Excel o mesmo logo, cabeçalho, tabelas, gráfico granulométrico, fotos, paginação, conclusão e rodapé exibidos no sistema.
- **Abas técnicas:** guardam os dados numéricos e fórmulas reais dos ensaios selecionados, permitindo conferência e auditoria.
- Somente os módulos executados são incluídos nas abas técnicas.
- O arquivo é configurado para A4 e a primeira aba permanece na posição inicial.

### Proteção contra Excel corrompido

Antes de iniciar o download, a V12:

- termina de carregar fontes e imagens do relatório;
- monta o XLSX completo;
- reabre o arquivo em memória com o próprio mecanismo XLSX;
- verifica se as abas obrigatórias existem;
- confirma a presença de fórmulas quando há módulos calculados;
- cancela o download e mostra uma mensagem se a validação falhar.

O arquivo de referência utilizado nos testes estruturais foi reaberto com sucesso, com 8 abas, 112 fórmulas e 6 recursos gráficos/imagens, sem erro de integridade ZIP/XLSX.


## V12.1 — correção de build Vercel
- Corrigido erro TypeScript em `src/lib/excel.ts` na aplicação das cores de status do ExcelJS.
- `statusFill()` retorna `fgColor` diretamente; todas as referências incorretas a `st.fill` foram substituídas por `fgColor: st.fgColor`.


## V13 — Excel editável para auditoria

A aba Relatório Oficial deixou de ser uma imagem. O XLSX agora reproduz o relatório com células editáveis e fórmulas ligadas às abas técnicas, permitindo auditar a memória de cálculo. O gráfico continua incorporado como visual, enquanto todos os seus dados permanecem nas células de Granulometria.


## V13.1 – correção de build

- Corrigida incompatibilidade TypeScript/ExcelJS: removida atribuição inexistente `worksheet.freezePanes`.
- Congelamento de painéis continua sendo feito pela propriedade suportada `worksheet.views`.
- Nenhuma regra do Firebase foi alterada.


## V13.2 – correção de build
- Corrigido narrowing TypeScript em `calc.granulometry` dentro do gerador do Excel auditável.
- Nenhuma alteração em Firebase/Storage é necessária.
