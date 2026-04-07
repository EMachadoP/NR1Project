# 🚀 Plano de Ação - Codex NR-1 MVP Completion

**Data:** Abril 6, 2026  
**Status:** Em Execução  
**Prioridade:** 🔴 CRÍTICO → 🟡 ALTO → 🟠 MÉDIO

---

## 📊 Resumo dos Findings

| Severidade | Finding | Status Atual | Impacto |
|------------|---------|--------------|---------|
| 🔴 **CRÍTICO** | Campaign Creation | 0% - Só lista, sem UI/form | Admins não conseguem criar campanhas |
| 🔴 **CRÍTICO** | Token/QR Generation | 0% - Stub endpoint | Respondentes não acessam surveys |
| 🟡 **ALTO** | Questionnaire Management | 0% - Read-only | Questionários hardcoded/imutáveis |
| 🟠 **MÉDIO** | Report Download UI | 70% - Backend ok, UI falta | Relatórios não recuperáveis |

---

## 🔴 FASE 1: RESOLVER BLOQUEADORES CRÍTICOS (48h)

### 🎯 **Task 1.1: Campaign Creation UI + Backend**
**Severidade:** 🔴 CRÍTICO  
**Esforço:** 8h  
**Responsável:** Codex Frontend + Backend  
**Dependências:** Nenhuma

#### **Problema Atual:**
- `/campanhas` só lista cards (sem CTA "Criar Nova")
- `/api/admin/campaigns` só tem GET
- Sem formulário de criação

#### **Passos Detalhados:**

**1.1.1 Criar Página de Criação (2h)**
```bash
# Arquivo: src/app/campanhas/new/page.tsx (NOVO)
- Criar form com campos obrigatórios:
  - name (text, required)
  - description (textarea)
  - questionnaire_id (select dropdown)
  - start_date (date picker)
  - end_date (date picker)
  - sector (text)
  - unit (text)
- Validação: end_date > start_date
- Botão "Criar Campanha" chama API
- Cancelar volta para /campanhas
```

**1.1.2 Implementar POST Endpoint (3h)**
```bash
# Arquivo: src/app/api/admin/campaigns/route.ts (MODIFICAR)
- Adicionar método POST
- Validar campos obrigatórios
- Inserir no banco via repository
- Retornar campaign criada
- Tratamento de erro (nome duplicado, etc.)
```

**1.1.3 Adicionar CTA na Lista (1h)**
```bash
# Arquivo: src/app/campanhas/page.tsx (MODIFICAR)
- Adicionar botão "Nova Campanha" no topo
- Link para /campanhas/new
- Verificar permissão admin
```

**1.1.4 Testes e Validação (2h)**
```bash
# Testes manuais:
1. Clicar "Nova Campanha"
2. Preencher form válido → deve criar
3. Preencher form inválido → deve mostrar erros
4. Verificar no DB que foi inserido
5. Verificar na lista que aparece
```

#### **Critérios de Aceitação:**
- ✅ Formulário acessível via botão "Nova Campanha"
- ✅ Validação de campos obrigatórios
- ✅ Validação de datas (fim > início)
- ✅ Campanha criada aparece na lista
- ✅ Erro tratado para nomes duplicados

---

### 🎯 **Task 1.2: Token & QR Generation**
**Severidade:** 🔴 CRÍTICO  
**Esforço:** 6h  
**Responsável:** Codex Backend + Frontend  
**Dependências:** Task 1.1 (precisa campaign existir)

#### **Problema Atual:**
- `/api/admin/campaigns/[id]/tokens` retorna mensagem fixa
- Não gera tokens reais
- Não cria QR codes
- Não persiste no banco

#### **Passos Detalhados:**

**1.2.1 Implementar Token Service (2h)**
```bash
# Arquivo: src/lib/server/services/token-service.ts (NOVO)
- Método generateTokens(campaignId, count)
- Gerar tokens únicos (UUID + hash)
- Inserir em respondent_tokens table
- Retornar array de tokens + URLs
```

**1.2.2 Implementar QR Code Generation (1h)**
```bash
# Instalar: npm install qrcode
# Arquivo: src/lib/server/services/qr-service.ts (NOVO)
- Método generateQR(url) → base64 image
- Usar qrcode.toDataURL()
```

**1.2.3 Atualizar Endpoint (2h)**
```bash
# Arquivo: src/app/api/admin/campaigns/[id]/tokens/route.ts (MODIFICAR)
- Remover mensagem stub
- Implementar POST /api/admin/campaigns/[id]/tokens
- Parâmetros: count (1-1000)
- Chamar token-service.generateTokens()
- Retornar: tokens[], qrCodes[], csvUrl
```

