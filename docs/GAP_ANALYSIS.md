# GAP Analysis: NR-1 Survey & Risk Manager vs. Benchmarks de Mercado

## Resumo Executivo

O projeto é um **MVP funcional** com base técnica sólida (TypeScript, Next.js 15, Supabase, testes, CI). Porém, para competir com plataformas como **TeamCulture, Sólides, Indexmed e Moodar**, existem **gaps críticos** que impedem a comercialização imediata e o cumprimento integral da NR-1 atualizada (Portaria MTE nº 1.419/2024).

---

## 1. DIAGNÓSTICO E AVALIAÇÃO DE RISCOS PSICOSSOCIAIS

### Requisitos de Mercado
| Requisito | TeamCulture | Sólides | Indexmed | **Nosso Projeto** | Gap |
|-----------|-------------|---------|----------|-------------------|-----|
| Metodologia científica validada (COPSOQ-III, JCQ, DASS) | ✅ COPSOQ-III | ✅ Proprietária | ✅ COPSOQ | ❌ Questionário genérico | 🔴 CRÍTICO |
| 13 fatores psicossociais do MTE | ✅ Mapeados | ✅ Mapeados | ✅ Mapeados | ❌ Não mapeados | 🔴 CRÍTICO |
| Score por fator com classificação | ✅ Sim | ✅ Sim | ✅ Sim | ⚠️ Parcial (risco geral, sem mapeamento por fator) | 🟡 PARCIAL |
| Coleta contínua (5-6 perguntas/semana) | ✅ Sim | ❌ Anual | ❌ Anual | ❌ Campanha única | 🟡 PARCIAL |
| Convites automáticos por e-mail/WhatsApp | ✅ Sim | ✅ Sim | ✅ Sim | ❌ Não implementado | 🔴 CRÍTICO |
| Garantia de anonimato | ✅ Sim | ✅ Sim | ✅ Sim | ✅ Sim (tokens hash, RLS, redação PII, mínimo 5) | ✅ IMPLEMENTADO |

### O que temos ✅
- Motor de risco robusto com escala Likert 1-5
- Classificação por seção: MUITO BAIXO → CRÍTICO
- Redação automática de PII (CPF, email, telefone, matrícula)
- Proteção de anonimidade (bloqueio com <5 respostas)
- Tokens single-use com SHA-256

### O que falta 🔴
- **Questionário COPSOQ-III completo** (ou equivalente validado)
- **Mapeamento dos 13 fatores psicossociais do MTE**:
  1. Demandas do trabalho
  2. Influência no trabalho
  3. Possibilidades de desenvolvimento
  4. Significado do trabalho
  5. Comprometimento com o local de trabalho
  6. Sensação de justiça no trabalho
  7. Relações com colegas
  8. Relações com líder
  9. Qualidade de liderança
  10. Conflito trabalho-vida
  11. Sobrecarga emocional
  12. Assédio moral
  13. Ameaça de violência
- **Sistema de convites automáticos** (e-mail + WhatsApp)
- **Coleta contínua** (roteamento semanal vs. campanha única)

---

## 2. INVENTÁRIO DE RISCOS E PGR DIGITAL

### Requisitos de Mercado
| Requisito | TeamCulture | Sólides | Indexmed | **Nosso Projeto** | Gap |
|-----------|-------------|---------|----------|-------------------|-----|
| Registro de todos os perigos (5 categorias) | ✅ Parcial | ✅ Completo | ✅ Completo | ⚠️ Suporte via schema, sem UI | 🟡 PARCIAL |
| Matriz probabilidade × severidade | ✅ Sim | ✅ Sim | ✅ Sim | ⚠️ Campos existem (`severity_score`, `severity_label`), sem uso | 🟡 PARCIAL |
| Certificado digital ICP-Brasil | ❌ | ✅ Sim | ✅ Sim | ❌ Não implementado | 🔴 CRÍTICO |
| Versionamento e histórico de revisões | ✅ Sim | ✅ Sim | ✅ Sim | ❌ Não implementado | 🔴 CRÍTICO |
| Exportação em formato fiscal MTE | ✅ Sim | ✅ Sim | ✅ Sim | ❌ Não implementado | 🔴 CRÍTICO |
| Documento dinâmico (não estático) | ✅ Sim | ✅ Sim | ✅ Sim | ⚠️ Relatórios HTML estáticos | 🟡 PARCIAL |

