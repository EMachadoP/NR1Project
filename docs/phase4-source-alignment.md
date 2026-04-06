# Fase 4 - Alinhamento Necessario nos Documentos Mestres

Este arquivo registra os ajustes que precisam existir em `03_SOURCE_OF_TRUTH.md` e `02_SDD.md` para manter a implementacao da Fase 4 sem contradicao documental.

## 03_SOURCE_OF_TRUTH.md
- a resposta da IA precisa passar por validacao semantica apos o parse JSON
- `companyRules` deve aceitar apenas codigos aprovados, sem texto livre arbitrario
- `fallbackUsed` deve ser persistido e visivel ao RH
- `prompt_version` deve ser persistido para auditabilidade

## 02_SDD.md
- `analysis_results` precisa armazenar `ai_recommendations_json`, `fallback_used`, `prompt_version` e `ai_generated_at`
- o endpoint de IA deve registrar auditoria tanto para geracao normal quanto para violacao de guardrail
- o fallback deve ser tratado como resultado valido do backend, nao como erro silencioso

## Observacao
A implementacao do workspace ja segue estas regras. Este arquivo existe para fechar a diferenca entre codigo atual e os artefatos mestres quando eles estiverem fora do repositorio.
