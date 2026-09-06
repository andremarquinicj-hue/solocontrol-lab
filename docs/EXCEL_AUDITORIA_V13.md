# Excel de Auditoria V13

Objetivo: ao clicar **Exportar Excel**, o técnico recebe uma versão editável do mesmo relatório emitido pelo Solocontrol Lab.

## Estrutura
- `Relatório Oficial`: relatório montado com células, mesclagens, bordas, textos e fórmulas. **Não é uma imagem do PDF.**
- `Granulometria`: pesos de entrada e fórmulas de retenção, diferença, média, acumulada, passante e conformidade.
- `Índice de Forma`: cada fragmento com a, b, c, b/a, c/b e classificação calculada.
- `Propriedades Físicas`: massas e fórmulas de massa específica, porosidade e absorção.
- `Material Pulverulento`: massas e memória de cálculo das determinações.
- `Torrões de Argila`: intervalos, massas e teores parciais/total.
- `Massa Unitária` e demais ensaios selecionados.
- `Resultados Gerais`: matriz consolidada.

## Auditoria
O relatório oficial referencia as abas técnicas. Portanto, no Excel Desktop, o auditor pode selecionar uma célula calculada e seguir a fórmula até a memória de cálculo correspondente.

O gráfico granulométrico é um elemento visual incorporado para manter a aparência do relatório. Os dados que o originam permanecem integralmente em células e fórmulas na aba `Granulometria`.

## Teste automatizado
`npm run test:excel` valida:
1. presença das abas obrigatórias;
2. quantidade mínima de fórmulas;
3. que o `Relatório Oficial` contém células e fórmulas reais;
4. que não há páginas inteiras inseridas como imagens;
5. que o `.xlsx` pode ser reaberto pelo ExcelJS após a geração.