### O que temos ✅
- Campos de metadata de risco nas perguntas (`hazard_code`, `severity_score`, `severity_label`, `circumstances_text`, `outcomes_text`)
- Relatórios HTML com templates versionados
- Tabela `analysis_results` com JSONB para análise

### O que falta 🔴
- **UI de inventário de riscos** (CRUD completo)
- **Certificado digital ICP-Brasil** para validade jurídica
- **Exportação formatada para fiscalização** (formato exigido pelo MTE)
- **Histórico de revisões do PGR** (versionamento documental)

---

## 3. PLANO DE AÇÃO (5W2H)

### Requisitos de Mercado
| Requisito | TeamCulture | Sólides | Indexmed | **Nosso Projeto** | Gap |
|-----------|-------------|---------|----------|-------------------|-----|
| Plano 5W2H automatizado | ✅ Sim | ✅ Sim | ✅ Sim | ⚠️ Parcial (campos básicos) | 🟡 PARCIAL |
| Sugestão automática de ações (IA) | ✅ Sim | ✅ Sim | ✅ Sim | ✅ Sim (AI recommendations) | ✅ IMPLEMENTADO |
| Alertas de vencimento | ✅ Sim | ✅ Sim | ✅ Sim | ❌ Não implementado | 🔴 CRÍTICO |
| Vinculação risco → ação | ✅ Sim | ✅ Sim | ✅ Sim | ⚠️ Manual (sem link automático) | 🟡 PARCIAL |
| Evidência de impacto | ✅ Sim | ✅ Sim | ✅ Sim | ❌ Não implementado | 🔴 CRÍTICO |

### O que temos ✅
- CRUD completo de action plans
- Status: open, in_progress, done, cancelled
- Origem rastreável: manual, ai, analytical_report
- Histórico de alterações (`action_plan_history`)
- Audit log em todas as operações
- IA gera sugestões com `aiSuggestedAction` (priority, dueDate, monitoringFrequency)

### O que falta 🔴
- **Alertas automáticos de vencimento** (cron jobs / webhooks)
- **Vinculação automática** risco identificado → ação criada
- **Evidência de impacto** (métrica de antes/depois da ação)
- **Template 5W2H completo** (What, Why, Who, When, Where, How, How much)

---

## 4. MONITORAMENTO CONTÍNUO E ALERTAS

### Requisitos de Mercado
| Requisito | TeamCulture | Sólides | Indexmed | **Nosso Projeto** | Gap |
|-----------|-------------|---------|----------|-------------------|-----|
| Notificação automática em risco crítico | ✅ Sim | ✅ Sim | ✅ Sim | ❌ Não implementado | 🔴 CRÍTICO |
| Monitoramento semanal até recuperação | ✅ Sim | ❌ | ❌ | ❌ Não implementado | 🔴 CRÍTICO |
| Detecção de assédio via NLP | ✅ Sim | ❌ | ⚠️ Parcial | ❌ Não implementado | 🔴 CRÍTICO |
| Dashboard em tempo real | ✅ Sim | ✅ Sim | ✅ Sim | ⚠️ Parcial (dashboard básico) | 🟡 PARCIAL |
| Segmentação por área/cargo/equipe | ✅ Sim | ✅ Sim | ✅ Sim | ⚠️ Parcial (sector/unit) | 🟡 PARCIAL |

### O que temos ✅
- Tabela `monitoring_indicators` com variação e flag `action_needed`
- Dashboard de campanha com `critical_items_json` e `section_summary_json`
- Filtro por campanha nos indicadores
- IA com guardrails para detecção de risco crítico

