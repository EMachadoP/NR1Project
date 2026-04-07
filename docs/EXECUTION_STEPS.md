# 📋 Plano de Execução - Codex NR-1 MVP Completion

**Status:** Em Execução  
**Prioridade:** 🔴 CRÍTICO → 🟡 ALTO → 🟠 MÉDIO

---

## 🔴 FASE 1: RESOLVER BLOQUEADORES CRÍTICOS

### 🎯 **TASK 1.1: IMPLEMENTAR CRIAÇÃO DE CAMPANHAS**

#### **Frontend - Página de Criação**
```bash
# CRIAR: src/app/campanhas/new/page.tsx
- Formulário com campos obrigatórios:
  • name (input text, required)
  • description (textarea)
  • questionnaire_id (select dropdown - buscar questionários ativos)
  • start_date (input date)
  • end_date (input date)
  • sector (input text)
  • unit (input text)
- Validação: end_date deve ser posterior a start_date
- Botão "Criar Campanha" que chama POST /api/admin/campaigns
- Botão "Cancelar" que volta para /campanhas
- Tratamento de erros (exibir mensagens de validação)
```

#### **Backend - POST Endpoint**
```bash
# MODIFICAR: src/app/api/admin/campaigns/route.ts
- Adicionar método POST
- Validar campos obrigatórios no body
- Validar que questionário existe e está ativo
- Inserir nova campanha no banco via repository
- Retornar { success: true, campaign: {...} }
- Tratamento de erros:
  • Nome duplicado
  • Questionário inexistente
  • Datas inválidas
```

#### **Frontend - CTA na Lista**
```bash
# MODIFICAR: src/app/campanhas/page.tsx
- Adicionar botão "Nova Campanha" no topo da página
- Link para /campanhas/new
- Verificar se usuário tem role 'admin' para mostrar o botão
- Estilo consistente com o resto da UI
```

#### **Critérios de Aceitação:**
- ✅ Formulário acessível via botão "Nova Campanha"
- ✅ Todos os campos obrigatórios validados
- ✅ Validação de datas (fim > início)
- ✅ Campanha criada aparece na lista de campanhas
- ✅ Erro tratado para nomes duplicados ou questionários inválidos

---

### 🎯 **TASK 1.2: IMPLEMENTAR GERAÇÃO DE TOKENS E QR**

#### **Backend - Token Service**
```bash
# CRIAR: src/lib/server/services/token-service.ts
- Método generateTokens(campaignId: string, count: number)
- Para cada token:
  • Gerar UUID único
  • Criar hash SHA-256 do UUID + salt
  • Inserir em respondent_tokens table:
    • token_hash
    • campaign_id
    • expires_at (7 dias a partir de agora)
    • created_at
- Retornar array de objetos: { token: string, url: string }
```

#### **Backend - QR Service**
```bash
# CRIAR: src/lib/server/services/qr-service.ts
# DEPENDÊNCIA: npm install qrcode

- Método generateQR(url: string): Promise<string>
- Usar qrcode.toDataURL(url, { width: 256 })
- Retornar data URL base64 da imagem
```

#### **Backend - Endpoint de Geração**
```bash
# MODIFICAR: src/app/api/admin/campaigns/[id]/tokens/route.ts
- Remover implementação stub (mensagem fixa)
- Implementar POST handler
- Body: { count: number } (1-1000)
- Validar que campaign existe
- Chamar tokenService.generateTokens(campaignId, count)
- Para cada token, gerar QR via qrService.generateQR(token.url)
- Retornar:
  {
    tokens: [{ token, url, qrCode }],
    csvUrl: string (link para download CSV)
  }
```

#### **Frontend - UI de Geração**
```bash
# MODIFICAR: src/app/campanhas/[id]/page.tsx
- Adicionar seção "Geração de Tokens" na página de detalhes
- Input numérico: quantidade (opções: 1, 5, 10, 50, 100, custom)
- Botão "Gerar Tokens" que chama POST /api/admin/campaigns/[id]/tokens
- Após geração, mostrar:
  • Lista de tokens gerados (token + url)
  • QR codes para cada token
  • Botão "Copiar Todos para Clipboard"
  • Link para download CSV com tokens + URLs
- Loading states e tratamento de erros
```