**1.2.4 UI de Geração (1h)**
```bash
# Arquivo: src/app/campanhas/[id]/page.tsx (MODIFICAR)
- Adicionar seção "Geração de Tokens"
- Input: quantidade (1, 5, 10, 50, 100, custom)
- Botão "Gerar Tokens"
- Mostrar lista de tokens gerados
- Botão "Copiar para Clipboard"
- QR codes display
- Download CSV
```

#### **Critérios de Aceitação:**
- ✅ Endpoint gera tokens reais no banco
- ✅ QR codes funcionais (scan abre survey)
- ✅ Tokens únicos e válidos
- ✅ UI mostra tokens + QR + copy
- ✅ CSV download funciona

---

## 🟡 FASE 2: RESOLVER ISSUES ALTAS (32h)

### 🎯 **Task 2.1: Questionnaire Management System**
**Severidade:** 🟡 ALTO  
**Esforço:** 16h  
**Responsável:** Codex Fullstack  
**Dependências:** Nenhuma

#### **Problema Atual:**
- Só leitura do questionário ativo
- Endpoints são placeholders textuais
- Sem CRUD real

#### **Passos Detalhados:**

**2.1.1 Criar Questionnaire Editor UI (6h)**
```bash
# Arquivo: src/app/admin/questionarios/new/page.tsx (NOVO)
- Form para criar questionário
- Campos: title, description, version
- Botão "Adicionar Seção"

# Arquivo: src/components/admin/questionnaire-editor.tsx (NOVO)
- Drag & drop para reordenar sections
- Para cada section: title, description, questions[]
- Para cada question: text, type, scoring_direction, weight
- Preview ao vivo
- Validação: mínimo 1 section, 1 question/section
```

**2.1.2 Implementar CRUD Endpoints (6h)**
```bash
# Arquivo: src/app/api/admin/questionnaires/route.ts (MODIFICAR)
- POST: criar questionário
- GET: listar todos

# Arquivo: src/app/api/admin/questionnaires/[id]/route.ts (MODIFICAR)
- GET: buscar por ID
- PUT: atualizar
- DELETE: deletar (se não usado em campanhas)

# Arquivo: src/app/api/admin/questionnaires/[id]/publish/route.ts (NOVO)
- POST: publicar versão (criar nova versão)
```

**2.1.3 Versionamento (2h)**
```bash
# Arquivo: src/lib/server/repositories/questionnaire-repository.ts (MODIFICAR)
- Adicionar version field
- Método publish() cria nova versão
- Método getActive() retorna versão ativa
```

**2.1.4 UI de Listagem e Edição (2h)**
```bash
# Arquivo: src/app/admin/questionarios/page.tsx (NOVO)
- Listar todos questionários
- Status: draft/active/archived
- Botões: Edit, Publish, Duplicate
- Link para /admin/questionarios/new
```

#### **Critérios de Aceitação:**
- ✅ Criar questionário do zero
- ✅ Adicionar/editar sections e questions
- ✅ Preview funciona
- ✅ Publicar cria nova versão
- ✅ Campanhas usam versão ativa
- ✅ Validação impede questionários vazios

---

## 🟠 FASE 3: RESOLVER ISSUES MÉDIAS (16h)

### 🎯 **Task 3.1: Report Download UI Integration**
**Severidade:** 🟠 MÉDIO  
**Esforço:** 4h  
**Responsável:** Codex Frontend  
**Dependências:** Nenhuma (backend já existe)

#### **Problema Atual:**
- Backend gera signedUrl corretamente
- UI não consome o endpoint
- Relatórios não são recuperáveis

#### **Passos Detalhados:**

**3.1.1 Integrar Download no Receipt (2h)**
```bash
# Arquivo: src/app/obrigado/[receiptCode]/page.tsx (MODIFICAR)
- Após mostrar receipt code
- Adicionar botão "Download Relatório Individual"
- Chamar GET /api/admin/reports/[reportId]/download
- Download direto no browser
- Loading state + error handling
```

**3.1.2 Adicionar Download no Dashboard RH (2h)**
```bash
# Arquivo: src/app/campanhas/[id]/page.tsx (MODIFICAR)
- Na seção de relatórios
- Botão "Download Relatório Analítico"
- Chamar endpoint de geração + download
- Progress indicator para geração
- Link para download quando pronto
```

#### **Critérios de Aceitação:**
- ✅ Receipt page tem botão download
- ✅ Download funciona (PDF abre)
- ✅ Dashboard tem download analítico
- ✅ Error handling (relatório não existe)
- ✅ Segurança (só usuários autorizados)

---

## 📋 Timeline e Dependências

### **Semana 1 (24h)**
- [ ] Task 1.1: Campaign Creation (8h)
- [ ] Task 1.2: Token Generation (6h)
- [ ] Task 3.1: Report Download UI (4h)
- [ ] **Milestone:** MVP funcional básico