### O que falta 🔴
- **Sistema de notificações** (e-mail, push, webhook)
- **NLP para detecção de assédio** em respostas abertas
- **Alertas automáticos** quando score < 50 (ou risco >= 4)
- **Cron de monitoramento** semanal automático
- **Correlação com dados operacionais** (absenteísmo, turnover, horas extras)

---

## 5. CADEIA DE AUDITORIA E DOCUMENTAÇÃO LEGAL

### Requisitos de Mercado
| Requisito | TeamCulture | Sólides | Indexmed | **Nosso Projeto** | Gap |
|-----------|-------------|---------|----------|-------------------|-----|
| Inventário de Riscos documentado | ✅ Sim | ✅ Sim | ✅ Sim | ⚠️ Parcial (schema existe, sem UI) | 🟡 PARCIAL |
| Plano de Ação com responsáveis/prazos | ✅ Sim | ✅ Sim | ✅ Sim | ✅ Sim | ✅ IMPLEMENTADO |
| Registros de Participação (item 1.5.3.3) | ✅ Sim | ✅ Sim | ✅ Sim | ❌ Não implementado | 🔴 CRÍTICO |
| Registros de Monitoramento com timestamps | ✅ Sim | ✅ Sim | ✅ Sim | ⚠️ Parcial (created_at existe) | 🟡 PARCIAL |
| Retenção de 20 anos | ✅ Sim | ❌ | ✅ Sim | ❌ Não configurado | 🟡 PARCIAL |

### O que temos ✅
- Tabela `audit_logs` com before/after JSON
- Tabela `action_plan_history` com histórico completo
- `classification_version` em analysis_results
- `template_version` em generated_reports
- Timestamps em todas as tabelas

### O que falta 🔴
- **UI de exportação dos 4 grupos de documentação** exigidos pela NR-1
- **Registro de participação dos trabalhadores** (item 1.5.3.3)
- **Política de retenção de dados** (20 anos)
- **Exportação 1-click para fiscalização**

---

## 6. INTEGRAÇÃO COM ESOCIAL (EVENTO S-2240)

### Requisitos de Mercado
| Requisito | TeamCulture | Sólides | Indexmed | **Nosso Projeto** | Gap |
|-----------|-------------|---------|----------|-------------------|-----|
| Geração automática do S-2240 | ❌ | ✅ Sim | ✅ Sim | ❌ Não implementado | 🔴 CRÍTICO |
| Transmissão direta via certificado A1/A3 | ❌ | ✅ Sim | ✅ Sim | ❌ Não implementado | 🔴 CRÍTICO |
| Controle de status (pendente/enviado/processado) | ❌ | ✅ Sim | ✅ Sim | ❌ Não implementado | 🔴 CRÍTICO |
| Histórico de envios e retificação | ❌ | ✅ Sim | ✅ Sim | ❌ Não implementado | 🔴 CRÍTICO |

### O que temos ❌
- **Nenhum componente implementado** para eSocial

### O que falta 🔴
- **Módulo completo de integração com eSocial**
- **Geração do evento S-2240** com dados do inventário
- **Certificado digital A1/A3** para transmissão
- **Controle de status de envio**
- **Retificação automática**

**Prioridade: MÁXIMA** — este é o diferencial mais citado entre sistemas "básicos" e "completos" no mercado.

---

## 7. PORTAL DO COLABORADOR

### Requisitos de Mercado
| Requisito | TeamCulture | Sólides | Indexmed | **Nosso Projeto** | Gap |
|-----------|-------------|---------|----------|-------------------|-----|
| Acesso às pesquisas | ✅ Sim | ✅ Sim | ✅ Sim | ✅ Sim (respondente por token) | ✅ IMPLEMENTADO |
| Canal anônimo de denúncias | ✅ Sim | ✅ Sim | ❌ | ❌ Não implementado | 🔴 CRÍTICO |
| Acompanhamento de treinamentos | ✅ Sim | ✅ Sim | ✅ Sim | ❌ Não implementado | 🔴 CRÍTICO |
| Políticas internas e suporte | ✅ Sim | ✅ Sim | ❌ | ❌ Não implementado | 🟡 PARCIAL |
| Comunicação de ações corretivas | ✅ Sim | ❌ | ❌ | ❌ Não implementado | 🟡 PARCIAL |

