# 01_PRD.md

## Visão Geral
O NR-1 Survey & Risk Manager é uma plataforma digital para aplicação de questionários organizacionais, cálculo automático de risco, geração de relatórios, apoio à tomada de decisão e acompanhamento de plano de ação e indicadores. O produto será composto por um app PWA/mobile-first para respondentes e um portal web para RH, Segurança do Trabalho, gestores e administradores.

## Problema
Hoje o processo de coleta, consolidação, análise e acompanhamento é manual ou semiestruturado, normalmente apoiado por papel e planilhas. Isso gera:
- alto consumo de tempo operacional
- risco de erro de consolidação
- lentidão para identificar riscos altos ou críticos
- dificuldade de rastreabilidade
- baixa padronização na geração de relatórios e ações corretivas

## Objetivos
- reduzir drasticamente o tempo de consolidação e interpretação dos questionários
- automatizar o cálculo de risco e a classificação por seção
- acelerar a abertura de ações em casos alto/crítico
- padronizar relatórios e recomendações
- garantir rastreabilidade de campanhas, análises e ações

## Público-Alvo
- Funcionários respondentes
- RH / Segurança do Trabalho
- Gestores / Diretoria
- Administradores do sistema

## Proposta de Valor
Uma solução única que transforma o processo de coleta e análise de riscos em um fluxo digital rápido, auditável e padronizado, com cálculo automático, relatórios imediatos e suporte de IA com revisão humana.

## Funcionalidades Principais
- criação e gestão de campanhas
- geração de links, tokens e QR
- preenchimento de questionário via PWA
- cálculo automático de risco por pergunta e por seção
- classificação automática por escala de risco
- identificação de itens críticos
- geração automática de relatório individual
- geração automática de relatório analítico com recomendações
- dashboard por campanha
- plano de ação estruturado
- registro e acompanhamento de indicadores

## Funcionalidades Secundárias
- exportação CSV/Excel/PDF
- histórico de alterações em plano de ação
- idioma por campanha
- observações textuais no preenchimento
- comprovante de envio por ID

## Fluxo do Usuário

### Respondente
1. acessa via link/token/QR
2. lê objetivo e termo
3. responde por seção com barra de progresso
4. revisa respostas
5. envia
6. recebe confirmação e relatório individual

### RH / Segurança do Trabalho
1. cria campanha
2. escolhe questionário e período
3. gera tokens/QR
4. acompanha adesão
5. analisa dashboard
6. gera relatórios
7. cria/edita plano de ação
8. acompanha indicadores

### Gestor / Diretoria
1. acessa consolidados
2. revisa relatórios
3. aprova ou acompanha plano de ação

### Administrador
1. configura questionários, seções e perguntas
2. define regras, permissões e integrações
3. administra retenção e parâmetros do sistema

## Escopo MVP
- gestão de campanhas
- questionários configuráveis
- PWA do respondente
- modo anônimo via token
- cálculo automático de risco
- classificação por seção
- identificação de itens críticos
- relatório individual
- relatório analítico
- dashboard RH
- plano de ação editável
- indicadores de monitoramento
- integração IA para recomendações estruturadas

## Fora do Escopo
- integração automática com folha, ponto e SESMT
- segmentação avançada por turno, função e unidade com regras sofisticadas
- reavaliação automática por alertas programados
- assinatura eletrônica
- modo offline completo com sincronização posterior

## Requisitos Funcionais
- suportar múltiplas versões de questionário
- suportar seções e perguntas com metadados
- exigir scoring_direction por pergunta
- normalizar risco por pergunta
- calcular média por seção
- classificar seção conforme escala definida
- marcar itens críticos com risco >= 4
- gerar relatórios automáticos
- permitir edição do plano de ação pelo RH
- registrar indicadores por período
- exportar dados anonimizados
- manter trilha de auditoria no plano de ação

## Requisitos Não Funcionais
- PWA com bom desempenho em rede móvel
- segurança com HTTPS e criptografia em repouso
- anonimato como padrão
- RBAC por perfil
- retenção configurável
- rastreabilidade de alterações
- arquitetura enxuta e escalável para MVP

## Critérios de Sucesso
- tempo do RH para gerar relatório final menor que 5 minutos após encerramento
- taxa de criação de plano de ação acima de 90% das campanhas
- tempo entre risco crítico e abertura de ação inferior a 48h
- preenchimento médio entre 8 e 15 minutos
- redução perceptível do esforço manual do RH

## Riscos
- quebra indireta de anonimato
- inconsistência de configuração do questionário
- recomendações inadequadas da IA
- crescimento de escopo prematuro
- excesso de segmentação reduzindo confidencialidade

## Roadmap Inicial

### Fase 1 — Base MVP
- autenticação RH/Admin
- campanhas
- questionários
- tokens
- PWA respondente
- motor de cálculo

### Fase 2 — Gestão e análise
- dashboard RH
- relatórios automáticos
- exportações
- plano de ação

### Fase 3 — Inteligência e monitoramento
- indicadores
- integração IA
- ajustes de usabilidade
- hardening de segurança e auditoria