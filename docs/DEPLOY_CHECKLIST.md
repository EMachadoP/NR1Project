# 🚀 Checklist de Deploy - NR-1 Survey & Risk Manager

## ✅ Status da Verificação Local

| Verificação | Status |
|---|---|
| TypeScript Typecheck | ✅ PASSOU (0 erros) |
| ESLint | ✅ PASSOU (0 warnings) |
| Testes (Vitest) | ✅ PASSOU (29/29) |
| Build Produção (Next.js) | ✅ PASSOU (17 páginas, 0 erros) |

---

## 🔧 Ações Necessárias para Deploy

### 1️⃣ Supabase - Aplicar Migrations

**Ordem de execução:**

- [ ] `20260406154000_initial_schema.sql` - Schema completo
- [ ] `20260406223000_phase1_integrity_alignment.sql` - Integridade
- [ ] `20260406233000_phase2_reports_and_receipts.sql` - Relatórios
- [ ] `20260407001000_phase3_rbac_scope.sql` - RBAC
- [ ] `20260407013000_phase4_ai_analysis_metadata.sql` - IA
- [ ] `20260407021500_questionnaire_catalog_metadata.sql` - Catalogo de questionarios
- [ ] `20260407180000_campaigns_add_sector_unit.sql` - Escopo por setor/unidade em campanhas

**Onde:** Supabase Dashboard → SQL Editor

**Alternativa (recomendada):** Via Supabase CLI
```bash
supabase link --project-ref SEU_REF
supabase db push
```

### 2️⃣ Supabase - Aplicar RLS Policies

- [ ] Executar `supabase/policies/rls-policies-minimum.sql` no SQL Editor

### 3️⃣ Supabase - Seed Data (opcional, para teste)

- [ ] Executar `supabase/seeds/seed-initial.sql` no SQL Editor

### 4️⃣ Supabase - Criar Usuário Admin

- [ ] Criar usuário em Authentication → Users
- [ ] Copiar o UUID do usuário
- [ ] Executar no SQL Editor (substituir UUID):
```sql
update public.profiles
set role = 'admin'
where id = 'UUID_DO_USUARIO';
```

### 5️⃣ Supabase - Verificar Setup

- [ ] Executar `supabase/setup-verification.sql` para validar tudo

### 6️⃣ Vercel - Configurar Variáveis de Ambiente

**Settings → Environment Variables → Production:**

| Variável | Onde Obter | Obrigatória? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Settings → API → Project URL | ✅ SIM |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Settings → API → anon public | ✅ SIM |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Settings → API → service_role | ✅ SIM |
| `SUPABASE_ACCESS_TOKEN` | Supabase Dashboard → Account → Access Tokens | ✅ SIM |
| `REPORTS_BUCKET` | Valor: `reports` | ✅ SIM |
| `OPENAI_API_KEY` | platform.openai.com | Opcional |

⚠️ **ATENÇÃO:** `SUPABASE_SERVICE_ROLE_KEY` é a causa do erro 500 em `/campanhas`. **DEVE** estar configurada.
⚠️ **ATENÇÃO:** em ambiente Vercel, `npm run build` roda `supabase db push --linked --yes` antes do `next build`. Sem `SUPABASE_ACCESS_TOKEN`, o deploy vai falhar.

### 7️⃣ Vercel - Redeploy

- [ ] Dashboard → Deployments → `...` → Redeploy
- [ ] Ou via CLI: `vercel --prod`

### 8️⃣ Testes Pós-Deploy

- [ ] Acessar `https://SEU_DOMINIO/login` → deve retornar 200
- [ ] Acessar `https://SEU_DOMINIO/login/forgot-password` → deve retornar 200
- [ ] Fazer login com usuário admin
- [ ] Acessar `https://SEU_DOMINIO/campanhas` → **deve carregar sem erro 500**
- [ ] Verificar se campanhas aparecem (se seed data foi aplicado)

---

## 📋 Resumo do Problema

**Causa do Application Error (500):**
A página `/campanhas` chama `createAdminSupabaseClient()` que lança um erro se `SUPABASE_SERVICE_ROLE_KEY` não estiver definida. Esta é uma variável de **servidor** que deve ser configurada no Vercel.

**Por que `/login` funciona:**
As páginas de login usam apenas o cliente anon do Supabase (`NEXT_PUBLIC_SUPABASE_ANON_KEY`), que já estava configurado.

---

## 📁 Arquivos de Apoio Criados

| Arquivo | Finalidade |
|---|---|
| `docs/DEPLOYMENT_GUIDE.md` | Guia completo de deploy com troubleshooting |
| `supabase/setup-verification.sql` | Script para verificar todo o setup |
| `supabase/policies/rls-policies-minimum.sql` | RLS policies essenciais |
| `supabase/seeds/seed-initial.sql` | Dados de exemplo para teste |

---

## 🎯 Ordem Correta de Execução

```
1. Migrations no Supabase
2. RLS Policies no Supabase
3. Seed Data (opcional)
4. Criar usuário admin
5. Configurar vars no Vercel
6. Redeploy no Vercel
7. Testar
```

**Não pule etapas!** A ordem acima é importante.


