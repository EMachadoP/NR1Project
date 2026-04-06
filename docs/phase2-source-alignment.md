# Fase 2 - Alinhamento Necessario nos Documentos Mestres

Este arquivo registra os ajustes que precisam existir em `03_SOURCE_OF_TRUTH.md` e `02_SDD.md` para manter a implementacao da Fase 2 sem contradicao documental.

## 03_SOURCE_OF_TRUTH.md
- URL publica de confirmacao deve usar `receipt_code` opaco, nunca `submissionId`
- recibo publico deve expirar por politica fixa do backend
- falha de geracao de relatorio nao pode invalidar a submissao anonima
- relatorio analitico deve ser gerado a partir de snapshot fechado e auditavel

## 02_SDD.md
- `generated_reports` precisa registrar `status`, `error_message`, `requested_at`, `generated_at`, `source_analysis_id` e `payload_json`
- relatorio individual deve entrar como `pending` apos submissao e ser processado sem acoplar sucesso de PDF ao envio
- `survey_submissions` precisa persistir `receipt_expires_at`
- download interno deve usar link assinado apenas depois que o registro estiver `done`

## Observacao
A implementacao do workspace ja segue estas regras. Este arquivo serve para fechar a lacuna entre codigo atual e documentacao de referencia quando os originais estiverem fora do repositorio.
