# Excel espelho do Solocontrol Lab

## Fonte única de dados

O usuário não preenche o Excel. Toda a entrada ocorre no sistema. PDF e XLSX são duas exportações do mesmo relatório armazenado no Solocontrol Lab.

## Relatório Oficial

A aba inicial `Relatório Oficial` é produzida a partir das próprias páginas `.report-a4` mostradas na tela de relatório e usadas para o PDF. Cada página é capturada após o carregamento de fontes e imagens e inserida como página A4 no Excel.

Essa estratégia reduz diferenças de layout entre navegador, PDF e Excel: o que o revisor vê na prévia é o que aparece na primeira aba do XLSX.

## Abas técnicas e fórmulas

Quando aplicáveis, são criadas abas como:

- Granulometria
- Índice de Forma
- Propriedades Físicas
- Material Pulverulento
- Torrões de Argila
- Massa Unitária
- Demais ensaios selecionados
- Resultados Gerais

As células derivadas usam fórmulas Excel e o workbook é marcado para recalcular ao abrir.

## Validação de integridade

Antes do download, o arquivo é serializado e carregado novamente em memória. O sistema verifica a estrutura mínima e a existência de fórmulas técnicas. Se a validação falhar, nenhum XLSX é entregue ao usuário.
