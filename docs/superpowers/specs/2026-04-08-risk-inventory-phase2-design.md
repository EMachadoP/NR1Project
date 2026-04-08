# Fase 2 — Versionamento e Controle Documental do Inventário/PGR

Data: 2026-04-08
Status: Draft de especificação aprovado conceitualmente
Escopo: evolução do módulo de inventário NR-01 já implementado na Fase 1

## Objetivo

Adicionar governança operacional ao inventário de riscos por campanha, com versionamento formal, publicação controlada, export do documento oficial vigente e trilha documental adequada para PGR/inventário.

A Fase 1 já cobre:
- CRUD do inventário operacional
- matriz Probabilidade x Severidade
- NRO calculado
- classificação por faixa
- critérios documentados
- RBAC básico no portal

A Fase 2 passa a cobrir:
- snapshots versionados por campanha
- estados documentais `draft`, `published`, `archived`
- publicação com aprovação automática embutida
- arquivamento automático da versão publicada anterior
- export/PDF da versão oficial vigente
- histórico documental por revisão
- base pronta para comparação futura entre versões

## Decisões Fechadas

### Escopo do versionamento

O versionamento é **por campanha**.

Cada campanha pode ter múltiplas versões do inventário, mas apenas uma versão `published` pode estar ativa por vez.

### Estados documentais

Estados válidos:
- `draft`: versão editável, em elaboração ou revisão interna
- `published`: versão oficial da campanha, imutável após publicação
- `archived`: versão anterior preservada para consulta, comparação e auditoria

### Regra de publicação

A publicação exige aprovação formal no banco de dados, mas sem criar uma etapa manual separada.

Quando um `admin` executa a ação de publicar:
- a versão `draft` vira `published`
- o sistema grava automaticamente:
  - `published_by`
  - `published_at`
  - `approved_by`
  - `approved_at`
  - `approval_note` (opcional, recomendado)
- a versão publicada torna-se imutável

Mesmo que `published_by` e `approved_by` sejam o mesmo usuário nesta fase, ambos permanecem separados no schema para permitir evolução futura.

### Substituição da versão vigente

Ao publicar uma nova versão:
- localizar a `published` atual da mesma campanha
- mudar a versão anterior para `archived`
- gravar `archived_at`
- gravar `archived_reason = 'superseded_by_new_publication'`
- preencher `supersedes_version_id` na nova versão publicada
- garantir que exista apenas **uma única `published` ativa por campanha**

### Criação de nova revisão

Ação principal:
- `Nova revisão`

Comportamento padrão:
- cria nova versão `draft` como **cópia integral da última `published`** da campanha

Ação excepcional:
- `Nova revisão vazia`

Regra de acesso:
- revisão vazia é restrita a `admin` ou permissão especial futura

### Cópia da versão anterior

Ao criar nova revisão por cópia:
- copiar apenas os **itens consolidados** da versão `published`
- **não copiar o histórico** dos itens
- o histórico permanece vinculado à versão antiga
- a nova revisão começa seu próprio histórico a partir da criação

### PDF/export

O PDF principal da versão `published` deve mostrar apenas a versão vigente.

Nesta fase:
- não incluir comparação com a versão anterior no PDF oficial
- não misturar documento vigente com análise de revisão
- preparar estrutura de dados para gerar comparação futura, mas sem expor isso no artefato principal

## Abordagens Consideradas

### Abordagem recomendada: snapshots formais por campanha

Criar uma entidade documental de versão do inventário por campanha e vincular os itens dessa versão a um snapshot fechado.

Vantagens:
- forte aderência a controle documental
- trilha clara entre revisão, publicação e arquivamento
- export estável e reproduzível
- base adequada para auditoria e comprovação

Trade-off:
- mais complexidade de schema e fluxo que o modelo vivo da Fase 1

### Alternativa descartada: editar inventário vivo e só marcar publicações

Manter um inventário único por campanha e registrar apenas eventos de publicação.

