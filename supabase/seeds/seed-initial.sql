-- =====================================================
-- SEED DATA - QUESTIONARIO NR-1 SETOR DE COSTURA
-- =====================================================
-- Gerado automaticamente a partir de supabase/seeds/nr1-questionnaire.json
-- Avisos do importador:
-- divergencia detectada: a aba Questionario possui 8 secoes visiveis, mas a estrutura alvo exige 12.
-- =====================================================
begin;

delete from public.campaigns where questionnaire_id in ('a1000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001');
delete from public.questionnaire_questions where section_id in (select id from public.questionnaire_sections where questionnaire_id in ('a1000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001'));
delete from public.questionnaire_sections where questionnaire_id in ('a1000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001');
delete from public.questionnaires where id in ('a1000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001');

insert into public.questionnaires (id, name, version, status, created_at, published_at)
values ('a1000000-0000-0000-0000-000000000001', 'Questionario NR-1 - Setor de Costura', 'v3.0.0', 'published', timezone('utc', now()), timezone('utc', now()));

insert into public.questionnaire_sections (id, questionnaire_id, name, order_index)
values
  ('nr1-organizacao-do-trabalho-e-jornada', 'a1000000-0000-0000-0000-000000000001', 'ORGANIZACAO DO TRABALHO E JORNADA', 0),
  ('nr1-previsibilidade-e-rotina', 'a1000000-0000-0000-0000-000000000001', 'PREVISIBILIDADE E ROTINA', 1),
  ('nr1-autonomia-participacao-e-sentido-do-trabalho', 'a1000000-0000-0000-0000-000000000001', 'AUTONOMIA, PARTICIPACAO E SENTIDO DO TRABALHO', 2),
  ('nr1-relacoes-lideranca-e-respeito', 'a1000000-0000-0000-0000-000000000001', 'RELACOES, LIDERANCA E RESPEITO', 3),
  ('nr1-pressao-cobranca-e-clima-psicologico', 'a1000000-0000-0000-0000-000000000001', 'PRESSAO, COBRANCA E CLIMA PSICOLOGICO', 4),
  ('nr1-saude-bem-estar-e-suporte', 'a1000000-0000-0000-0000-000000000001', 'SAUDE, BEM-ESTAR E SUPORTE', 5),
  ('nr1-comunicacao-e-informacao', 'a1000000-0000-0000-0000-000000000001', 'COMUNICACAO E INFORMACAO', 6),
  ('nr1-percepcao-geral-do-clima', 'a1000000-0000-0000-0000-000000000001', 'PERCEPCAO GERAL DO CLIMA', 7),
  ('nr1-riscos-ergonomicos', 'a1000000-0000-0000-0000-000000000001', 'RISCOS ERGONOMICOS', 8),
  ('nr1-riscos-ambientais', 'a1000000-0000-0000-0000-000000000001', 'RISCOS AMBIENTAIS', 9),
  ('nr1-riscos-quimicos-biologicos', 'a1000000-0000-0000-0000-000000000001', 'RISCOS QUIMICOS/BIOLOGICOS', 10),
  ('nr1-repetitividade', 'a1000000-0000-0000-0000-000000000001', 'REPETITIVIDADE', 11);

