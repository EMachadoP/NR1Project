# Fase 1 - Alinhamento Necessario nos Documentos Mestres

Este arquivo registra os ajustes que precisam existir em `03_SOURCE_OF_TRUTH.md` e `02_SDD.md` para manter a implementacao da Fase 1 sem contradicao documental.

## 03_SOURCE_OF_TRUTH.md

Adicionar ou explicitar:
- a escala oficial de resposta do MVP e inteira de `1..5`
- perguntas opcionais sem resposta sao excluidas da media da secao
- consolidacoes analiticas so podem ser exibidas quando o agrupamento tiver pelo menos `5` respostas
- `observation_text` e opcional, anonimo por natureza e pode sofrer redacao server-side
- `observation_text` nao entra em payload de IA

## 02_SDD.md

Adicionar ou explicitar:
- `campaign_tokens` usa `token_hash` como semantica oficial de persistencia e lookup
- o token bruto existe apenas na entrega ao respondente e nao fica salvo no banco
- o endpoint de submissao rejeita respostas fora do intervalo `1..5`
- o modulo analitico deve devolver bloqueio de exibicao quando `response_count < 5`
- o contrato de IA e `strict` e nao aceita `observation_text`

## Observacao

A implementacao do workspace ja segue estas regras. Este arquivo serve para fechar a lacuna entre codigo atual e documentacao de referencia quando os originais estiverem fora do repositorio.