Motivo da rejeição:
- pior auditabilidade
- risco de drift entre o que foi publicado e o estado atual
- PDF oficial deixa de ser reproduzível com segurança

### Alternativa futura: workflow separado de revisão/aprovação

Fluxo possível no futuro:
- `draft -> in_review -> approved -> published -> archived`

Não entra agora porque:
- aumenta atrito operacional
- ainda não há exigência fechada de segregação entre elaborador e aprovador
- a aprovação automática embutida já cobre o essencial de compliance nesta etapa

## Modelo de Dados Proposto

### Nova tabela principal

`risk_inventory_versions`

Campos mínimos:
- `id uuid primary key`
- `campaign_id uuid not null`
- `version_number integer not null`
- `status text not null check (status in ('draft', 'published', 'archived'))`
- `title text null`
- `summary_note text null`
- `created_by uuid not null`
- `created_at timestamptz not null`
- `updated_by uuid null`
- `updated_at timestamptz not null`
- `published_by uuid null`
- `published_at timestamptz null`
- `approved_by uuid null`
- `approved_at timestamptz null`
- `approval_note text null`
- `supersedes_version_id uuid null`
- `archived_at timestamptz null`
- `archived_reason text null`

Restrições necessárias:
- unicidade de `version_number` por `campaign_id`
- no máximo uma versão `published` por campanha
- versões `published` e `archived` não podem ser editadas por fluxo normal

### Evolução da tabela de itens

`risk_inventory_items`

Novo vínculo:
- adicionar `risk_inventory_version_id uuid not null`

Consequência:
- itens passam a pertencer a uma versão documental específica
- o inventário deixa de ser apenas um estado vivo por campanha

### Histórico por item

`risk_inventory_history`

Permanece existindo, mas agora deve referenciar indiretamente a revisão correta por meio do item associado à versão.

Objetivo:
- manter auditoria operacional dentro de cada revisão
- não contaminar revisões novas com histórico antigo

### Estrutura para diffs futuros

Não é necessário criar relatório comparativo agora, mas o modelo deve permitir no futuro:
- identificar versão anterior via `supersedes_version_id`
- comparar itens por chave estável
- classificar mudanças como `added`, `removed`, `changed`

Para isso, recomenda-se manter uma chave técnica estável por item quando a revisão nasce da cópia da versão anterior. Exemplo:
- `origin_item_id uuid null`

Esse campo não precisa ser exposto na UI.

## Regras de Negócio

### Criação de revisão

Regra padrão:
- se houver `published` anterior, criar nova `draft` copiando todos os itens consolidados da última versão oficial

Regra excepcional:
- permitir revisão vazia apenas para `admin`

Bloqueios:
- não permitir múltiplas `draft` simultâneas por campanha sem decisão explícita do produto

Recomendação desta fase:
- permitir apenas **uma `draft` ativa por campanha**

### Edição

- só versões `draft` podem ser editadas
- `published` é somente leitura
- `archived` é somente leitura

RBAC desta fase:
- `admin`: cria revisão, cria revisão vazia, publica, arquiva automaticamente, exporta, edita probabilidade e severidade
- `hr`: edita versão `draft` dentro das permissões já existentes, sem alterar severidade se a regra atual continuar
- `manager`: leitura conforme escopo da campanha

Observação importante:
- como o sistema atual ainda usa `admin`, `hr`, `manager`, o papel operacional equivalente ao `editor` continua sendo `hr`

### Publicação

Ao publicar uma `draft`:
1. validar integridade mínima da revisão
2. arquivar a `published` anterior da campanha, se existir
3. gravar metadados de publicação e aprovação automática na nova revisão
4. travar edição da nova `published`
5. registrar auditoria

### Export

- só versões `published` devem poder gerar o PDF oficial do inventário/PGR
- o PDF deve ser montado exclusivamente a partir do snapshot da versão
- o export não pode depender do estado vivo atual de tabelas fora da revisão

## UX Proposta

### Página de inventário da campanha

