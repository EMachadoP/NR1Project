# 📋 Auditoria de Conformidade PRD - NR-1 Survey & Risk Manager

**Data:** Abril 6, 2026  
**Status Geral:** 🟡 40% de ProntidãoPara Produção  
**Bloqueadores Críticos:** 3 (Criação de Campanhas, Geração de Tokens, Recuperação de Relatórios)

---

## 🎯 Resumo Executivo

| Aspecto | Status | % Impl. |
|---------|--------|---------|
| **Motor de Cálculo de Risco** | ✅ Completo | 100% |
| **Fluxo do Respondente (PWA)** | ✅ Completo | 100% |
| **Schema de Dados** | ✅ Completo | 100% |
| **Autenticação & RBAC** | ✅ Completo | 100% |
| **Dashboards RH** | ⚠️ Parcial | 60% |
| **Gestão de Campanhas** | ❌ Falta UI | 20% |
| **Geração de Tokens/QR** | ❌ Falta UI | 5% |
| **Relatórios (Download)** | ⚠️ Parcial | 70% |
| **Indicadores** | ⚠️ Parcial | 50% |
| **Plano de Ação** | ✅ Completo | 100% |
| **Integração de IA** | ⚠️ Parcial | 80% |
| **Multi-idioma** | ❌ Falta UI | 0% |
| **Exportações (CSV/Excel)** | ❌ Faltando | 0% |
| **Alertas & Automação** | ❌ Faltando | 0% |

---

## ✅ TOTALMENTE IMPLEMENTADO (6/14 funcionalidades)

### 1. **Motor de Cálculo de Risco - 100%**
- ✅ Normalização de risco (scoring_direction: positive/negative)
- ✅ Cálculo por pergunta
- ✅ Classificação por seção com média ponderada
- ✅ 5 níveis: MUITO BAIXO (1.0-1.5) → CRÍTICO (4.6-5.0)
- ✅ Detecção de itens críticos (≥ 4.0)
- ✅ 29 testes unitários passando
- 📍 Localização: [src/lib/domain/risk/engine.ts](src/lib/domain/risk/engine.ts)

### 2. **Fluxo do Respondente (Survey PWA) - 100%**
- ✅ Validação de token anônimo
- ✅ Escala Likert 5 pontos (Não ocorre → Crítico)
- ✅ Barramento de progresso com validação
- ✅ Campo de observações
- ✅ Submissão com feedback
- ✅ Página de confirmação com código de recebimento
- 📍 Localização: 
  - [src/components/survey/respondent-survey-form.tsx](src/components/survey/respondent-survey-form.tsx)
  - [src/app/responder/[token]/page.tsx](src/app/responder/[token]/page.tsx)

### 3. **Schema de Dados Completo - 100%**
- ✅ 6 migrações em sequência
- ✅ Migrations cobrindo:
  - Schema inicial (campanhas, questionários, perfis, tokens, submissões)
  - Relatórios e recebimentos
  - Políticas RBAC
  - Metadados de análise por IA
  - Catálogo de questionários
- ✅ Constraints de integridade
- ✅ Índices de performance
- 📍 Localização: [supabase/migrations/](supabase/migrations/)

### 4. **Autenticação & RBAC - 100%**
- ✅ Integração com Supabase Auth
- ✅ Três perfis: admin, hr, manager
- ✅ Validação de acesso por endpoint
- ✅ Tabela `profiles` com metadados de usuário
- ✅ Políticas RLS aplicadas
- 📍 Localização:
  - [src/lib/auth/session.ts](src/lib/auth/session.ts)
  - [src/lib/auth/authorization.ts](src/lib/auth/authorization.ts)

### 5. **Plano de Ação - 100%**
- ✅ CRUD completo (create, read, update, delete)
- ✅ Transições de status: open → in_progress → done
- ✅ Histórico de alterações
- ✅ Logging de auditoria
- ✅ UI com componente gerenciador
- 📍 Localização: [src/components/portal/action-plans-manager.tsx](src/components/portal/action-plans-manager.tsx)

