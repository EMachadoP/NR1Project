-- =====================================================
-- SETUP COMPLETO DO SUPABASE - NR-1 Survey & Risk Manager
-- =====================================================
-- Execute este script no SQL Editor do Supabase Dashboard
-- Ele verifica e configura tudo necessário para o deploy
-- =====================================================

-- =====================================================
-- 1. VERIFICAR TABELAS EXISTENTES
-- =====================================================
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('profiles', 'campaigns', 'analysis_results', 'generated_reports', 'questionnaires', 'survey_submissions', 'campaign_tokens', 'submission_answers', 'action_plans', 'monitoring_indicators', 'audit_logs')
order by table_name;

-- Se alguma tabela estiver faltando, aplique as migrations na ordem:
-- 1. 20260406154000_initial_schema.sql
-- 2. 20260406223000_phase1_integrity_alignment.sql
-- 3. 20260406233000_phase2_reports_and_receipts.sql
-- 4. 20260407001000_phase3_rbac_scope.sql
-- 5. 20260407013000_phase4_ai_analysis_metadata.sql

-- =====================================================
-- 2. VERIFICAR SE O SCHEMA ESTÁ COMPLETO
-- =====================================================
-- Verificar colunas adicionadas nas migrations posteriores
select column_name, data_type
from information_schema.columns
where table_name = 'profiles'
  and column_name in ('sector', 'unit')
order by column_name;

select column_name, data_type
from information_schema.columns
where table_name = 'generated_reports'
  and column_name in ('status', 'error_message', 'requested_at', 'source_analysis_id', 'payload_json', 'updated_at')
order by column_name;

select column_name, data_type
from information_schema.columns
where table_name = 'analysis_results'
  and column_name in ('ai_recommendations_json', 'fallback_used', 'prompt_version', 'ai_generated_at')
order by column_name;

-- =====================================================
-- 3. VERIFICAR RLS POLICIES EXISTENTES
-- =====================================================
select schemaname, tablename, policyname, permissive, roles, cmd, qual
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- Se não houver policies, execute as abaixo:

-- -- Profiles: usuários autenticados podem ler o próprio perfil
-- create policy "Usuarios leem proprio perfil"
-- on public.profiles for select
-- using (auth.uid() = id);

-- -- Campaigns: autenticados podem ler campanhas
-- create policy "Autenticados leem campanhas"
-- on public.campaigns for select
-- using (auth.role() = 'authenticated');

-- -- Questionnaires: autenticados podem ler
-- create policy "Autenticados leem questionarios"
-- on public.questionnaires for select
-- using (auth.role() = 'authenticated');

-- =====================================================
-- 4. VERIFICAR USUÁRIOS NO AUTH
-- =====================================================
select id, email, created_at, last_sign_in_at
from auth.users
order by created_at desc
limit 10;

-- =====================================================
-- 5. VERIFICAR PERFIS EXISTENTES
-- =====================================================
select p.id, p.role, p.display_name, p.sector, p.unit, p.created_at, u.email
from public.profiles p
left join auth.users u on u.id = p.id
order by p.created_at desc
limit 10;

-- =====================================================
-- 6. CRIAR PERFIL ADMIN (se não existir)
-- =====================================================
-- Substitua o UUID pelo ID de um usuário real do auth.users
-- Você pode obter isso do passo 5

-- Exemplo: criar perfil admin para usuário existente
-- insert into public.profiles (id, role, display_name)
-- values ('SEU_USER_ID_AQUI', 'admin', 'Administrador')
-- on conflict (id) do nothing;

-- =====================================================
-- 7. PROMOVER USUÁRIO EXISTENTE A ADMIN
-- =====================================================
-- Atualize o UUID abaixo para o ID do usuário que será admin
-- update public.profiles
-- set role = 'admin'
-- where id = 'SEU_USER_ID_AQUI';

-- Verificação
-- select id, role, display_name
-- from public.profiles
-- where role = 'admin';

-- =====================================================
-- 8. VERIFICAR CAMPANHAS EXISTENTES
-- =====================================================
select id, name, sector, unit, status, start_date, end_date, language, created_at
from public.campaigns
order by created_at desc
limit 10;

-- Se não houver campanhas, crie uma de teste:
-- insert into public.campaigns (questionnaire_id, name, sector, unit, status, start_date, end_date, language)
-- values (
--   (select id from public.questionnaires limit 1),
--   'Campanha de Teste',
--   'Recursos Humanos',
--   'Matriz',
--   'active',
--   current_date,
--   current_date + interval '30 days',
--   'pt-BR'
-- );

-- =====================================================
-- 9. VERIFICAR QUESTIONÁRIOS EXISTENTES
-- =====================================================
select id, name, version, status, created_at
from public.questionnaires
order by created_at desc
limit 10;

-- =====================================================
-- 10. CONTAGEM GERAL DE DADOS
-- =====================================================
select 'profiles' as tabela, count(*) as registros from public.profiles
union all
select 'questionnaires', count(*) from public.questionnaires
union all
select 'campaigns', count(*) from public.campaigns
union all
select 'campaign_tokens', count(*) from public.campaign_tokens
union all
select 'survey_submissions', count(*) from public.survey_submissions
union all
select 'analysis_results', count(*) from public.analysis_results
union all
select 'generated_reports', count(*) from public.generated_reports
union all
select 'action_plans', count(*) from public.action_plans;

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
-- Se todos os passos acima estão OK, o deploy funcionará.
-- Configure as variáveis de ambiente no Vercel e faça redeploy.
-- =====================================================