#### **Critérios de Aceitação:**
- ✅ Endpoint gera tokens únicos no banco de dados
- ✅ QR codes são imagens válidas que abrem o survey quando escaneadas
- ✅ Tokens têm expiração de 7 dias
- ✅ UI mostra tokens, QR codes e permite cópia
- ✅ CSV export contém tokens e URLs funcionais

---

### 🎯 **TASK 3.1: INTEGRAR DOWNLOAD DE RELATÓRIOS**

#### **Frontend - Receipt Page Download**
```bash
# MODIFICAR: src/app/obrigado/[receiptCode]/page.tsx
- Após mostrar código de recebimento
- Adicionar botão "Download Relatório Individual"
- Botão chama GET /api/admin/reports/[reportId]/download
- Implementar download direto no browser:
  • fetch(url, { method: 'GET' })
  • Criar blob e download via <a download>
- Estados: loading, success, error
- Tratamento de erro se relatório não existir
```

#### **Frontend - Dashboard Download**
```bash
# MODIFICAR: src/app/campanhas/[id]/page.tsx
- Na seção de relatórios da campanha
- Adicionar botão "Download Relatório Analítico"
- Se relatório existir: download direto
- Se não existir: botão "Gerar Relatório" que:
  • Chama POST /api/admin/reports/[campaignId]
  • Mostra progresso de geração
  • Quando pronto, mostra link de download
- Validação de permissões (só admin/hr)
```

#### **Critérios de Aceitação:**
- ✅ Página de receipt tem botão funcional de download
- ✅ Download abre PDF do relatório individual
- ✅ Dashboard permite download do relatório analítico
- ✅ Tratamento de erros para relatórios inexistentes
- ✅ Validação de segurança (usuário autorizado)

---

## 🟡 FASE 2: IMPLEMENTAR GESTÃO DE QUESTIONÁRIOS

### 🎯 **TASK 2.1: SISTEMA COMPLETO DE QUESTIONÁRIOS**

#### **Frontend - Editor de Questionários**
```bash
# CRIAR: src/app/admin/questionarios/new/page.tsx
- Formulário básico:
  • title (input text, required)
  • description (textarea)
  • version (input text, auto-gerado ou manual)
- Botão "Adicionar Seção"

# CRIAR: src/components/admin/questionnaire-editor.tsx
- Interface drag & drop para reordenar seções
- Para cada seção:
  • title (input)
  • description (textarea)
  • Lista de perguntas (drag & drop)
- Para cada pergunta:
  • text (input)
  • type (select: likert_5, text, etc.)
  • scoring_direction (select: positive/negative)
  • weight (number, default 1.0)
- Botões: Add Section, Add Question, Delete
- Preview ao vivo do questionário
- Validações: mínimo 1 seção, 1 pergunta por seção
```

#### **Backend - CRUD Endpoints**
```bash
# MODIFICAR: src/app/api/admin/questionnaires/route.ts
- POST: criar questionário
  • Body: { title, description, version }
  • Inserir com status 'draft'
  • Retornar questionnaire criado

- GET: listar questionários
  • Query params: status (draft/active/archived)
  • Retornar array de questionnaires

# CRIAR: src/app/api/admin/questionnaires/[id]/route.ts
- GET: buscar questionário por ID
- PUT: atualizar questionário
  • Body: questionnaire completo
  • Validar estrutura
- DELETE: deletar (só se não usado em campanhas)

# CRIAR: src/app/api/admin/questionnaires/[id]/publish/route.ts
- POST: publicar versão
  • Criar nova versão baseada na atual
  • Setar status 'active' para nova versão
  • Setar status 'archived' para versões anteriores
  • Retornar nova versão
```

#### **Backend - Versionamento**
```bash
# MODIFICAR: src/lib/server/repositories/questionnaire-repository.ts
- Adicionar campo version em queries
- Método publish():
  • Buscar questionnaire atual
  • Criar cópia com version incrementada
  • Atualizar status da nova versão para 'active'
  • Arquivar versões anteriores
- Método getActive(): retornar versão com status 'active'
```