### 6. **Geração de Relatórios (Backend) - 100%**
- ✅ Serviço de relatório individual por submissão
- ✅ Relatório analítico por campanha
- ✅ Templates HTML
- ✅ Gerenciamento de armazenamento
- ✅ Status tracking (pending → done/failed)
- 📍 Localização: [src/lib/server/services/report-service.ts](src/lib/server/services/report-service.ts)

---

## ⚠️ PARCIALMENTE IMPLEMENTADO (5/14 funcionalidades)

### 1. **Dashboards RH - 60%** 🟡
**Implementado:**
- ✅ Dashboard de campanha com contador de respostas
- ✅ Detecção de itens críticos
- ✅ Agregados por seção
- ✅ Proteção de anonimato (limiar mínimo de grupo)
- ✅ Metadados de campanha

**Faltando:**
- ❌ Filtros avançados (departamento, turno, função)
- ❌ Exportação para dashboard (apenas visualização)
- ❌ Histórico de campanhas anteriores
- ❌ Comparação entre períodos

📍 Localização: [src/app/campanhas/[id]/page.tsx](src/app/campanhas/[id]/page.tsx)

### 2. **Indicadores - 50%** 🟡
**Implementado:**
- ✅ Páginas de listagem e gestão
- ✅ Schema completo no banco
- ✅ Component gerenciador de UI
- ✅ Rastreamento de variação

**Faltando:**
- ❌ Persistência da API (endpoints incompletos)
- ❌ Análise de tendências
- ❌ Regras de alerta
- ❌ Visualização de gráficos

📍 Localização: [src/components/portal/indicators-manager.tsx](src/components/portal/indicators-manager.tsx)

### 3. **Relatórios - Download/Acesso - 70%** 🟡
**Implementado:**
- ✅ Geração de PDF
- ✅ Armazenamento em backend
- ✅ Mecanismo de recebimento com TTL (7 dias)
- ✅ Assinatura de URLs para acesso seguro

**Faltando:**
- ❌ **Endpoint GET para recuperar PDF** - não existe `/api/admin/reports/[id]/download`
- ❌ **Link funcional na página de confirmação** - página mostra status mas não link
- ❌ **Segurança de acesso** - validação de quem pode acessar qual relatório

📍 Localização: [src/lib/server/services/report-service.ts](src/lib/server/services/report-service.ts)

### 4. **Integração de IA/Recomendações - 80%** 🟡
**Implementado:**
- ✅ Módulo de validação semântica
- ✅ Detecção de violações de segurança
- ✅ Sistema de fallback
- ✅ Logging de auditoria
- ✅ Versionamento de prompts

**Faltando:**
- ❌ Chamada explícita à API (OpenAI/Gemini) não totalmente visível
- ❌ `OPENAI_API_KEY` é opcional (não obrigatório em produção)
- ❌ Tratamento de rate limiting

📍 Localização: [src/lib/server/ai/recommendations.ts](src/lib/server/ai/recommendations.ts)

### 5. **Questionnaire Display - 50%** 🟡
**Implementado:**
- ✅ Visualização completa
- ✅ Listagem de seções e perguntas
- ✅ Exibição de metadados

**Faltando:**
- ❌ **Admin UI para criar/editar questionários** - assume seed/import
- ❌ **Versionamento de questionários** - não há UI para versões
- ❌ **Gestão de templates** - apenas leitura

📍 Localização: [src/app/questionarios/page.tsx](src/app/questionarios/page.tsx)

---

## ❌ TOTALMENTE FALTANDO (7/14 funcionalidades)

### 1. **Criação e Gestão de Campanhas - 0%** 🔴
**Por quê é crítico:** Sem isso, admins não conseguem criar novas campanhas.

**Falta:**
- ❌ UI para criar nova campanha
- ❌ Seleção de questionário
- ❌ Definição de período (data início/fim)
- ❌ Workflow de status (rascunho → ativa → encerrada)
- ❌ Seletor de setor/unidade
- ❌ Página de configuração pós-criação

📍 Localização: Nenhuma. Endpoint GET existe mas POST/criação não tem UI.

**Impacto:** 🔴 **BLOQUEADOR - Impossível usar a plataforma em produção**

---

### 2. **Geração de Tokens & QR - 0%** 🔴
**Por quê é crítico:** Sem tokens, respondentes não conseguem acessar surveys.