### O que temos ✅
- Página `/responder/[token]` com formulário completo
- Página `/obrigado/[receiptCode]` com agradecimento
- Anonimato garantido tecnicamente

### O que falta 🔴
- **Ouvidoria interna** (canal de denúncias anônimo)
- **Módulo de treinamentos** (ver seção 8)
- **Portal self-service** do colaborador (além do questionário)

---

## 8. GESTÃO DE TREINAMENTOS E CAPACITAÇÃO

### Requisitos de Mercado
| Requisito | TeamCulture | Sólides | Indexmed | **Nosso Projeto** | Gap |
|-----------|-------------|---------|----------|-------------------|-----|
| Cadastro e agendamento | ✅ Sim | ✅ Sim | ✅ Sim | ❌ Não implementado | 🔴 CRÍTICO |
| Emissão de certificados | ✅ Sim | ✅ Sim | ✅ Sim | ❌ Não implementado | 🔴 CRÍTICO |
| Controle de carga horária | ✅ Sim | ✅ Sim | ✅ Sim | ❌ Não implementado | 🔴 CRÍTICO |
| Alertas de vencimento | ✅ Sim | ✅ Sim | ✅ Sim | ❌ Não implementado | 🔴 CRÍTICO |
| Histórico auditável | ✅ Sim | ✅ Sim | ✅ Sim | ❌ Não implementado | 🔴 CRÍTICO |

### O que temos ❌
- **Nenhum componente implementado** para gestão de treinamentos

### O que falta 🔴
- **CRUD de treinamentos** (presenciais e EAD)
- **Emissão de certificados digitais**
- **Alertas de vencimento** de certificações
- **Registro de carga horária** por colaborador

---

## 9. DASHBOARD DE COMPLIANCE E ANALYTICS

### Requisitos de Mercado
| Requisito | TeamCulture | Sólides | Indexmed | **Nosso Projeto** | Gap |
|-----------|-------------|---------|----------|-------------------|-----|
| Índice de conformidade NR-1 | ✅ Sim | ✅ Sim | ✅ Sim | ❌ Não implementado | 🔴 CRÍTICO |
| Segmentação por área/cargo/unidade | ✅ Sim | ✅ Sim | ✅ Sim | ⚠️ Parcial (sector/unit) | 🟡 PARCIAL |
| Termômetro emocional (well-being score) | ✅ Sim | ✅ Sim | ✅ Sim | ⚠️ Parcial (risk score) | 🟡 PARCIAL |
| Dicas de IA nos resultados | ✅ Sim | ✅ Sim | ✅ Sim | ✅ Sim (AI recommendations) | ✅ IMPLEMENTADO |
| Correlação com dados operacionais | ✅ Sim | ⚠️ Parcial | ❌ | ❌ Não implementado | 🔴 CRÍTICO |

### O que temos ✅
- Dashboard de campanha com resumo de respostas e itens críticos
- IA com recomendações de ações e monitoramento
- Indicadores de monitoramento com variação

### O que falta 🔴
- **Dashboard de conformidade NR-1** (score geral de compliance)
- **Correlação com dados operacionais** (absenteísmo, turnover, horas extras)
- **Well-being score** consolidado (além do risk score)
- **Dashboard executivo** para diretoria

---

## 10. INTEGRAÇÕES COM OUTROS SISTEMAS

