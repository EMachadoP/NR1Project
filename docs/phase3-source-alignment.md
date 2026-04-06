# Fase 3 - Alinhamento Necessario nos Documentos Mestres

Este arquivo registra os ajustes que precisam existir em `03_SOURCE_OF_TRUTH.md` e `02_SDD.md` para manter a implementacao da Fase 3 sem contradicao documental.

## 03_SOURCE_OF_TRUTH.md
- RBAC deve ser validado no backend por endpoint, nunca apenas no frontend
- Gestor tem acesso somente a campanhas do proprio setor/unidade
- Gestor nao acessa relatorio individual
- `actor_role` da trilha de auditoria deve vir da sessao validada

## 02_SDD.md
- `profiles` precisa carregar `sector` e `unit` para escopo do Gestor
- a matriz de acesso por endpoint deve distinguir leitura consolidada de escrita administrativa
- relatorio individual deve ser marcado como download interno restrito a `admin` e `hr`
- `audit_logs.actor_role` nao pode vir de payload livre

## Observacao
A implementacao do workspace ja segue estas regras. Este arquivo existe para fechar a diferenca entre codigo atual e os artefatos mestres quando eles estiverem fora do repositorio.