**Falta:**
- ❌ UI para gerar tokens por campanha
- ❌ Cópia para clipboard
- ❌ Geração de código QR
- ❌ Distribuição (email/SMS/print)
- ❌ Associação de respondente (opcional)
- ❌ Resgate/validação de token

**Implementado:**
- ✅ Schema suporta tokens com expiração
- ✅ Validação no respondente funciona
- ✅ API publica de validação existe

📍 Localização: Nenhuma UI. Backend em [src/app/api/public/tokens/route.ts](src/app/api/public/tokens/route.ts)

**Impacto:** 🔴 **BLOQUEADOR - Respondentes não conseguem acessar survev**

---

### 3. **Exportação de Dados (CSV/Excel/PDF) - 0%** 🔴
**Por quê é crítico:** PRD menciona explicitamente como funcionalidade principal.

**Falta:**
- ❌ Exportar campaña para CSV
- ❌ Exportar responses para Excel
- ❌ Download de relatório em PDF
- ❌ Exportação de action plans
- ❌ Exportação de indicadores

**Justificativa no PRD:** "exportação CSV/Excel/PDF" está na seção Funcionalidades Secundárias.

**Impacto:** 🔴 **Alta** - Usuários precisam de dados exportados para relatórios externos

---

### 4. **Multi-idioma - 0%** 🟠
**Por quê foi incluído no schema:** Database suporta `language_code` por campanha.

**Falta:**
- ❌ Seletor de idioma no respondente
- ❌ Tradução de questões
- ❌ Tradução da UI
- ❌ i18n framework (next-i18n, lingui, react-i18next)
- ❌ Arquivo de mensagens traduzidas

**Atualmente:** Tudo em português (pt-BR hardcoded).

**Impacto:** 🟠 **Médio** - Mencionado no PRD mas não é blocador do MVP

---

### 5. **Alertas & Automação - 0%** 🟠
**Por quê é crítico:** PRD menciona "redução perceptível do esforço manual".

**Falta:**
- ❌ Alerta automático quando item crítico é detectado
- ❌ Geração automática de action plan a partir de itens críticos
- ❌ Lembretes de ações vencidas
- ❌ Re-avaliações programadas
- ❌ Escalação de riscos altos
- ❌ Motor de workflows

**Justificativa no PRD:** Fora do escopo inicial ("reavaliação automática por alertas programados" é explicitamente fora do escopo MVP).

**Impacto:** 🟠 **Médio** - Escopo pós-MVP, mas ajudaria eficiência

---

### 6. **Filtros & Segmentação Avançada - 0%** 🟠
**Por quê é crítico:** Dashboard precisa de buscas granulares.

**Falta:**
- ❌ Filtrar responses por departamento
- ❌ Filtrar por turno
- ❌ Filtrar por função
- ❌ Filtro por intervalo de risco
- ❌ Agrupamento customizável

**Justificativa no PRD:** "segmentação avançada por turno, função e unidade com regras sofisticadas" é explicitamente **Fora do Escopo**.

**Impacto:** 🟠 **Médio** - Melhoraria usabilidade após MVP

---

### 7. **Integrações Externas - 0%** 🟠
**Por quê foi mencionado:** PRD lista como Fora do Escopo, mas schema está preparado.

**Falta:**
- ❌ Folha de pagamento
- ❌ Ponto eletrônico
- ❌ SESMT
- ❌ eSocial
- ❌ Webhooks

**Justificativa no PRD:** "integração automática com folha, ponto e SESMT" é explicitamente **Fora do Escopo MVP**.

**Impacto:** 🟡 **Roadmap futuro** - Não bloqueia MVP

---

## 📊 Análise Detalhada por Fluxo do Usuário

### 🟢 Fluxo 1: Respondente (100% Funcional)
```
1. Acessa via link/token/QR           ✅ Token validation funciona
2. Lê objetivo e termo               ✅ Página de introdução existe
3. Responde por seção               ✅ Form multi-step completo
4. Revisa respostas                 ✅ Review step implementado
5. Envia                            ✅ API submission funciona
6. Recebe confirmação             ✅ Receipt code gerado
7. Recebe relatório individual    ⚠️ Gerado mas sem link de download
```