### Requisitos de Mercado
| Integração | TeamCulture | Sólides | Indexmed | **Nosso Projeto** | Gap |
|------------|-------------|---------|----------|-------------------|-----|
| ERP / Folha de Pagamento | ✅ Sim | ✅ Sim | ✅ Sim | ❌ Não implementado | 🔴 CRÍTICO |
| Controle de Ponto | ✅ Sim | ✅ Sim | ❌ | ❌ Não implementado | 🟡 PARCIAL |
| PCMSO / SST legados | ✅ Sim | ✅ Sim | ✅ Sim | ❌ Não implementado | 🔴 CRÍTICO |
| API REST para customizações | ✅ Sim | ❌ | ❌ | ⚠️ Parcial (endpoints admin) | 🟡 PARCIAL |

### O que temos ✅
- API REST admin com 21 endpoints documentados
- Supabase como backend (facilita integrações)

### O que falta 🔴
- **Webhooks** para notificações externas
- **Integrações prontas** (ERP, folha, ponto, PCMSO)
- **SDK ou documentação de integração** para parceiros

---

## 11. FUNCIONALIDADES STUB (implementação incompleta)

| Módulo | Funcionalidade | Status | Impacto |
|--------|---------------|--------|---------|
| Questionários | CRUD completo | 🔴 Stub | Impede criação de questionários via UI |
| Questionários | Publicação | 🔴 Stub | Impede uso real do sistema |
| Campanhas | Detalhe | 🔴 Stub | Impede edição de campanhas |
| Campanhas | Geração de tokens | 🔴 Stub | Impede distribuição de questionários |
| Campanhas | Atualização | 🔴 Stub | Impede gestão de campanhas |

---

## 12. MATRIZ DE PRIORIDADES

### 🔴 CRÍTICO (impede comercialização)
| # | Funcionalidade | Esforço Estimado | Impacto Legal |
|---|---------------|-----------------|---------------|
| 1 | **Questionário COPSOQ-III ou equivalente** | Alto | Multa por não conformidade |
| 2 | **Integração eSocial S-2240** | Muito Alto | Obrigação legal direta |
| 3 | **Certificado digital ICP-Brasil** | Alto | Validade jurídica dos documentos |
| 4 | **CRUD de Questionários** (sair do stub) | Médio | Impede uso do sistema |
| 5 | **Geração de tokens de campanha** (sair do stub) | Médio | Impede coleta de dados |
| 6 | **Canal de denúncias anônimo** | Médio | Exigência item 1.5.3.3 |
| 7 | **NLP para detecção de assédio** | Alto | Obrigação NR-1 + passivo trabalhista |
| 8 | **Alertas automáticos de risco crítico** | Médio | Obrigação de gestão contínua |
| 9 | **Módulo de treinamentos** | Alto | Capacitação obrigatória NR-1 |
| 10 | **Exportação para fiscalização MTE** | Médio | Multa por não apresentação |

### 🟡 IMPORTANTE (diferencial competitivo)
| # | Funcionalidade | Esforço Estimado | Impacto Comercial |
|---|---------------|-----------------|-------------------|
| 11 | Coleta contínua (semanal) | Médio | Diferencial vs. concorrentes |
| 12 | Convites automáticos (email/WhatsApp) | Médio | Usabilidade |
| 13 | Dashboard de conformidade NR-1 | Médio | Venda para compliance |
| 14 | Correlação com dados operacionais | Alto | Venda para diretoria |
| 15 | Sistema de notificações (email/push) | Médio | Retenção de usuários |
| 16 | Vinculação automática risco → ação | Baixo | Usabilidade |
| 17 | Evidência de impacto das ações | Médio | Fiscalização |
| 18 | Retenção de dados (20 anos) | Baixo | Compliance legal |
| 19 | Template 5W2H completo | Baixo | Usabilidade |
| 20 | APIs de integração documentadas | Médio | Parceiros e revendas |

