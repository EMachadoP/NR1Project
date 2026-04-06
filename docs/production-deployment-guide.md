# Production Deployment Guide

## 1. Checklist de producao
- Confirmar que as migrations das Fases 1 a 4 foram aplicadas no projeto Supabase de producao
- Confirmar que o bucket de relatorios existe no Storage e que o nome bate com `REPORTS_BUCKET`
- Confirmar que existe ao menos um usuario `admin` ou `hr` em `auth.users` com linha correspondente em `profiles`
- Confirmar que `profiles.role`, `profiles.sector` e `profiles.unit` estao preenchidos conforme o escopo de acesso esperado
- Confirmar que o ambiente Vercel tem todas as variaveis obrigatorias configuradas em Production
- Confirmar que o endpoint de IA esta habilitado apenas se `OPENAI_API_KEY` estiver configurada
- Confirmar que o fluxo anonimo usa apenas `token_hash` e nao existe endpoint publico expondo `submissionId`
- Confirmar que o signed URL TTL permanece em `3600` segundos
- Executar `npm run typecheck`
- Executar a suite de testes critica antes do deploy
- Validar build de producao com `npm run build`

## 2. Variaveis de ambiente obrigatorias
Definidas pelo codigo em `src/lib/validation/env.ts`.

Obrigatorias:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `REPORTS_BUCKET`

Condicionais:
- `OPENAI_API_KEY`
- `OPENAI_MODEL`

Recomendacao operacional:
- `OPENAI_API_KEY` so deve existir quando a integracao de IA estiver habilitada no ambiente
- `OPENAI_MODEL` pode permanecer no default atual do codigo se nao houver override explicito
- `SUPABASE_SERVICE_ROLE_KEY` deve existir apenas no backend da Vercel; nunca no frontend

## 3. Configuracao de build no Vercel
Configuracao esperada para projeto Next.js:
- Framework Preset: `Next.js`
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: padrao do Next.js
- Node.js: usar versao compativel com `Next 15` e `React 19`

Observacoes:
- O projeto usa App Router e APIs server-side, entao nao deve ser exportado como estatico
- `middleware.ts` precisa permanecer habilitado para sincronizacao de sessao Supabase
- O build deve falhar se variaveis obrigatorias nao estiverem configuradas, o que e desejado em producao

## 4. Configuracao do Supabase
Banco:
- Aplicar todas as migrations em ordem cronologica
- Confirmar constraints de anonimato e relatorios ja presentes nas Fases 1 a 4
- Confirmar existencia dos campos de RBAC em `profiles`: `role`, `sector`, `unit`

Auth:
- Criar usuarios internos apenas para `admin`, `hr` e `manager`
- Garantir que cada usuario autenticado tenha linha correspondente em `profiles`
- Revisar politica de recuperacao de senha e MFA conforme exigencia operacional da empresa

RLS/RBAC:
- Manter `campaign_tokens`, `survey_submissions` e `submission_answers` sem acesso direto do cliente anonimo
- Garantir que o fluxo anonimo opere apenas por rotas server-side em `src/app/api/public`
- Confirmar que `manager` so enxerga campanhas do proprio `sector/unit`
- Confirmar que `manager` nao acessa relatorio individual

## 5. Configuracao do Storage
Bucket:
- Criar bucket privado com o nome definido em `REPORTS_BUCKET`
- Nao expor bucket publicamente
- O download deve ocorrer apenas via signed URL emitida pelo backend

Uso atual do projeto:
- Artefatos de relatorio sao gravados pelo backend com `SUPABASE_SERVICE_ROLE_KEY`
- Links internos sao assinados no momento do acesso
- TTL oficial atual: `3600` segundos (`1 hora`)

Recomendacoes:
- Ativar politicas operacionais para impedir upload direto do cliente ao bucket de relatorios
- Monitorar objetos antigos e definir politica de retencao conforme exigencia da empresa

## 6. Cuidados com PDF em ambiente serverless
Estado atual do MVP:
- O modulo atual gera artefatos HTML server-side e os salva no Storage
- Isso reduz risco operacional em ambiente serverless e evita falha da submissao por geracao pesada

Se houver evolucao para PDF real server-side:
- Evitar gerar PDF sincrono dentro do fluxo publico de submissao
- Nao depender de binarios pesados sem validar compatibilidade com runtime serverless da Vercel
- Preferir pipeline assincrono para renderizacao e persistencia do artefato
- Controlar timeout, memoria e tamanho do payload do relatorio
- Validar que a fonte de verdade do relatorio continua sendo o snapshot persistido, nunca queries em tempo real durante a renderizacao

## 7. Plano de smoke test pos-deploy
Fluxo publico anonimo:
1. Acessar `/responder/[token]` com token valido
2. Validar carregamento do questionario
3. Enviar respostas validas
4. Confirmar redirecionamento para `/obrigado/[receiptCode]`
5. Confirmar que nao ha exposicao de `submissionId` na URL
6. Confirmar que um segundo envio com o mesmo token e bloqueado

Fluxo administrativo:
1. Login como `hr`
2. Abrir dashboard de campanhas
3. Abrir analytics de uma campanha com `>= 5` respostas e validar consolidado
4. Abrir analytics de uma campanha/grupo com `< 5` respostas e validar bloqueio por anonimato
5. Criar, editar e excluir item de plano de acao
6. Criar, editar e excluir indicador
7. Gerar relatorio analitico e abrir link assinado
8. Se IA estiver habilitada, chamar `POST /api/admin/ai/recommendations` e validar resposta estruturada

Fluxo de RBAC:
1. Login como `manager`
2. Confirmar acesso apenas a campanhas do proprio `sector/unit`
3. Confirmar bloqueio de escrita administrativa
4. Confirmar bloqueio de download de relatorio individual

## 8. Validacoes finais de seguranca e RBAC
- `SUPABASE_SERVICE_ROLE_KEY` nunca deve aparecer em `NEXT_PUBLIC_*`
- `campaign_tokens` devem continuar persistidos apenas por `token_hash`
- `observation_text` nao deve entrar no payload da IA
- `report-service` deve continuar emitindo signed URL apenas apos verificacao de sessao e escopo
- `requirePortalApiSession` deve permanecer como guarda minima dos endpoints administrativos
- `actor_role` em `audit_logs` deve continuar vindo da sessao validada
- `manager` deve continuar sem acesso a relatorio individual
- O endpoint de IA deve continuar restrito a `admin/hr` e com rate limit
- O backend deve continuar bloqueando analytics abaixo de `5` respostas por agrupamento

## 9. Pontos de monitoramento e logs
Aplicacao:
- erros em `POST /api/public/submissions`
- erros em `GET /api/admin/reports/[id]/download`
- respostas `429` de `POST /api/admin/ai/recommendations`
- falhas de autenticacao e `403` administrativos

Banco e dominio:
- relatorios em `generated_reports` com `status = failed`
- relatorios em `generated_reports` presos em `pending`
- campanhas sem `analysis_results` recente apos novas submisses
- tentativas repetidas de token ja usado ou expirado

Auditoria:
- eventos `ai_recommendations_generated`
- eventos `ai_guardrail_violation`
- eventos `rate_limit_exceeded`
- CRUD de `action_plans`
- CRUD de `monitoring_indicators`

Operacao:
- volume de signed URLs emitidas por usuario
- crescimento do bucket de relatorios
- latencia de geracao de relatorio analitico
- taxa de fallback da IA quando `OPENAI_API_KEY` estiver habilitada
