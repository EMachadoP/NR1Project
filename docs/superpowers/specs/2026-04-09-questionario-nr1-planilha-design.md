# Substituicao do Questionario Atual pela Planilha NR-1

Data: 2026-04-09
Status: Draft de especificacao aprovado conceitualmente
Escopo: substituir o questionario psicossocial atual pela planilha `NR-1 Tabulacao (1).xlsx` como fonte canonica do novo questionario

## Objetivo

Trocar o questionario atualmente publicado por um novo questionario derivado da planilha operacional fornecida pelo usuario.

O novo fluxo deve:
- usar a planilha como fonte canonica do conteudo
- preservar o modelo atual de persistencia no banco (`questionnaires`, `questionnaire_sections`, `questionnaire_questions`)
- preservar o mecanismo de respostas em escala `1..5`
- manter uma unica direcao de score para todas as perguntas
- aposentar o catalogo tecnico atual deste fluxo, sem destruir sua possibilidade de reutilizacao futura em outro projeto

## Contexto Atual

Hoje o projeto usa um seed e um script de sincronizacao baseados em um catalogo tecnico de perigos psicossociais:
- `scripts/generate-catalog-seed.js`
- `scripts/sync-production-questionnaire.js`

Esse questionario atual:
- foi estruturado a partir de `hazard-catalog.json`
- inclui metadados tecnicos por pergunta, como `hazard_code`, `source_reference`, severidade e textos de apoio
- nao representa a realidade operacional atual do usuario

A planilha enviada contem tres camadas de informacao:
- aba `Questionario`: perguntas e secoes aplicadas no formulario
- aba `Instrucoes`: guia operacional, objetivo, publico-alvo, escala, classificacao de risco e a estrutura explicativa de 12 secoes
- aba `Analise de Dados`: resumo operacional para compilacao manual

## Decisoes Fechadas

### Fonte canonica

A planilha passa a ser a fonte canonica do novo questionario.

O sistema nao deve mais depender do catalogo tecnico atual para gerar esse questionario.

### Persistencia

Apesar da planilha ser a fonte canonica, o sistema continuara consumindo dados normalizados no banco de dados.

O fluxo recomendado e:
1. ler a planilha
2. converter para o formato interno do projeto
3. gerar artefato versionado no repositorio
4. publicar/sincronizar no banco a partir desse formato normalizado

### Escala de respostas

O mecanismo atual de resposta sera preservado:
- escala `1..5`
- labels operacionais da planilha: `Nunca`, `Raramente`, `As vezes`, `frequentemente`, `Sempre`

### Direcao de score

Todas as perguntas seguirao a mesma direcao de score.

Nao havera inversao especial para enunciados com redacao negativa nesta fase.

Direcao definida para implementacao:
- `scoring_direction = 'negative'` para todas as perguntas

Motivo:
- o sistema ja considera respostas `4-5` como criticas
- manter `negative` faz o risco crescer na mesma direcao da resposta marcada
- isso preserva a leitura operacional desejada pelo usuario nesta fase

### Metadados tecnicos antigos

Os metadados tecnicos do catalogo atual deixam de ser a base do novo questionario.

Os campos tecnicos existentes na tabela `questionnaire_questions` podem continuar existindo no schema, mas nao serao obrigatoriamente preenchidos para o novo questionario.

### Estrutura de secoes

O material explicativo descreve 12 secoes, enquanto a aba `Questionario` hoje mostra apenas parte do questionario.

Decisao do usuario:
- seguir com a estrutura de 12 secoes
- importar automaticamente o que estiver explicito na aba `Questionario`
- completar as secoes faltantes com uma primeira versao editorial baseada na propria planilha explicativa
- permitir ajustes posteriores

## Abordagens Consideradas

### Abordagem recomendada: planilha canonica + conversao para formato interno

Criar um conversor que leia a planilha e produza o questionario final no formato esperado pelo sistema.

Vantagens:
- mantem a planilha como origem oficial
- preserva o modelo atual de banco e a UI existente
- melhora auditabilidade e versionamento do conteudo
- evita leitura de `.xlsx` em runtime

Trade-off:
- exige um conversor e um artefato intermediario versionado

### Alternativa descartada: ler a planilha diretamente em runtime

Motivos para rejeicao:
- pior previsibilidade de deploy
- acoplamento desnecessario ao arquivo bruto
- mais fragilidade operacional

### Alternativa parcial: reescrever seed manualmente sem conversor

Motivo para nao recomendar:
- mudancas futuras na planilha ficariam caras e propensas a erro

## Modelo de Dados Alvo

O schema atual suficiente para o novo questionario e:

### `questionnaires`

Campos usados:
- `id`
- `name`
- `version`
- `status`
- `created_at`
- `published_at`

### `questionnaire_sections`

Campos usados:
- `id`
- `questionnaire_id`
- `name`
- `order_index`

### `questionnaire_questions`

Campos obrigatorios no novo fluxo:
- `id`
- `section_id`
- `prompt`
- `answer_type = 'likert_1_5'`
- `scoring_direction`
- `weight = 1`
- `is_required = true`
- `is_active = true`
- `order_index`

Campos tecnicos legados:
- `hazard_code`
- `source_reference`
- `severity_score`
- `severity_label`
- `circumstances_text`
- `outcomes_text`
- `recommended_actions_text`
- `monitoring_guidance_text`

Esses campos permanecem compatveis com o schema, mas nao serao a fonte principal do novo questionario.

## Estrutura do Conteudo

### Conteudo importado diretamente da planilha

Da aba `Questionario`:
- secoes ja presentes no formulario
- perguntas explicitas por secao
- ordem visual das secoes e perguntas
- labels da escala