### **Semana 2 (24h)**
- [ ] Task 2.1: Questionnaire Management (16h)
- [ ] **Milestone:** MVP completo

### **Semana 3 (16h)**
- [ ] Testes end-to-end
- [ ] Bug fixes
- [ ] Documentação
- [ ] **Milestone:** Ready for deploy

---

## 🧪 Plano de Testes

### **Teste 1: Fluxo Completo Campaign → Token → Survey**
```bash
1. Admin cria campanha (Task 1.1)
2. Admin gera tokens (Task 1.2)
3. Copia token/link
4. Abre em incógnito, responde survey
5. Recebe receipt, baixa relatório (Task 3.1)
6. Admin vê resposta no dashboard
```

### **Teste 2: Questionnaire Management**
```bash
1. Criar questionário (Task 2.1)
2. Adicionar sections/questions
3. Publicar versão
4. Criar campanha com esse questionário
5. Responder, verificar se aparece
```

### **Teste 3: Segurança e RBAC**
```bash
1. User HR tenta criar campanha → deve falhar
2. User admin acessa questionnaire editor → deve funcionar
3. User anon tenta baixar relatório → deve falhar
4. Token expirado → deve bloquear acesso
```

---

## 📁 Arquivos a Modificar/Criar

### **Novos Arquivos (10):**
- `src/app/campanhas/new/page.tsx`
- `src/app/admin/questionarios/new/page.tsx`
- `src/app/admin/questionarios/page.tsx`
- `src/components/admin/questionnaire-editor.tsx`
- `src/lib/server/services/token-service.ts`
- `src/lib/server/services/qr-service.ts`
- `src/app/api/admin/campaigns/[id]/tokens/route.ts`
- `src/app/api/admin/questionnaires/[id]/publish/route.ts`
- `src/app/api/admin/questionnaires/[id]/route.ts`
- `src/app/api/admin/questionnaires/route.ts`

### **Arquivos a Modificar (8):**
- `src/app/campanhas/page.tsx`
- `src/app/campanhas/[id]/page.tsx`
- `src/app/obrigado/[receiptCode]/page.tsx`
- `src/app/api/admin/campaigns/route.ts`
- `src/lib/server/repositories/questionnaire-repository.ts`
- `src/app/questionarios/page.tsx`
- `src/app/api/admin/questionnaires/route.ts`
- `src/app/api/admin/questionnaires/[id]/route.ts`

---

## ⚠️ Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Endpoint quebra schema existente | Médio | Alto | Testar migrations primeiro |
| QR code library não funciona | Baixo | Médio | Fallback para texto + manual scan |
| Questionnaire versioning complexo | Médio | Médio | Começar simples, evoluir depois |
| UI quebra em mobile | Baixo | Médio | Testar em dispositivos reais |

---

## 📊 Métricas de Sucesso

### **Após Task 1.1 + 1.2:**
- ✅ Admin consegue criar campanha
- ✅ Admin consegue gerar tokens/QR
- ✅ Respondente consegue acessar survey
- ✅ MVP básico funcional

### **Após Task 2.1:**
- ✅ Admin consegue criar/editar questionários
- ✅ Questionários não são mais hardcoded
- ✅ Versionamento funciona

### **Após Task 3.1:**
- ✅ Relatórios são recuperáveis
- ✅ Fluxo completo funciona
- ✅ MVP 100% funcional

---

## 🎯 Critérios de Done por Task

### **Task 1.1: Campaign Creation**
- [ ] Form acessível via CTA
- [ ] Validação client + server
- [ ] Campanha criada no DB
- [ ] Aparece na lista
- [ ] Testado com dados válidos/inválidos

### **Task 1.2: Token Generation**
- [ ] Endpoint gera tokens reais
- [ ] QR codes scaneáveis
- [ ] UI mostra tokens + copy
- [ ] CSV export funciona
- [ ] Tokens únicos e válidos

### **Task 2.1: Questionnaire Management**
- [ ] CRUD completo UI + backend
- [ ] Versionamento implementado
- [ ] Preview funciona
- [ ] Validações aplicadas
- [ ] Integração com campaigns

### **Task 3.1: Report Download**
- [ ] Receipt tem botão download
- [ ] Download funciona no browser
- [ ] Dashboard tem download analítico
- [ ] Segurança aplicada
- [ ] Error handling

---

**Total Esforço:** 52h  
**Duração:** 3 semanas  
**Equipe:** 1-2 devs fullstack  
**Data Início:** Imediata  
**Data Fim Estimada:** Abril 27, 2026

---

**Responsável pela Execução:** Codex Team  
**Aprovação:** ✅  
**Última Atualização:** 2026-04-06