# 🛠️ Plano de Ação - Completar MVP

**Status:** Em Execução  
**Prioridade:** 🔴 CRÍTICO → 🟡 ALTO → 🟠 MÉDIO

---

## 🔴 FASE 1: Desbloqueadores Críticos (48h)

### Task 1.1: Campaign Creation UI
**Bloqueador:** Admins não conseguem criar campanhas sem isso

**O que falta:**
- [ ] Página `/campanhas/new` com formulário
- [ ] Campos: nome, descrição, questionário, data início/fim, setor, unidade
- [ ] POST /api/admin/campaigns endpoint (existe GET, falta POST)
- [ ] Validação de datas (data fim > data início)
- [ ] Confirmação + redirecionamento para campaign detail

**Arquivos a criar/modificar:**
- `src/app/campanhas/new/page.tsx` (NOVO)
- `src/app/api/admin/campaigns/route.ts` (MODIFICAR - adicionar POST)
- `src/lib/server/repositories/campaign-repository.ts` (VERIFICAR métodos create)

**Esforço:** 4-5 horas  
**Testes:** Tentar criar campanha, validar no DB

---

### Task 1.2: Token Generation & Display
**Bloqueador:** Respondentes não conseguem acessar survey

**O que falta:**
```typescript
// Deve existir em campaign detail page:
- Botão "Gerar Tokens" (1, 5, 10, 50, 100, custom)
- Copiar para clipboard (Icon com tooltip)
- QR Code display
- Link de test/preview
- Download CSV com tokens + links
```

**Arquivos a criar/modificar:**
- `src/app/campanhas/[id]/page.tsx` (ADICIONAR section de token generation)
- `src/components/portal/token-generator.tsx` (NOVO)
- `src/lib/server/services/token-service.ts` (NOVO)
  - Métodos: generateTokens(), generateQRCode()
  - Usar: `qrcode` NPM library (99% libs já tem)

**Esforço:** 3-4 horas  
**Dependência:** Task 1.1 (precisa campaign estar criada)

---

### Task 1.3: Report Download Endpoint
**Bloqueador:** Relatórios não são recuperáveis pelos usuários

**O que falta:**
```typescript
// GET /api/admin/reports/[reportId]/download
- Validar permissão do usuário (RBAC)
- Recuperar arquivo de storage
- Servir com headers corretos (Content-Type: application/pdf)
- Logging de auditoria (quem baixou o quê, quando)
```

**Arquivos a criar/modificar:**
- `src/app/api/admin/reports/[id]/download/route.ts` (NOVO)
- `src/lib/server/repositories/reports-repository.ts` (VERIFICAR métodos get)
- `src/app/obrigado/[receiptCode]/page.tsx` (ADICIONAR link real ao PDF)

**Esforço:** 2-3 horas  
**Validação:** Clicar em relatório, baixar PDF, abrir no leitor

---

## 🟡 FASE 2: Completar MVP (72h)

### Task 2.1: Questionnaire Editor UI
**Impacto:** Sem isso, questionários são hardcoded e imutáveis

**O que falta:**
- [ ] Página `/admin/questionarios/new` e `/admin/questionarios/[id]/edit`
- [ ] CRUD para sections (add, edit order, delete)
- [ ] CRUD para questions (add, edit, delete, reorder)
- [ ] Preview ao vivo
- [ ] Validação (mínimo 1 section, 1 question por section)
- [ ] Versionamento (publicar = criar nova versão)

**Arquivos a criar/modificar:**
- `src/app/admin/questionarios/new/page.tsx` (NOVO)
- `src/components/admin/questionnaire-editor.tsx` (NOVO)
- `src/app/api/admin/questionnaires/route.ts` (VERIFICAR CRUD)

**Esforço:** 10-12 horas  
**Validação:** Criar question, usá-la em campaign, responder

---

### Task 2.2: CSV/Excel Export
**Impacto:** Usuários RH precisam exportar dados para análises

**O que falta:**
```typescript
// GET /api/admin/campaigns/[id]/export?format=csv|xlsx
- Exportar responses + scores + metadata
- Incluir: respondent_id, section, question, answer, risk_score
- Anonimizar se necessário
- Usar: `papaparse` (CSV) + `exceljs` (XLSX)
```

**Arquivos a criar/modificar:**
- `src/app/api/admin/campaigns/[id]/export/route.ts` (NOVO)
- `src/lib/server/services/export-service.ts` (NOVO)
- UI: Button ou dropdown em campaign detail

**Esforço:** 4-6 horas  
**Validação:** Exportar, abrir em Excel, validar dados

---

### Task 2.3: Indicadores - Persistence
**Impacto:** Dados de indicadores não estão sendo salvos

**O que falta:**
```typescript
// Endpoints:
- POST /api/admin/indicators (create)
- PUT /api/admin/indicators/[id] (update)
- GET /api/admin/indicators?campaignId=X (list with filters)

// UI deve chamar esses endpoints após edit
```

**Arquivos a modificar:**
- `src/app/api/admin/indicators/route.ts` (IMPLEMENTAR POST/PUT completo)
- `src/components/portal/indicators-manager.tsx` (ADICIONAR mutations)
- Testar com Supabase

**Esforço:** 4-5 horas  
**Validação:** Criar indicador, recarregar página, dado ainda lá

---

### Task 2.4: Action Plan Auto-Generation
**Impacto:** Reduz esforço RH na criação de planos

**O que falta:**
```typescript
// Quando submissão é processada e há item crítico:
- Verificar se já existe action_plan aberto para esse item
- Se não, criar um com status='open'
- Popultar com sugestão de ação (texto default ou da IA)
- Notificar RH
```