Da aba `Instrucoes`:
- titulo do material
- subtitulo/setor
- objetivo
- publico-alvo
- instrucoes de aplicacao
- interpretacao dos resultados
- acoes recomendadas
- proximos passos
- conformidade com NR-1
- estrutura explicativa das 12 secoes

Da aba `Analise de Dados`:
- contagem esperada por secao quando util para validacao do conteudo importado
- faixas de classificacao de risco para referencia de produto

### Conteudo complementar editorial

Como a planilha esta inconsistente entre a descricao e o formulario efetivo, o conversor aceitara uma camada complementar local para:
- completar as 12 secoes descritas
- preencher perguntas iniciais nas secoes faltantes
- ajustar o total geral de perguntas conforme a estrutura-alvo

Essa camada complementar deve ser explicitamente marcada no codigo como conteudo editorial temporario.

## Regras de Negocio

### Questionario novo

O questionario gerado deve substituir o questionario atual publicado para uso operacional do projeto.

### Status e publicacao

O fluxo de publicacao continua o mesmo:
- gerar/salvar questionario
- publicar no banco
- arquivar questionarios anteriormente publicados

### Compatibilidade com respostas

Como a escala continua `1..5` e o tipo de resposta continua `likert_1_5`, a UI do respondente e a submissao anonima devem permanecer compativeis sem redesenho completo.

### Score

Nesta fase:
- todas as perguntas usam a mesma direcao configurada no questionario
- nao ha regra especial por frase negativa

### Obrigatoriedade

Por padrao, as perguntas do novo questionario serao importadas como obrigatorias, salvo ajuste manual futuro.

## Arquitetura Proposta

### 1. Conversor de planilha

Criar um script de importacao que:
- leia a planilha `.xlsx`
- identifique secoes e perguntas da aba `Questionario`
- extraia blocos textuais relevantes das abas explicativas
- combine esse conteudo com uma camada complementar local para fechar as 12 secoes
- gere um artefato estruturado versionado no repositorio

Formato recomendado do artefato:
- `json` em `supabase/seeds/` ou pasta equivalente

### 2. Gerador de seed

Adaptar o seed atual para consumir o artefato gerado pelo conversor, em vez de `hazard-catalog.json`.

Resultado esperado:
- seed SQL gerado a partir da nova estrutura do questionario

### 3. Sincronizacao de banco

Adaptar o script de sincronizacao para:
- usar o novo artefato estruturado
- recriar o questionario alvo
- recriar secoes e perguntas
- manter compatibilidade com o fluxo de publicacao atual

### 4. UI e consumo

O restante do sistema continua lendo do banco:
- pagina de questionarios
- criacao de campanha
- fluxo do respondente
- calculo e consolidacao de respostas

## Impacto em Arquivos

Arquivos provavelmente afetados:
- `scripts/generate-catalog-seed.js`
- `scripts/sync-production-questionnaire.js`
- `supabase/seeds/seed-initial.sql`

Arquivos novos provaveis:
- script de importacao da planilha
- artefato estruturado derivado da planilha
- testes do conversor/gerador

Arquivos potencialmente apenas verificados:
- `src/components/survey/respondent-survey-form.tsx`
- `src/lib/server/services/submission-service.ts`
- `src/lib/server/repositories/questionnaire-repository.ts`

## Tratamento da Aba Explicativa

O guia de aplicacao nao deve virar perguntas.

Ele deve ser preservado como documentacao operacional do questionario e como base semantica para a camada complementar editorial.

Como o schema atual de `questionnaires` nao possui campos dedicados para esse bloco textual, a estrategia desta fase e:
- manter esse conteudo no artefato fonte gerado pelo conversor
- usa-lo para rastreabilidade e futuras evolucoes
- nao bloquear a substituicao do questionario por falta de um CMS interno para esse texto

## Erros e Casos Limite

### Inconsistencia entre abas

Se a aba `Instrucoes` e a aba `Questionario` divergirem:
- a aba `Questionario` prevalece para perguntas explicitamente presentes
- a estrutura explicativa orienta o complemento editorial
- o conversor deve emitir aviso claro sobre divergencias encontradas

### Mudancas futuras na planilha

O processo deve ser rerodavel:
- editar planilha
- rerodar conversor
- regenerar seed
- sincronizar/publicar novamente

### Colunas ou formato inesperado

Se a planilha vier com layout diferente:
- falhar com mensagem objetiva
- apontar aba e linha problematica

## Testes Esperados

### Conversor
- identifica abas obrigatorias
- extrai secoes e perguntas existentes
- detecta divergencias entre contagem declarada e contagem real
- gera artefato interno valido

### Seed/sincronizacao
- gera questionario com 12 secoes
- gera perguntas na ordem correta
- publica questionario no banco sem depender do catalogo antigo

### Compatibilidade funcional
- campanha consegue selecionar o novo questionario publicado
- respondente consegue abrir e enviar respostas no fluxo atual
- consolidacao continua funcionando com `likert_1_5`

## Fora de Escopo Nesta Fase

- remodelar a UI do questionario
- introduzir novos tipos de resposta
- criar um CMS interno para o guia explicativo
- normalizar automaticamente a semantica de perguntas negativas
- eliminar definitivamente o catalogo tecnico antigo do repositorio

## Recomendacao Final

Implementar a substituicao do questionario em torno de um fluxo simples e rerrodavel:
- planilha como fonte canonica
- conversor para formato interno versionado
- seed e sincronizacao consumindo esse formato
- publicacao no banco usando o fluxo atual

Isso atende a necessidade imediata do usuario sem quebrar o desenho central do sistema e preserva espaco para refinamento posterior das secoes complementares.