### ✅ JÁ IMPLEMENTADO (manter e melhorar)
| # | Funcionalidade | Qualidade |
|---|---------------|-----------|
| 21 | Autenticação e autorização (RBAC) | Alta |
| 22 | Motor de risco | Alta |
| 23 | Anonimato técnico | Alta |
| 24 | Planos de ação CRUD | Alta |
| 25 | Indicadores CRUD | Alta |
| 26 | IA com guardrails | Alta |
| 27 | Audit log | Alta |
| 28 | Relatórios HTML versionados | Média |
| 29 | Rate limiting | Alta |
| 30 | Testes unitários (29 tests) | Alta |

---

## 13. COMPARATIVO FINAL COM O MERCADO

### Cobertura de Funcionalidades

| Plataforma | Módulos Implementados | Cobertura |
|------------|----------------------|-----------|
| **TeamCulture** | ~25/30 | ~83% |
| **Sólides** | ~27/30 | ~90% |
| **Indexmed** | ~24/30 | ~80% |
| **Moodar** | ~22/30 | ~73% |
| **Nosso Projeto** | **~12/30** | **~40%** |

### O que nos diferencia positivamente:
1. **Stack moderna** (Next.js 15, React 19, TypeScript) — muitos concorrentes usam stacks legadas
2. **Motor de risco open-source e testável** — transparente e auditável
3. **IA com guardrails semânticos** — mais sofisticado que muitos concorrentes
4. **Arquitetura limpa** (repos, services, domain) — manutenibilidade superior
5. **Anonimato técnico robusto** (hash SHA-256, redação PII, mínimo 5) — segurança de dados

### O que nos atrasa:
1. **Sem eSocial** — requisito obrigatório para sistemas completos
2. **Sem ICP-Brasil** — documentos sem validade jurídica
3. **Sem metodologia científica** — questionário genérico vs. COPSOQ-III
4. **Sem CRUD de questionários** — stubs impedem uso real
5. **Sem módulo de treinamentos** — exigência legal
6. **Sem NLP para assédio** — passivo trabalhista
7. **Sem notificações/alertas** — gestão não é contínua

---

## 14. ROADMAP RECOMENDADO

### Fase 1: Funcionalidade Mínima (2-3 semanas)
- [ ] Completar CRUD de Questionários (sair do stub)
- [ ] Completar geração de tokens de campanha
- [ ] Completar detalhe/atualização de campanhas
- [ ] Criar questionário COPSOQ-III completo (questions seed)
- [ ] Mapear 13 fatores psicossociais nas seções/perguntas

### Fase 2: Conformidade Legal (3-4 semanas)
- [ ] Canal de denúncias anônimo (ouvidoria)
- [ ] Módulo de treinamentos (CRUD + certificados)
- [ ] Alertas automáticos de risco crítico
- [ ] Exportação para fiscalização MTE (PDF formatado)
- [ ] Política de retenção de dados

### Fase 3: Diferenciação (4-6 semanas)
- [ ] Integração eSocial S-2240
- [ ] Certificado digital ICP-Brasil
- [ ] NLP para detecção de assédio
- [ ] Dashboard de conformidade NR-1
- [ ] Sistema de notificações (email)

### Fase 4: Maturidade (6-8 semanas)
- [ ] Coleta contínua semanal
- [ ] Convites automáticos (email/WhatsApp)
- [ ] Correlação com dados operacionais
- [ ] Integrações ERP/Folha/Ponto
- [ ] SDK de integrações

---

## 15. CONCLUSÃO

O projeto tem uma **base técnica excelente** — arquitetura limpa, testes, validações, segurança. Porém, está em **~40% de cobertura funcional** comparado aos líderes do mercado (Sólides: ~90%, TeamCulture: ~83%).

**As 3 prioridades absolutas** para tornar o produto comercializável são:

1. **Completar os stubs** (questionários, tokens, campanhas) — sem isso, o sistema não é utilizável
2. **Adotar COPSOQ-III** — sem metodologia científica, não há validade dos dados coletados
3. **Integração eSocial S-2240** — sem isso, não compete com Sólides e Indexmed

**Estimativa total para parity com o mercado:** 15-21 semanas de desenvolvimento com equipe de 2-3 devs full-stack.