**Arquivos a modificar:**
- `src/lib/server/services/submission-service.ts` (ADICIONAR lógica após risco calculado)
- `src/lib/server/services/action-plan-service.ts` (VERIFICAR creat method)
- Testar risco crítico trigga auto-action

**Esforço:** 3-4 horas  
**Validação:** Submissão com resposta crítico, action plan criado automaticamente

---

## 🟠 FASE 3: Polimento (Pós-MVP)

### Task 3.1: Multi-idioma Support
**Impacto:** Campanha pode rodar em português, espanhol, inglês

**O que falta:**
```typescript
// Setup:
- Instalar next-intl ou i18next
- Criar arquivos: locales/pt.json, locales/es.json, etc
- Middleware para routing: /pt/responder, /es/responder
- UI selector in campaign creation

// Tradução de questionários:
- Campo translations na table questionnaires
- Formato: { "pt": "pergunta em PT", "es": "pregunta en ES" }
```

**Esforço:** 16-20 horas (includes setup, extraction, UI)  
**Roadmap:** Pós-MVP1, antes de escalar internacional

---

### Task 3.2: Advanced Segmentation & Filters
**Impacto:** Dashboard muito mais poderoso para análises

**Campos a filtrar:**
- Departamento
- Turno
- Função
- Intervalo de risco
- Data de resposta

**Arquivos a modificar:**
- `src/app/campanhas/[id]/page.tsx` (ADICIONAR filter UI)
- `src/lib/server/repositories/analytics-repository.ts` (adicionar filtered queries)

**Esforço:** 8-10 horas  
**Roadmap:** Fase 2

---

### Task 3.3: Alertas & Automação
**Impacto:** RH é notificado de eventos críticos

**Eventos:**
- Item crítico detectado → Email alert
- Ação vencida → Email + Dashboard alert
- Taxa de resposta baixa → Email reminder
- Risco aumentou vs período anterior → Alert

**Setup:**
- Email service (SendGrid, Resend)
- Background job service (Bull, Agenda)
- Notification table + UI

**Esforço:** 20-24 horas  
**Roadmap:** Fase 3

---

## 🧪 Testes Validação por Feature

### ✅ Campaign Creation
```bash
# Test:
1. Criar campanha com dados válidos
2. Verificar no DB que foi criada
3. Tentar duplicar nome (deve falhar)
4. Tentar data fim < data início (deve falhar)
5. Cancelar création, voltar sem salvar
```

### ✅ Token Generation
```bash
# Test:
1. Gerar 5 tokens
2. Copiar para clipboard
3. Abrir link em incógnito, acessar survey
4. Verificar QR code é válido (scan)
5. Exportar CSV, abrir em Excel
```

### ✅ Report Download
```bash
# Test:
1. Completar survey
2. Ir para receipt code page
3. Clicar em "Download Report"
4. Verificar PDF baixa
5. Tentar acessar outro usuário (deve ser bloqueado)
```

### ✅ Questionnaire Editor
```bash
# Test:
1. Criar nova question
2. Adicionar 3 sections
3. Preview deve mostrar tudo
4. Publicar (create version)
5. Usar em nova campaign, responder
```

### ✅ Indicadores
```bash
# Test:
1. Criar novo indicador
2. Recarregar página
3. Indicador ainda há (não foi deletado)
4. Editar valor
5. Histórico de mudancas visível
```

---

## 📋 Checklist de Implementação

### Priority 1 (Semana 1)
- [ ] Campaign creation form + POST endpoint
- [ ] Token generation UI + service
- [ ] Report download endpoint + frontend link
- [ ] End-to-end test (criar campaign → gerar token → responder → baixar relatório)

### Priority 2 (Semana 2)
- [ ] Questionnaire editor (sections + questions)
- [ ] CSV/Excel export
- [ ] Indicadores persistence in API
- [ ] Fix observation_text redaction in IA

### Priority 3 (Semana 3)
- [ ] Action plan auto-generation
- [ ] Audit trail UI (historico ações)
- [ ] Security hardening review
- [ ] Documentation update

### Nice to Have (Post-MVP)
- [ ] Multi-idioma
- [ ] Advanced filters
- [ ] Alertas & emails
- [ ] Integracoes externas

---

## 📝 Notas Técnicas

### Dependencies que Provavelmente Faltam
```bash
npm install qrcode exceljs papaparse nodemailer
```

### Key Files for Reference
- `src/lib/server/repositories/` - Data access patterns
- `src/lib/server/services/` - Business logic patterns
- `src/app/api/admin/` - Endpoint patterns
- Migrations em `supabase/migrations/` - Schema reference

### DB Queries Reference
```sql
-- Check campaign exists
SELECT * FROM campaigns WHERE id = X LIMIT 1;

-- Check tokens generated
SELECT COUNT(*) FROM respondent_tokens WHERE campaign_id = X;

-- Check submissions for campaign
SELECT * FROM submissions WHERE campaign_id = X;

-- Check reports generated
SELECT * FROM generated_reports WHERE campaign_id = X;
```

---

## ⏱️ Timeline Estimado

| Fase | Duração | Features |
|------|---------|----------|
| 🔴 Bloqueadores | 48h | Campaign create, Token gen, Report download |
| 🟡 MVP Complete | 72h | Questionnaire editor, Export, Indicadores, Auto-actions |
| 🟠 Polimento | 40h | Multi-lang, Filters, Alerts, Docs |
| **TOTAL MVP** | **160h** | **All PRD features** |

---

**Última atualização:** 2026-04-06
