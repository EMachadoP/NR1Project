# Guia de Deploy - NR-1 Survey & Risk Manager

## Diagnóstico do Application Error (500 em /campanhas)

### Causa Raiz

O erro 500 em `/campanhas` ocorre porque o backend usa `createAdminSupabaseClient()` que **exige** a variável `SUPABASE_SERVICE_ROLE_KEY`. Se essa variável não está configurada no Vercel, a aplicação lança um erro.

**Cadeia de chamadas:**
```
/campanhas/page.tsx
  → requirePortalSession()            ✅ funciona com ANON key
  → listCampaignsService(session)
    → listCampaignsBySessionScope()
      → listCampaigns()
        → createAdminSupabaseClient()  ❌ exige SERVICE_ROLE_KEY
```

### O que NÃO é mais o problema

- ✅ `/login` responde 200
- ✅ `/login/forgot-password` responde 200
- ✅ Fluxo de recuperação de senha está funcionando
- ✅ Typecheck passando (0 erros)
- ✅ ESLint passando (0 warnings)
- ✅ Testes passando (29/29)

---

## Passo 1: Configurar Variáveis de Ambiente no Vercel

Acesse o painel do Vercel → Settings → Environment Variables e configure:

| Variável | Valor | Ambiente |
|----------|-------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do seu projeto Supabase (ex: `https://xxxxx.supabase.co`) | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anon do Supabase | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service_role do Supabase | Production, Preview, Development |
| `OPENAI_API_KEY` | Chave da OpenAI (opcional, para análise IA) | Production, Preview, Development |
| `REPORTS_BUCKET` | `reports` | Production, Preview, Development |

**Como obter as chaves do Supabase:**
1. Acesse https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em Settings → API
4. Copie:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (mantenha em segredo!)

**Após configurar, faça um Redeploy:**
1. Vá em Deployments no painel do Vercel
2. Clique nos 3 pontos (`...`) do último deploy
3. Clique em "Redeploy"

---

## Passo 2: Aplicar Migrations no Supabase

As migrations do projeto **precisam** ser aplicadas no banco Supabase antes de testar `/campanhas`.

### Migrations existentes:

1. `20260406154000_initial_schema.sql` - Schema completo do banco
2. `20260406223000_phase1_integrity_alignment.sql` - Restrições de integridade
3. `20260406233000_phase2_reports_and_receipts.sql` - Relatórios e recibos
4. `20260407001000_phase3_rbac_scope.sql` - RBAC e escopo por setor/unidade
5. `20260407013000_phase4_ai_analysis_metadata.sql` - Metadados de análise IA

### Como aplicar via Supabase Dashboard:

1. Acesse https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em SQL Editor
4. Execute cada migration **em ordem** (do mais antigo para o mais novo)
5. Confirme que não houve erro em cada execução

### Como aplicar via Supabase CLI (recomendado):

```bash
# Instale a CLI se necessário
# npm install -g supabase

# Link com seu projeto
supabase link --project-ref SEU_PROJECT_REF

# Aplique as migrations
supabase db push
```

### Como verificar se as tabelas existem:

Execute este SQL no Supabase SQL Editor:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('profiles', 'campaigns', 'analysis_results', 'generated_reports', 'questionnaires', 'survey_submissions')
order by table_name;
```

**Resultado esperado:**
```
table_name
-------------------
analysis_results
campaigns
generated_reports
profiles
questionnaires
survey_submissions
```

---

## Passo 3: Criar Perfil Admin Inicial

Para conseguir fazer login no portal, é necessário ter um usuário autenticado no Supabase Auth e um perfil correspondente na tabela `public.profiles`.

### Opção A: Criar usuário via Dashboard

1. Supabase Dashboard → Authentication → Users → Add User
2. Crie um usuário com email e senha
3. Copie o `id` do usuário criado
4. Execute no SQL Editor:

```sql
-- Crie o perfil (o trigger deve fazer isso automaticamente, mas caso não exista)
insert into public.profiles (id, role, display_name)
values ('ID_DO_USUARIO_AQUI', 'admin', 'Seu Nome')
on conflict (id) do update set role = 'admin';
```

### Opção B: Usar o script existente

Se já existe um usuário, veja `supabase/manual/promote-luciana-admin.sql` para referência.

---

## Passo 4: Verificar RLS Policies

O schema habilita Row Level Security em todas as tabelas. Sem policies corretas, mesmo com as variáveis configuradas, o acesso será bloqueado.

### Policies mínimas necessárias:

```sql
-- Profiles: usuários autenticados podem ler o próprio perfil
create policy "Usuarios leem proprio perfil"
on public.profiles for select
using (auth.uid() = id);

-- Profiles: service_role pode fazer tudo (bypass RLS)
-- Isso é automático com SUPABASE_SERVICE_ROLE_KEY

-- Campaigns: autenticados podem ler campanhas
create policy "Autenticados leem campanhas"
on public.campaigns for select
using (auth.role() = 'authenticated');

-- Questionnaires: autenticados podem ler
create policy "Autenticados leem questionarios"
on public.questionnaires for select
using (auth.role() = 'authenticated');
```

**Nota:** Como o backend usa `createAdminSupabaseClient()` com `service_role_key`, o RLS é **bypassado** automaticamente para operações server-side. Isso é intencional e seguro, pois o código faz autorização manual via `filterCampaignsBySessionScope()`.

---

## Passo 5: Testar Localmente (Opcional mas Recomendado)

```bash
# Clone o .env.example e preencha
cp .env.example .env.local

# Instale dependências
npm install

# Rode os testes
npm test

# Build de produção
npm run build

# Se tudo passou, rode em dev
npm run dev
```

Acesse http://localhost:3000 e teste o fluxo completo.

---

## Resumo do Deploy no Vercel

### Via CLI:

```bash
# Instale a CLI do Vercel
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Configure as variáveis de ambiente
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add REPORTS_BUCKET production
```

### Via Dashboard:

1. Conecte o repositório GitHub ao Vercel
2. Configure as variáveis em Settings → Environment Variables
3. Faça deploy
4. Se já estava conectado, apenas configure as vars e faça Redeploy

---

## Checklist Final

- [ ] `NEXT_PUBLIC_SUPABASE_URL` configurada no Vercel
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` configurada no Vercel
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurada no Vercel
- [ ] `REPORTS_BUCKET=reports` configurada no Vercel
- [ ] Migrations aplicadas no Supabase
- [ ] Tabelas existem no banco (validação SQL)
- [ ] Pelo menos 1 usuário admin criado no Auth + Profiles
- [ ] RLS policies configuradas (ou bypass via service_role)
- [ ] Redeploy feito no Vercel após configurar variáveis
- [ ] Testar `/login` → login → `/campanhas`

---

## Troubleshooting

### Erro "SUPABASE_SERVICE_ROLE_KEY is required"

A variável não está configurada no Vercel. Configure e faça redeploy.

### Erro 500 mesmo com SERVICE_ROLE_KEY configurada

1. Verifique se o valor da variável está correto (sem espaços ou quebras de linha)
2. Verifique se as migrations foram aplicadas
3. Verifique os logs no Vercel: Dashboard → Deployments → Clique no deploy → Logs

### Erro de RLS "new row violates row-level security policy"

O backend usa `service_role` que bypass RLS. Se o erro ocorre, verifique:
- A chave `SUPABASE_SERVICE_ROLE_KEY` está correta (não é a anon key)
- O usuário no Supabase tem permissões de service_role

### Página /campanhas carrega vazia

Sem campaigns no banco. Crie uma campanha via SQL ou API admin.
