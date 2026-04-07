-- =====================================================
-- RLS POLICIES MÍNIMAS - NR-1 Survey & Risk Manager
-- =====================================================
-- Este script cria as policies essenciais para o funcionamento
-- O backend usa service_role (bypass RLS), mas policies são
-- necessárias para acesso direto via client (ex: dashboard)
-- =====================================================

-- =====================================================
-- PROFILES
-- =====================================================
-- Usuários autenticados podem ler o próprio perfil
drop policy if exists "Usuarios leem proprio perfil" on public.profiles;
create policy "Usuarios leem proprio perfil"
on public.profiles for select
using (auth.uid() = id);

-- Service role pode gerenciar todos os perfis (automático com service_role_key)

-- =====================================================
-- QUESTIONNAIRES
-- =====================================================
-- Autenticados podem ler questionários publicados
drop policy if exists "Autenticados leem questionarios publicados" on public.questionnaires;
create policy "Autenticados leem questionarios publicados"
on public.questionnaires for select
using (auth.role() = 'authenticated');

-- =====================================================
-- QUESTIONNAIRE_SECTIONS
-- =====================================================
drop policy if exists "Autenticados leem secoes de questionarios" on public.questionnaire_sections;
create policy "Autenticados leem secoes de questionarios"
on public.questionnaire_sections for select
using (
  exists (
    select 1 from public.questionnaires q
    where q.id = questionnaire_sections.questionnaire_id
      and q.status = 'published'
  )
);

-- =====================================================
-- QUESTIONNAIRE_QUESTIONS
-- =====================================================
drop policy if exists "Autenticados leem perguntas de questionarios" on public.questionnaire_questions;
create policy "Autenticados leem perguntas de questionarios"
on public.questionnaire_questions for select
using (
  exists (
    select 1 from public.questionnaire_sections qs
    join public.questionnaires q on q.id = qs.questionnaire_id
    where qs.id = questionnaire_questions.section_id
      and q.status = 'published'
  )
);

-- =====================================================
-- CAMPAIGNS
-- =====================================================
-- Autenticados podem ler campanhas
drop policy if exists "Autenticados leem campanhas" on public.campaigns;
create policy "Autenticados leem campanhas"
on public.campaigns for select
using (auth.role() = 'authenticated');

-- =====================================================
-- CAMPAIGN_TOKENS
-- =====================================================
-- Sem acesso direto do cliente - apenas server-side
-- Nenhuma policy necessária (service_role bypass)

-- =====================================================
-- SURVEY_SUBMISSIONS
-- =====================================================
-- Sem acesso direto do cliente - apenas server-side
-- Nenhuma policy necessária (service_role bypass)

-- =====================================================
-- SUBMISSION_ANSWERS
-- =====================================================
-- Sem acesso direto do cliente - apenas server-side
-- Nenhuma policy necessária (service_role bypass)

-- =====================================================
-- ANALYSIS_RESULTS
-- =====================================================
-- Autenticados podem ler resultados de análise
drop policy if exists "Autenticados leem analysis_results" on public.analysis_results;
create policy "Autenticados leem analysis_results"
on public.analysis_results for select
using (auth.role() = 'authenticated');

-- =====================================================
-- GENERATED_REPORTS
-- =====================================================
-- Autenticados podem ler relatórios gerados
drop policy if exists "Autenticados leem generated_reports" on public.generated_reports;
create policy "Autenticados leem generated_reports"
on public.generated_reports for select
using (auth.role() = 'authenticated');

-- =====================================================
-- ACTION_PLANS
-- =====================================================
-- Autenticados podem ler planos de ação
drop policy if exists "Autenticados leem action_plans" on public.action_plans;
create policy "Autenticados leem action_plans"
on public.action_plans for select
using (auth.role() = 'authenticated');

-- =====================================================
-- ACTION_PLAN_HISTORY
-- =====================================================
-- Autenticados podem ler histórico
drop policy if exists "Autenticados leem action_plan_history" on public.action_plan_history;
create policy "Autenticados leem action_plan_history"
on public.action_plan_history for select
using (auth.role() = 'authenticated');

-- =====================================================
-- MONITORING_INDICATORS
-- =====================================================
-- Autenticados podem ler indicadores
drop policy if exists "Autenticados leem monitoring_indicators" on public.monitoring_indicators;
create policy "Autenticados leem monitoring_indicators"
on public.monitoring_indicators for select
using (auth.role() = 'authenticated');

-- =====================================================
-- AUDIT_LOGS
-- =====================================================
-- Sem acesso direto do cliente - apenas server-side
-- Nenhuma policy necessária (service_role bypass)

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================
select schemaname, tablename, policyname, cmd, roles
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
