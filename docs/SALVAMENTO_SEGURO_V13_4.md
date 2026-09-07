# Salvamento seguro — V13.4

Esta versão corrige a falha do Firestore `Unsupported field value: undefined` que podia impedir o salvamento de fichas quando alguns módulos de ensaio não estavam selecionados.

## Alterações

- Sanitização recursiva antes de gravar `reports` e `auditLogs` no Firestore.
- Campos `undefined` são removidos de objetos; itens `undefined` em arrays são convertidos para `null`.
- Mensagem visual de sucesso ou erro ao salvar.
- Backup local automático no navegador durante o preenchimento.
- Recuperação automática assistida do rascunho local ao reabrir uma ficha nova.
- O rascunho local é apagado somente depois de uma gravação confirmada no Firestore.

## Fluxo esperado

1. Preencher a ficha.
2. O topo informa o horário do backup local.
3. Clicar em **Salvar rascunho**.
4. Em sucesso, aparece a confirmação e o sistema abre o relatório salvo.
5. Em falha, a tela permanece aberta e mostra a mensagem do erro; o backup local continua disponível.
