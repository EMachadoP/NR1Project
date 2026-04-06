# Phase 5 Source Alignment

## Objetivo
Registrar os ajustes finais da Fase 5 que precisam permanecer alinhados entre codigo, arquitetura e documentos mestres do projeto.

## Ajustes fechados na Fase 5
- A classificacao oficial usa media arredondada para uma casa decimal e operadores fechados por faixa:
  - `1.0 <= media <= 1.5` => `MUITO_BAIXO`
  - `1.6 <= media <= 2.5` => `BAIXO`
  - `2.6 <= media <= 3.5` => `MEDIO`
  - `3.6 <= media <= 4.5` => `ALTO`
  - `4.6 <= media <= 5.0` => `CRITICO`
- `weight` participa da media oficial do MVP por secao.
- Quando ausente, `weight` assume `1` como valor padrao oficial.
- Item critico e uma regra por pergunta: `risk_value >= 4`.
- Classificacao de secao e uma regra agregada baseada na media ponderada da secao.
- O TTL oficial do link assinado interno de relatorios e `3600` segundos (`1 hora`).
- O endpoint `POST /api/admin/ai/recommendations` usa rate limiting de `10` requisicoes por usuario a cada `1 hora`.

## Documentos mestres que devem refletir o mesmo estado
- `03_SOURCE_OF_TRUTH.md`
- `02_SDD.md`
- `01_PRD.md` quando houver referencia funcional a classificacao, relatorios ou IA

## Restricao de consistencia
Nenhuma implementacao futura deve:
- reabrir ambiguidade nos boundaries das faixas
- tratar `weight` como campo morto sem atualizar a regra oficial
- confundir item critico com classificacao agregada de secao
- ampliar TTL de links assinados sem revisao explicita de seguranca
- remover ou afrouxar rate limiting do endpoint de IA sem revisao operacional