#### **Frontend - Listagem e Gestão**
```bash
# CRIAR: src/app/admin/questionarios/page.tsx
- Tabela/lista de questionários
- Colunas: title, version, status, created_at, actions
- Status badges: draft/active/archived
- Botões por linha:
  • Edit (link para editor)
  • Publish (se draft)
  • Duplicate
  • Delete (se não usado)
- Botão "Novo Questionário" no topo
- Filtros por status
```

#### **Integração com Campanhas**
```bash
# MODIFICAR: src/app/campanhas/new/page.tsx
- No select de questionnaire_id
- Buscar apenas questionários com status 'active'
- Mostrar title + version no dropdown
```

#### **Critérios de Aceitação:**
- ✅ Criar questionário do zero via UI
- ✅ Adicionar/editar seções e perguntas
- ✅ Preview do questionário funciona corretamente
- ✅ Publicar cria nova versão ativa
- ✅ Campanhas usam versão ativa do questionário
- ✅ Validações impedem questionários vazios ou inválidos
- ✅ Versionamento preserva histórico

---

## 🧪 TESTES DE VALIDAÇÃO

### **Teste 1: Fluxo Completo MVP**
```
1. Admin cria campanha via /campanhas/new
2. Admin gera tokens via /campanhas/[id] 
3. Copia token/link de um dos tokens gerados
4. Abre link em modo incógnito/incognito
5. Responde ao survey completamente
6. Recebe receipt code e baixa relatório individual
7. Admin vê a resposta no dashboard da campanha
```

### **Teste 2: Gestão de Questionários**
```
1. Criar novo questionário via /admin/questionarios/new
2. Adicionar 2 seções com perguntas
3. Usar preview para verificar aparência
4. Publicar questionário
5. Criar campanha usando esse questionário
6. Verificar se survey mostra as perguntas corretas
```

### **Teste 3: Segurança e Validações**
```
1. Usuário HR tenta criar campanha → deve falhar (403)
2. Usuário admin acessa /admin/questionarios → deve funcionar
3. Usuário anônimo tenta baixar relatório → deve falhar (401)
4. Token expirado tenta acessar survey → deve falhar (403)
5. Tentativa de criar campanha com questionário inexistente → deve falhar
```

---

## 📁 ARQUIVOS A CRIAR/MODIFICAR

### **Novos Arquivos:**
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

### **Arquivos a Modificar:**
- `src/app/campanhas/page.tsx`
- `src/app/campanhas/[id]/page.tsx`
- `src/app/obrigado/[receiptCode]/page.tsx`
- `src/app/api/admin/campaigns/route.ts`
- `src/lib/server/repositories/questionnaire-repository.ts`
- `src/app/questionarios/page.tsx`
- `src/app/api/admin/questionnaires/route.ts`
- `src/app/api/admin/questionnaires/[id]/route.ts`

---

## ⚠️ DEPENDÊNCIAS TÉCNICAS

### **Pacotes NPM Necessários:**
```bash
npm install qrcode  # Para geração de QR codes
```

### **Ordem de Implementação:**
1. Task 1.1 (Campaign Creation) - Independente
2. Task 1.2 (Token Generation) - Depende de campaigns existirem
3. Task 2.1 (Questionnaire Management) - Independente
4. Task 3.1 (Report Download) - Depende de reports existirem

---

## ✅ CRITÉRIOS DE DONE GERAIS

### **Por Task:**
- [ ] Código implementado e funcional
- [ ] Tratamento adequado de erros
- [ ] Validações implementadas
- [ ] UI responsiva e acessível
- [ ] Testes manuais passando

### **Por Fase:**
- [ ] Todos os critérios de aceitação atendidos
- [ ] Código revisado e aprovado
- [ ] Testes de integração passando
- [ ] Documentação atualizada

### **Projeto Completo:**
- [ ] Fluxo completo funcional (criar → tokens → survey → relatório)
- [ ] Gestão de questionários operacional
- [ ] Segurança e RBAC funcionando
- [ ] UI polida e consistente
- [ ] Pronto para deploy em produção

---

**Data:** Abril 6, 2026  
**Status:** Pronto para execução  
**Próximo:** Iniciar implementação da Task 1.1