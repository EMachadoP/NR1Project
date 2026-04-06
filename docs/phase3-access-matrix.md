# Matriz de Acesso - Fase 3

## Regras fixas
- o backend e a fonte de verdade para autorizacao
- `profiles.role` define o papel efetivo
- `profiles.sector` e `profiles.unit` definem o escopo do Gestor
- Gestor nunca acessa relatorio individual
- `actor_role` em `audit_logs` sempre vem da sessao validada

## Matriz por endpoint

| Endpoint | Metodo | Admin | RH | Gestor | Observacao |
|---|---|---|---|---|---|
| `/api/admin/campaigns` | GET | sim | sim | sim | Gestor so ve campanhas do proprio setor/unidade |
| `/api/admin/campaigns/[id]` | GET | sim | sim | sim | Gestor so no proprio escopo |
| `/api/admin/campaigns/[id]` | PATCH | sim | sim | nao | escrita administrativa |
| `/api/admin/campaigns/[id]/analytics` | GET | sim | sim | sim | Gestor so no proprio escopo |
| `/api/admin/campaigns/[id]/report` | POST | sim | sim | sim | apenas relatorio analitico, com escopo para Gestor |
| `/api/admin/campaigns/[id]/tokens` | POST | sim | sim | nao | emissao de token restrita |
| `/api/admin/questionnaires` | GET/POST | sim | sim | nao | questionarios restritos a Admin/RH |
| `/api/admin/questionnaires/[id]` | GET/PATCH | sim | sim | nao | questionarios restritos a Admin/RH |
| `/api/admin/questionnaires/[id]/publish` | POST | sim | sim | nao | publicacao restrita |
| `/api/admin/action-plans` | GET | sim | sim | sim | Gestor so consulta no proprio escopo |
| `/api/admin/action-plans` | POST | sim | sim | nao | escrita restrita |
| `/api/admin/action-plans/[id]` | PATCH/DELETE | sim | sim | nao | escrita restrita |
| `/api/admin/indicators` | GET | sim | sim | sim | Gestor so consulta no proprio escopo |
| `/api/admin/indicators` | POST | sim | sim | nao | escrita restrita |
| `/api/admin/indicators/[id]` | PATCH/DELETE | sim | sim | nao | escrita restrita |
| `/api/admin/reports/[id]/download` | GET | sim | sim | condicional | Gestor apenas para relatorio analitico no proprio escopo |
| `/api/admin/ai/recommendations` | POST | sim | sim | nao | endpoint de IA restrito |
