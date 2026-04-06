# Reporting Module

## Templates versionados
- Template atual: `v1`
- Arquivos de template server-side:
  - `src/lib/server/pdf/report-base.ts`
  - `src/lib/server/pdf/report-templates.ts`
- O valor de versao fica centralizado em `REPORT_TEMPLATE_VERSION`
- Cada artefato salvo em storage inclui a versao no caminho do arquivo
- Cada registro em `generated_reports` persiste `template_version`

## Estados de geracao
- `pending`: snapshot registrado, artefato ainda nao concluido
- `done`: artefato salvo no storage e pronto para link assinado
- `failed`: falha registrada com `error_message`, sem derrubar a submissao anonima

## Fluxo de geracao atualizado
1. Backend fecha um snapshot auditavel do relatorio
2. Backend cria registro em `generated_reports` com `status = pending`
3. O relatorio individual e desacoplado da submissao anonima
4. O relatorio analitico usa somente snapshot fechado no momento da solicitacao
5. Ao processar o snapshot, o backend salva o artefato no Supabase Storage
6. O registro passa para `done` ou `failed`
7. O acesso interno ocorre por link assinado temporario

## Estrutura dos artefatos
- Relatorio Individual:
  - campanha
  - questionario
  - data/hora
  - id do envio por `receipt_code`
  - perguntas e respostas
  - media/classificacao por secao
- Relatorio Analitico:
  - resumo executivo
  - tabela por secao
  - escala de risco
  - itens criticos
  - recomendacoes
  - plano de acao estruturado

## Regras de anonimato da Fase 2
- submissao nunca falha por erro de PDF ou storage
- URL publica usa `receipt_code` opaco, nunca `submissionId`
- recibo publico possui expiracao persistida no banco
- `observation_text` deve ser tratado como nota anonima opcional
- se for exibido em artefato interno, deve usar a versao redigida/sanitizada persistida pelo backend
- `observation_text` nunca entra no payload da IA usado para recomendacoes
- nenhum identificador pessoal pode ser reintroduzido em template ou metadado do relatorio individual

## TTL oficial de links assinados
- TTL oficial do MVP para link assinado interno: `3600` segundos (`1 hora`)
- O valor padrao fica centralizado em `REPORT_SIGNED_URL_TTL_SECONDS`
- Esse TTL vale para download interno a partir do backend autenticado
- A expiracao curta reduz a janela de exposicao de artefatos sensiveis sem alterar o armazenamento server-side auditavel

## Evolucao de template
- Mudancas de layout ou secoes devem gerar nova versao (`v2`, `v3`, ...)
- Nunca sobrescrever a semantica de uma versao antiga
- Links assinados sempre apontam para o artefato gerado da versao registrada
