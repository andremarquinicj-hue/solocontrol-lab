# Melhorias da rotina de laboratório — V9

## Lançamentos numéricos
Os campos de peso, massa, dimensão e resultados aceitam vírgula ou ponto decimal. O componente mantém o texto digitado enquanto o campo está em edição, evitando o problema anterior em que `1874,9` virava `1874` antes de a pessoa terminar a digitação.

## Índice de forma / fragmentos
A tela mostra quais frações foram destacadas pela granulometria e o total de fragmentos medidos em cada uma. Há atalhos para adicionar 10 fragmentos e preparar a fração até 100 registros, mantendo a possibilidade de trabalhar com quantidade menor quando a fração disponível não atingir 100 partículas.

## Relatório PDF do índice de forma
O relatório não guarda mais as dimensões individuais apenas no banco. Ele gera páginas específicas com:

- número do fragmento;
- fração granulométrica;
- dimensão a (mm);
- dimensão b (mm);
- dimensão c (mm);
- relação b/a;
- relação c/b;
- classificação individual.

O resumo inclui médias, desvio-padrão, coeficiente de variação, forma média e percentual de partículas não cúbicas.

## Formatação
Pesos e medidas são apresentados no padrão brasileiro, com vírgula decimal, tanto na tela quanto no relatório oficial.