insert into public.questionnaire_questions (id, section_id, prompt, answer_type, scoring_direction, weight, is_required, is_active, order_index)
values
  ('nr1-organizacao-do-trabalho-e-jornada-q01', 'nr1-organizacao-do-trabalho-e-jornada', 'Consigo cumprir minha jornada de trabalho sem necessidade frequente de horas extras', 'likert_1_5', 'negative', 1.0, true, true, 0),
  ('nr1-organizacao-do-trabalho-e-jornada-q02', 'nr1-organizacao-do-trabalho-e-jornada', 'Quando ha necessidade de horas extras, isso ocorre de forma voluntaria e planejada.', 'likert_1_5', 'negative', 1.0, true, true, 1),
  ('nr1-organizacao-do-trabalho-e-jornada-q03', 'nr1-organizacao-do-trabalho-e-jornada', 'Consigo realizar minhas atividades SEM pressa excessiva ou pressao constante', 'likert_1_5', 'negative', 1.0, true, true, 2),
  ('nr1-organizacao-do-trabalho-e-jornada-q04', 'nr1-organizacao-do-trabalho-e-jornada', 'As metas do meu SETOR sao claras e alcancaveis dentro da jornada normal', 'likert_1_5', 'negative', 1.0, true, true, 3),
  ('nr1-organizacao-do-trabalho-e-jornada-q05', 'nr1-organizacao-do-trabalho-e-jornada', 'Tenho pausas suficientes para descanso.', 'likert_1_5', 'negative', 1.0, true, true, 4),
  ('nr1-previsibilidade-e-rotina-q01', 'nr1-previsibilidade-e-rotina', 'Alteracoes de horario ou escala sao comunicadas com antecedencia razoavel e de forma planejada', 'likert_1_5', 'negative', 1.0, true, true, 0),
  ('nr1-previsibilidade-e-rotina-q02', 'nr1-previsibilidade-e-rotina', 'Quando me ausento, o trabalho pode ser reorganizado sem sobrecarga excessiva para mim ou para a equipe e com apoio de diaristas.', 'likert_1_5', 'negative', 1.0, true, true, 1),
  ('nr1-previsibilidade-e-rotina-q03', 'nr1-previsibilidade-e-rotina', 'Tenho clareza sobre minhas responsabilidades e o que se espera do meu trabalho, quando estou no meu posto de trabalho.', 'likert_1_5', 'negative', 1.0, true, true, 2),
  ('nr1-previsibilidade-e-rotina-q04', 'nr1-previsibilidade-e-rotina', 'Minha rotina de trabalho e previsivel quanto a horarios e dias trabalhados', 'likert_1_5', 'negative', 1.0, true, true, 3),
  ('nr1-autonomia-participacao-e-sentido-do-trabalho-q01', 'nr1-autonomia-participacao-e-sentido-do-trabalho', 'Tenho autonomia para executar as minhas tarefas no dia a dia.', 'likert_1_5', 'negative', 1.0, true, true, 0),
  ('nr1-autonomia-participacao-e-sentido-do-trabalho-q02', 'nr1-autonomia-participacao-e-sentido-do-trabalho', 'Posso sugerir melhorias ou mudancas na forma de realizar minhas atividades', 'likert_1_5', 'negative', 1.0, true, true, 1),
  ('nr1-autonomia-participacao-e-sentido-do-trabalho-q03', 'nr1-autonomia-participacao-e-sentido-do-trabalho', 'Sinto que meu trabalho e util, importante e reconhecido no ambiente de trabalho', 'likert_1_5', 'negative', 1.0, true, true, 2),
  ('nr1-relacoes-lideranca-e-respeito-q01', 'nr1-relacoes-lideranca-e-respeito', 'Sou tratado(a) com respeito por colegas e liderancas.', 'likert_1_5', 'negative', 1.0, true, true, 0),
  ('nr1-relacoes-lideranca-e-respeito-q02', 'nr1-relacoes-lideranca-e-respeito', 'A forma como recebo orientacoes da lideranca e clara e respeitosa', 'likert_1_5', 'negative', 1.0, true, true, 1),
  ('nr1-relacoes-lideranca-e-respeito-q03', 'nr1-relacoes-lideranca-e-respeito', 'Sinto-me confortavel para tirar duvidas ou pedir ajuda, quando necessario', 'likert_1_5', 'negative', 1.0, true, true, 2),
  ('nr1-relacoes-lideranca-e-respeito-q04', 'nr1-relacoes-lideranca-e-respeito', 'Posso buscar apoio do RH quando sinto necessidade', 'likert_1_5', 'negative', 1.0, true, true, 3),
  ('nr1-relacoes-lideranca-e-respeito-q05', 'nr1-relacoes-lideranca-e-respeito', 'Conflitos no ambiente de trabalho sao tratados de forma adequada quando surgem ?', 'likert_1_5', 'negative', 1.0, true, true, 4),
  ('nr1-pressao-cobranca-e-clima-psicologico-q01', 'nr1-pressao-cobranca-e-clima-psicologico', 'Sinto que a cobranca por resultados ocorre de forma justa e equilibrada', 'likert_1_5', 'negative', 1.0, true, true, 0),
  ('nr1-pressao-cobranca-e-clima-psicologico-q02', 'nr1-pressao-cobranca-e-clima-psicologico', 'Sinto seguranca de que eventuais dificuldades em atingir resultados sao tratadas de forma respeitosa.', 'likert_1_5', 'negative', 1.0, true, true, 1),
  ('nr1-pressao-cobranca-e-clima-psicologico-q03', 'nr1-pressao-cobranca-e-clima-psicologico', 'O ambiente de trabalho e emocionalmente seguro, incentiva o respeito entre as pessoas', 'likert_1_5', 'negative', 1.0, true, true, 2),
  ('nr1-pressao-cobranca-e-clima-psicologico-q04', 'nr1-pressao-cobranca-e-clima-psicologico', 'Salvo excecoes, respeito e cumpro as pausas diarias ( para lanchar/descanso e almocar) no meu local de trabalho', 'likert_1_5', 'negative', 1.0, true, true, 3),
  ('nr1-saude-bem-estar-e-suporte-q01', 'nr1-saude-bem-estar-e-suporte', 'A empresa permite me ausentar para cuidar da minha saude e resolver situacoes pessoais, quando necessario.', 'likert_1_5', 'negative', 1.0, true, true, 0),
  ('nr1-saude-bem-estar-e-suporte-q02', 'nr1-saude-bem-estar-e-suporte', 'Posso comunicar problemas de saude sem receio de consequencias negativas', 'likert_1_5', 'negative', 1.0, true, true, 1),
  ('nr1-saude-bem-estar-e-suporte-q03', 'nr1-saude-bem-estar-e-suporte', 'Percebo preocupacao da empresa com o bem-estar das pessoas', 'likert_1_5', 'negative', 1.0, true, true, 2),
  ('nr1-saude-bem-estar-e-suporte-q04', 'nr1-saude-bem-estar-e-suporte', 'Meu ambiente de trabalho encoraja o bem estar fisico, alimentacao saudavel e estilo de vida ativo.', 'likert_1_5', 'negative', 1.0, true, true, 3),
  ('nr1-comunicacao-e-informacao-q01', 'nr1-comunicacao-e-informacao', 'As informacoes importantes da empresa sao feitas de forma clara e acessivel.', 'likert_1_5', 'negative', 1.0, true, true, 0),
  ('nr1-comunicacao-e-informacao-q02', 'nr1-comunicacao-e-informacao', 'Existem canais adequados para comunicacao interna', 'likert_1_5', 'negative', 1.0, true, true, 1),
  ('nr1-comunicacao-e-informacao-q03', 'nr1-comunicacao-e-informacao', 'Sei a quem recorrer, incluindo o RH ou a lideranca para buscar orientacao ou apoio, quando necessario.', 'likert_1_5', 'negative', 1.0, true, true, 2),
  ('nr1-percepcao-geral-do-clima-q01', 'nr1-percepcao-geral-do-clima', 'Considero o clima de trabalho do meu setor positivo', 'likert_1_5', 'negative', 1.0, true, true, 0),
  ('nr1-percepcao-geral-do-clima-q02', 'nr1-percepcao-geral-do-clima', 'Sinto-me motivado(a) para realizar minhas atividades', 'likert_1_5', 'negative', 1.0, true, true, 1),
  ('nr1-percepcao-geral-do-clima-q03', 'nr1-percepcao-geral-do-clima', 'O trabalho afeta negativamente minha vida pessoal ou familiar', 'likert_1_5', 'negative', 1.0, true, true, 2),
  ('nr1-riscos-ergonomicos-q01', 'nr1-riscos-ergonomicos', 'Meu posto de trabalho permite postura adequada durante a costura.', 'likert_1_5', 'negative', 1.0, true, true, 0),
  ('nr1-riscos-ergonomicos-q02', 'nr1-riscos-ergonomicos', 'Consigo ajustar cadeira, mesa ou apoio para trabalhar com conforto.', 'likert_1_5', 'negative', 1.0, true, true, 1),
  ('nr1-riscos-ergonomicos-q03', 'nr1-riscos-ergonomicos', 'Tenho pausas suficientes para reduzir cansaco fisico e muscular.', 'likert_1_5', 'negative', 1.0, true, true, 2),
  ('nr1-riscos-ergonomicos-q04', 'nr1-riscos-ergonomicos', 'Recebo orientacao sobre postura correta e ergonomia no posto de trabalho.', 'likert_1_5', 'negative', 1.0, true, true, 3),
  ('nr1-riscos-ergonomicos-q05', 'nr1-riscos-ergonomicos', 'Os movimentos exigidos pela minha atividade nao causam desconforto excessivo.', 'likert_1_5', 'negative', 1.0, true, true, 4),
  ('nr1-riscos-ergonomicos-q06', 'nr1-riscos-ergonomicos', 'Os equipamentos que utilizo favorecem um trabalho seguro e confortavel.', 'likert_1_5', 'negative', 1.0, true, true, 5),
  ('nr1-riscos-ergonomicos-q07', 'nr1-riscos-ergonomicos', 'Tenho espaco adequado para executar meus movimentos com seguranca.', 'likert_1_5', 'negative', 1.0, true, true, 6),
  ('nr1-riscos-ergonomicos-q08', 'nr1-riscos-ergonomicos', 'Sinto que a organizacao do posto ajuda a prevenir dores e lesoes.', 'likert_1_5', 'negative', 1.0, true, true, 7),
  ('nr1-riscos-ambientais-q01', 'nr1-riscos-ambientais', 'A ventilacao do ambiente de trabalho e adequada durante a jornada.', 'likert_1_5', 'negative', 1.0, true, true, 0),
  ('nr1-riscos-ambientais-q02', 'nr1-riscos-ambientais', 'A temperatura do local de trabalho permanece confortavel na maior parte do tempo.', 'likert_1_5', 'negative', 1.0, true, true, 1),
  ('nr1-riscos-ambientais-q03', 'nr1-riscos-ambientais', 'O ruido do ambiente nao dificulta minha concentracao ou comunicacao.', 'likert_1_5', 'negative', 1.0, true, true, 2),
  ('nr1-riscos-ambientais-q04', 'nr1-riscos-ambientais', 'A iluminacao do meu posto e suficiente para realizar minhas atividades com seguranca.', 'likert_1_5', 'negative', 1.0, true, true, 3),
  ('nr1-riscos-ambientais-q05', 'nr1-riscos-ambientais', 'Percebo que o ambiente e mantido limpo e organizado durante a rotina.', 'likert_1_5', 'negative', 1.0, true, true, 4),
  ('nr1-riscos-ambientais-q06', 'nr1-riscos-ambientais', 'As condicoes gerais do ambiente contribuem para minha seguranca no trabalho.', 'likert_1_5', 'negative', 1.0, true, true, 5),
  ('nr1-riscos-quimicos-biologicos-q01', 'nr1-riscos-quimicos-biologicos', 'Recebo orientacao segura para lidar com materiais e residuos do processo.', 'likert_1_5', 'negative', 1.0, true, true, 0),
  ('nr1-riscos-quimicos-biologicos-q02', 'nr1-riscos-quimicos-biologicos', 'Tenho acesso aos EPIs necessarios quando existe risco de contato com substancias ou contaminantes.', 'likert_1_5', 'negative', 1.0, true, true, 1),
  ('nr1-riscos-quimicos-biologicos-q03', 'nr1-riscos-quimicos-biologicos', 'Os materiais utilizados no processo sao armazenados e manuseados com seguranca.', 'likert_1_5', 'negative', 1.0, true, true, 2),
  ('nr1-riscos-quimicos-biologicos-q04', 'nr1-riscos-quimicos-biologicos', 'Se houver contato com material contaminante, sei exatamente como agir.', 'likert_1_5', 'negative', 1.0, true, true, 3),
  ('nr1-riscos-quimicos-biologicos-q05', 'nr1-riscos-quimicos-biologicos', 'Percebo que a empresa monitora e controla adequadamente os riscos quimicos e biologicos.', 'likert_1_5', 'negative', 1.0, true, true, 4),
  ('nr1-repetitividade-q01', 'nr1-repetitividade', 'Consigo alternar movimentos ou tarefas para reduzir repeticao excessiva.', 'likert_1_5', 'negative', 1.0, true, true, 0),
  ('nr1-repetitividade-q02', 'nr1-repetitividade', 'A repeticao das minhas atividades nao gera fadiga excessiva ao longo do turno.', 'likert_1_5', 'negative', 1.0, true, true, 1),
  ('nr1-repetitividade-q03', 'nr1-repetitividade', 'Tenho suporte para comunicar desconforto relacionado a movimentos repetitivos.', 'likert_1_5', 'negative', 1.0, true, true, 2),
  ('nr1-repetitividade-q04', 'nr1-repetitividade', 'A organizacao do trabalho ajuda a prevenir desgaste por repetitividade.', 'likert_1_5', 'negative', 1.0, true, true, 3);

insert into public.campaigns (id, questionnaire_id, name, sector, unit, status, start_date, end_date, language, created_at)
values ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Diagnostico NR-1 - Setor de Costura', 'Producao', 'Costura', 'active', '2026-04-01', '2026-12-31', 'pt-BR', timezone('utc', now()));

select 'Questionarios' as tipo, count(*) as total from public.questionnaires
union all
select 'Secoes', count(*) from public.questionnaire_sections
union all
select 'Perguntas', count(*) from public.questionnaire_questions
union all
select 'Campanhas', count(*) from public.campaigns;

commit;