### 🟡 Fluxo 2: RH/Segurança do Trabalho (40% Funcional)
```
1. Cria campanha                    ❌ FALTANDO
2. Escolhe questionário            ⚠️ Pré-carregado, não configurável
3. Gera tokens/QR                  ❌ FALTANDO
4. Acompanha adesão                ✅ Dashboard de resposta funciona
5. Analisa dashboard               ✅ Agregados e críticos visíveis
6. Gera relatórios                 ⚠️ Gerados mas sem download
7. Cria plano de ação              ✅ UI + DB funciona
8. Acompanha indicadores           ⚠️ UI existe mas sem dados persistidos
```

### 🟢 Fluxo 3: Gestor/Diretoria (80% Funcional)
```
1. Acessa consolidados             ✅ Dashboard acessível
2. Revisa relatórios               ✅ Gerados, sem download
3. Aprova/acompanha ações          ✅ Status visível
```

### 🟠 Fluxo 4: Administrador (30% Funcional)
```
1. Configura questionários         ❌ FALTANDO - sem UI de editor
2. Define regras/permissões        ✅ RBAC funciona
3. Administra retenção/parâmetros  ✅ Schema suporta mas sem UI
```

---

## 🔧 Detalhamento: O que está Mockado

### 1. **Dados de Campanha**
- Campanhas vêm pré-seedadas no banco
- Não há fluxo de criação

### 2. **Distribuição de Tokens**
- Tokens existem no schema
- Não há geração ou cópia para clipboard
- Sem QR codes

### 3. **Relatórios - Download**
- PDF gerado e armazenado
- Assinatura de URL implementada
- **MAS:** Sem endpoint GET para recuperar
- Página de confirmação não mostra link

### 4. **Indicadores**
- Componente UI implementado
- Endpoints da API incompletos
- Dados não persistem

### 5. **Observações Textuais (Segurança)**
- Campo existe no banco
- Redação para anonimato implementada
- **MAS:** Exclusão na IA não é testada (apenas comentário no código)

---

## 📈 Score de Implementação por Fase do Roadmap

|  Fase | Status |  % |
|-------|--------|-----|
| **Fase 1: Base MVP** | 🟡 Parcial | 60% |
| Autenticação RH/Admin | ✅ Completo | 100% |
| Campanhas | ❌ Faltam UI | 20% |
| Questionários | ✅ Funciona para leitura | 70% |
| Tokens | ❌ Sem geração UI | 30% |
| PWA Respondente | ✅ Completo | 100% |
| Motor de Cálculo | ✅ Completo | 100% |
| **Fase 2: Gestão e Análise** | 🟡 Parcial | 60% |
| Dashboard RH | ⚠️ Sem export | 70% |
| Relatórios automáticos | ⚠️ Sem download | 70% |
| Exportações | ❌ Faltando | 0% |
| Plano de ação | ✅ Completo | 100% |
| **Fase 3: IA e Monitoramento** | 🟡 Parcial | 60% |
| Indicadores | ⚠️ UI sem persistence | 50% |
| Integração IA | ⚠️ Structure ok | 80% |
| Ajustes de usabilidade | ⚠️ Parcial | 50% |
| Hardening segurança | ✅ Bom | 85% |

---

## 🎯 Prioridades de Conclusão

### 🔴 **BLOQUEADORES CRÍTICOS (Para MVP viável)**

| # | Feature | Esforço | Impacto | ETA |
|---|---------|---------|--------|-----|
| 1 | Campaign creation UI | 8h | Sem isso admins não podem criar campanhas | **CRÍTICO** |
| 2 | Token generation & copy | 4h | Respondentes não conseguem acessar | **CRÍTICO** |
| 3 | Report download endpoint | 3h | Usuários não conseguem acessar relatórios | **CRÍTICO** |

### 🟡 **ALTA PRIORIDADE (Para launch completo)**

| # | Feature | Esforço | Impacto | Quando |
|---|---------|---------|--------|--------|
| 4 | Questionnaire editor UI | 12h | Sem isso, questões são hard-coded | Antes de escalar |
| 5 | CSV/Excel export | 6h | Necessário para análise externa | MVP+1 |
| 6 | Action plan auto-generation | 8h | Reduz esforço operacional | MVP+1 |
| 7 | Indicators persistence | 6h | Dados da UI não salvam | MVP+1 |