Adicionar visão por revisão:
- seletor da revisão vigente
- badge visual para `draft`, `published`, `archived`
- ação principal `Nova revisão`
- ação secundária `Nova revisão vazia` visível apenas para `admin`
- ação `Publicar` disponível apenas em `draft`
- ação `Exportar PDF` disponível para `published`

### Fluxo de publicação

Ao clicar em `Publicar`:
- abrir confirmação simples
- permitir preenchimento opcional de `approval_note`
- exibir aviso de que a publicação:
  - tornará esta revisão imutável
  - arquivará a versão publicada anterior da mesma campanha

### Leitura operacional

Na interface principal, o usuário deve entender claramente:
- qual revisão está em elaboração
- qual revisão é a oficial vigente
- quais revisões são históricas

Evitar linguagem ambígua como “ativa” sem distinguir estado documental.

## API e Serviços

Novas operações esperadas:
- listar versões de inventário por campanha
- criar nova revisão por cópia da `published`
- criar revisão vazia
- publicar revisão
- listar itens de uma revisão
- exportar PDF da revisão `published`

Fluxos críticos devem ser transacionais no banco quando envolverem:
- mudança de estado da revisão nova
- arquivamento da revisão anterior
- gravação de metadados de publicação/aprovação

## Export/PDF

Conteúdo do PDF oficial da revisão publicada:
- identificação da campanha
- identificação da revisão
- data de publicação
- responsável pela publicação/aprovação
- critérios da matriz
- inventário consolidado vigente
- classificação por NRO
- status/documentação oficial da campanha

Fora do escopo nesta fase:
- comparação entre versões dentro do PDF principal
- relatório de alterações anexado ao documento oficial

## Auditoria e Evidência

Além de `risk_inventory_history`, a revisão publicada deve deixar evidência explícita de:
- quem criou a revisão
- quem publicou
- quem aprovou
- quando publicou
- qual versão foi substituída
- por que a versão anterior foi arquivada

Essa trilha deve ser recuperável sem depender apenas da UI.

## Erros e Casos Limite

### Publicação concorrente

Se dois admins tentarem publicar drafts da mesma campanha ao mesmo tempo:
- apenas uma deve vencer
- a operação deve falhar de forma determinística para a outra
- o banco deve proteger a unicidade de `published` por campanha

### Campanha sem versão publicada anterior

- permitir criação e publicação da primeira revisão normalmente
- `supersedes_version_id` fica nulo

### Tentativa de editar revisão publicada

- bloquear no backend
- UI apenas reflete esse bloqueio

### Tentativa de criar nova draft quando já existe draft ativa

Recomendação desta fase:
- bloquear e orientar o usuário a continuar a draft existente ou publicá-la/arquivá-la antes

## Testes Esperados

### Backend
- criação de revisão por cópia da `published`
- criação de revisão vazia por `admin`
- bloqueio de revisão vazia para papel não permitido
- publicação com preenchimento automático de `published_by`, `published_at`, `approved_by`, `approved_at`
- arquivamento automático da `published` anterior
- bloqueio de edição em `published`
- garantia de uma única `published` por campanha

### UI
- exibição clara do estado documental
- ação de publicar apenas em `draft`
- export apenas na revisão `published`
- `Nova revisão vazia` apenas para `admin`

## Fora de Escopo Nesta Fase

- workflow separado de aprovação (`in_review`, `approved` etc.)
- comparação visual entre versões no PDF oficial
- diff detalhado de mudanças na UI principal
- rejeição/devolução formal de draft com comentários
- múltiplos aprovadores

## Recomendação Final

Implementar a Fase 2 como evolução documental do módulo de inventário já existente, sem reabrir o desenho da matriz ou do CRUD base.

O foco deve ser:
- formalizar o inventário por revisão versionada
- garantir uma única versão oficial por campanha
- tornar a publicação reproduzível e auditável
- manter o PDF oficial limpo e estável

Esse desenho atende bem controle documental, mantém a operação simples e deixa o produto pronto para evoluções futuras sem quebrar a modelagem.