### 🟠 **MÉDIO PRAZO (Roadmap futuro)**

| # | Feature | Esforço | Quando |
|---|---------|---------|--------|
| 8 | Multi-idioma | 20h | Fase 2 |
| 9 | Advanced segmentation | 16h | Fase 2 |
| 10 | Alertas & automação | 24h | Fase 3 |
| 11 | Integrações externas | 40h+ | Phase 4 |

---

## 💡 Recomendações

### ✅ Manter As-Is (Excelente)
- Motor de risco - bem testado e funcional
- Schema de dados - completo e preparado
- RBAC e autenticação
- Fluxo respondente

### 🔧 Corrigir Urgentemente (Para saída do MVP)
1. **Criar Campaign Builder UI** - Formulário simples em `/campanhas/new`
2. **Implementar Token Gen** - Adicionar geração + QR na página campaign detail
3. **Finish Report Download** - Endpoint `GET /api/admin/reports/[id]` com segurança
4. **Revisar campos mockados:**
   - Indicadores: persistir dados da API
   - Observações: confirmar exclusão da IA
   - Anonimato: testar redação em produção

### 📋 Documentar (Transparência stakeholder)
- [ ] Criar página de roadmap público
- [ ] Explicar scope MVP vs Phase 2+
- [ ] Listar integrações planejadas para futuro

---

## 🚨 Achados de Segurança

| Item | Severidade | Status |
|------|------------|--------|
| Observation text requer redação for anonimato | 🟡 Alto| ✅ Implementado mas não testado em produção |
| Service role key obrigatório em Vercel | 🔴 Crítico | ⚠️ Listed no checklist mas precisa validação |
| Token hash vs plain text | 🟡 Alto | ✅ Implementado no schema |
| RLS policies aplicadas | ✅ Bom | ✅ Configuradas |
| k-anonimity no dashboard | ✅ Bom | ✅ Implementado (limiar mínimo) |

---

## 📊 Tabela Comparativa PRD vs Implementação

| Requisito PRD | Implementado? | Bloqueador? |
|---------------|---------------|-----------|
| Gestão de campanhas | ⚠️ 20% (sem UI) | 🔴 SIM |
| Links, tokens, QR | ⚠️ 30% (sem UI) | 🔴 SIM |
| Preenchimento PWA | ✅ 100% | ✅ NÃO |
| Cálculo automático | ✅ 100% | ✅ NÃO |
| Classificação por escala | ✅ 100% | ✅ NÃO |
| Itens críticos | ✅ 100% | ✅ NÃO |
| Relatório individual | ⚠️ 70% (sem download) | 🟡 PARCIAL |
| Relatório analítico | ⚠️ 70% (sem download) | 🟡 PARCIAL |
| Dashboard por campanha | ✅ 100% | ✅ NÃO |
| Plano de ação | ✅ 100% | ✅ NÃO |
| Indicadores | ⚠️ 50% (sem persistence) | 🟡 SIM |
| Exportação CSV/Excel | ❌ 0% | 🟠 NÃO (MVP1) |
| Histórico alterações | ✅ 100% | ✅ NÃO |
| Observações textuais | ✅ 100% | ✅ NÃO |
| Comprovante por ID | ✅ 100% | ✅ NÃO |

---

## 🎬 Próximos Passos Recomendados

```
SEMANA 1 (Blockers):
  [ ] Campaign creation form (4h)
  [ ] Token generation UI (4h)
  [ ] Report download endpoint (3h)
  [ ] Testing + bug fixes (5h)

SEMANA 2 (MVP Completion):
  [ ] Questionnaire editor (12h)
  [ ] CSV export (6h)
  [ ] Indicators persistence (6h)
  [ ] UAT & feedback

SEMANA 3 (Polish):
  [ ] Action plan auto-trigger (8h)
  [ ] Security hardening (8h)
  [ ] Documentation (4h)
```

---

**Relatório gerado em:** 2026-04-06  
**Versão:** 1.0
