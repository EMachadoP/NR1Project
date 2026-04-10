-- =====================================================
-- SEED DATA - QUESTIONARIO NR-1 SETOR DE COSTURA
-- =====================================================
-- Gerado automaticamente a partir de supabase/seeds/nr1-questionnaire.json
-- Avisos do importador:
-- divergencia detectada: a aba Questionario possui 8 secoes visiveis, mas a estrutura alvo exige 12.
-- =====================================================
begin;

delete from public.questionnaire_questions where section_id in (select id from public.questionnaire_sections where questionnaire_id in ('a1000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001'));
delete from public.questionnaire_sections where questionnaire_id in ('a1000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001');
delete from public.questionnaires where id in ('a1000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001');

insert into public.questionnaires (id, name, version, status, created_at, published_at)
values ('a1000000-0000-0000-0000-000000000001', 'Questionario NR-1 - Setor de Costura', 'v3.0.0', 'published', timezone('utc', now()), timezone('utc', now()));

insert into public.questionnaire_sections (id, questionnaire_id, name, order_index)
values
  ('8fad0745-2d6f-5e50-9061-71b8f29dc3a3', 'a1000000-0000-0000-0000-000000000001', 'ORGANIZACAO DO TRABALHO E JORNADA', 0),
  ('a6ab9106-dc10-5f32-8481-3625167d23c6', 'a1000000-0000-0000-0000-000000000001', 'PREVISIBILIDADE E ROTINA', 1),
  ('ec841035-a1c3-5541-9953-6311f7ef09ec', 'a1000000-0000-0000-0000-000000000001', 'AUTONOMIA, PARTICIPACAO E SENTIDO DO TRABALHO', 2),
  ('d2e6a7a1-86fb-5057-aaf3-9bb31fa40d53', 'a1000000-0000-0000-0000-000000000001', 'RELACOES, LIDERANCA E RESPEITO', 3),
  ('6572a7a4-3fb6-511e-a2a7-222ef90d28a0', 'a1000000-0000-0000-0000-000000000001', 'PRESSAO, COBRANCA E CLIMA PSICOLOGICO', 4),
  ('d023e56f-3ea5-5dda-8951-464fe759b427', 'a1000000-0000-0000-0000-000000000001', 'SAUDE, BEM-ESTAR E SUPORTE', 5),
  ('0d5995d1-5c4e-58d5-8fb4-d4a0d237d4e9', 'a1000000-0000-0000-0000-000000000001', 'COMUNICACAO E INFORMACAO', 6),
  ('6c7d5ba0-3c93-5fec-ad16-f3db8adb947b', 'a1000000-0000-0000-0000-000000000001', 'PERCEPCAO GERAL DO CLIMA', 7),
  ('272abaf6-5f82-54a5-a3a7-5c793ed0af92', 'a1000000-0000-0000-0000-000000000001', 'RISCOS ERGONOMICOS', 8),
  ('0f10bae9-09fb-52ec-bf5d-614b8cd88096', 'a1000000-0000-0000-0000-000000000001', 'RISCOS AMBIENTAIS', 9),
  ('683cbd7f-4ab8-5c58-b6cb-fbaa75d16f42', 'a1000000-0000-0000-0000-000000000001', 'RISCOS QUIMICOS/BIOLOGICOS', 10),
  ('aee4bb60-7021-5350-968e-703eae6033a9', 'a1000000-0000-0000-0000-000000000001', 'REPETITIVIDADE', 11);

insert into public.questionnaire_questions (id, section_id, prompt, answer_type, scoring_direction, weight, is_required, is_active, order_index)
values
  ('032ea4c0-4093-5f67-a59a-ff76c5ab04ee', '8fad0745-2d6f-5e50-9061-71b8f29dc3a3', 'Consigo cumprir minha jornada de trabalho sem necessidade frequente de horas extras', 'likert_1_5', 'negative', 1.0, true, true, 0),
  ('ca3ea762-5e4a-51de-9d0f-f9fff8121d9e', '8fad0745-2d6f-5e50-9061-71b8f29dc3a3', 'Quando ha necessidade de horas extras, isso ocorre de forma voluntaria e planejada.', 'likert_1_5', 'negative', 1.0, true, true, 1),
  ('922817c9-0d73-5ef3-b0e1-ed0e383db211', '8fad0745-2d6f-5e50-9061-71b8f29dc3a3', 'Consigo realizar minhas atividades SEM pressa excessiva ou pressao constante', 'likert_1_5', 'negative', 1.0, true, true, 2),
  ('5dc1b341-e9b7-52d5-8de1-6f92eef649c7', '8fad0745-2d6f-5e50-9061-71b8f29dc3a3', 'As metas do meu SETOR sao claras e alcancaveis dentro da jornada normal', 'likert_1_5', 'negative', 1.0, true, true, 3),
  ('22e4d019-0b2f-51bf-81d5-541fb4a6fc0a', '8fad0745-2d6f-5e50-9061-71b8f29dc3a3', 'Tenho pausas suficientes para descanso.', 'likert_1_5', 'negative', 1.0, true, true, 4),
  ('5ff9656f-8c98-57f7-90a5-17a6c6676ad9', 'a6ab9106-dc10-5f32-8481-3625167d23c6', 'Alteracoes de horario ou escala sao comunicadas com antecedencia razoavel e de forma planejada', 'likert_1_5', 'negative', 1.0, true, true, 0),
  ('1001b489-1f31-5793-862e-abcfd17bfcb6', 'a6ab9106-dc10-5f32-8481-3625167d23c6', 'Quando me ausento, o trabalho pode ser reorganizado sem sobrecarga excessiva para mim ou para a equipe e com apoio de diaristas.', 'likert_1_5', 'negative', 1.0, true, true, 1),
  ('0799a886-f06c-5381-9efb-98b5dbae42bf', 'a6ab9106-dc10-5f32-8481-3625167d23c6', 'Tenho clareza sobre minhas responsabilidades e o que se espera do meu trabalho, quando estou no meu posto de trabalho.', 'likert_1_5', 'negative', 1.0, true, true, 2),
  ('03ccd313-72bf-5fc8-bc47-f70520db1fd8', 'a6ab9106-dc10-5f32-8481-3625167d23c6', 'Minha rotina de trabalho e previsivel quanto a horarios e dias trabalhados', 'likert_1_5', 'negative', 1.0, true, true, 3),
  ('78d6377b-75be-5551-bea4-d8ce666ae017', 'ec841035-a1c3-5541-9953-6311f7ef09ec', 'Tenho autonomia para executar as minhas tarefas no dia a dia.', 'likert_1_5', 'negative', 1.0, true, true, 0),
  ('4ad11fdd-9cd2-58cd-a718-3568df04a06f', 'ec841035-a1c3-5541-9953-6311f7ef09ec', 'Posso sugerir melhorias ou mudancas na forma de realizar minhas atividades', 'likert_1_5', 'negative', 1.0, true, true, 1),
  ('4c4db671-a4fc-50fc-aeb0-13abc5f432c2', 'ec841035-a1c3-5541-9953-6311f7ef09ec', 'Sinto que meu trabalho e util, importante e reconhecido no ambiente de trabalho', 'likert_1_5', 'negative', 1.0, true, true, 2),
  ('7fca90bf-cf3e-5ea7-8191-e998a4ad34d2', 'd2e6a7a1-86fb-5057-aaf3-9bb31fa40d53', 'Sou tratado(a) com respeito por colegas e liderancas.', 'likert_1_5', 'negative', 1.0, true, true, 0),
  ('027aa1ee-5519-5b48-9203-28fac23d046b', 'd2e6a7a1-86fb-5057-aaf3-9bb31fa40d53', 'A forma como recebo orientacoes da lideranca e clara e respeitosa', 'likert_1_5', 'negative', 1.0, true, true, 1),
  ('310e4f9f-250f-50fd-8091-4a5bc335c20d', 'd2e6a7a1-86fb-5057-aaf3-9bb31fa40d53', 'Sinto-me confortavel para tirar duvidas ou pedir ajuda, quando necessario', 'likert_1_5', 'negative', 1.0, true, true, 2),
  ('423b02ea-a4a4-570c-9929-1901e0575267', 'd2e6a7a1-86fb-5057-aaf3-9bb31fa40d53', 'Posso buscar apoio do RH quando sinto necessidade', 'likert_1_5', 'negative', 1.0, true, true, 3),
  ('e9df8cda-e141-5ee8-bfa6-897e086922f7', 'd2e6a7a1-86fb-5057-aaf3-9bb31fa40d53', 'Conflitos no ambiente de trabalho sao tratados de forma adequada quando surgem ?', 'likert_1_5', 'negative', 1.0, true, true, 4),
  ('346eb0fb-eb26-561d-a869-7858d88a449f', '6572a7a4-3fb6-511e-a2a7-222ef90d28a0', 'Sinto que a cobranca por resultados ocorre de forma justa e equilibrada', 'likert_1_5', 'negative', 1.0, true, true, 0),
  ('a4373ff4-e23e-5b71-92ef-2b6a9e94d25b', '6572a7a4-3fb6-511e-a2a7-222ef90d28a0', 'Sinto seguranca de que eventuais dificuldades em atingir resultados sao tratadas de forma respeitosa.', 'likert_1_5', 'negative', 1.0, true, true, 1),
  ('a2bc20ca-2acd-555b-ab86-58ac9bcac2c1', '6572a7a4-3fb6-511e-a2a7-222ef90d28a0', 'O ambiente de trabalho e emocionalmente seguro, incentiva o respeito entre as pessoas', 'likert_1_5', 'negative', 1.0, true, true, 2),
  ('82f01731-4cc0-5e79-ad93-644b57da0af9', '6572a7a4-3fb6-511e-a2a7-222ef90d28a0', 'Salvo excecoes, respeito e cumpro as pausas diarias ( para lanchar/descanso e almocar) no meu local de trabalho', 'likert_1_5', 'negative', 1.0, true, true, 3),
  ('66c6af9a-188c-5314-9372-7cb64fc82752', 'd023e56f-3ea5-5dda-8951-464fe759b427', 'A empresa permite me ausentar para cuidar da minha saude e resolver situacoes pessoais, quando necessario.', 'likert_1_5', 'negative', 1.0, true, true, 0),
  ('d3335dd0-9d6a-53f5-b916-72d0d32b963f', 'd023e56f-3ea5-5dda-8951-464fe759b427', 'Posso comunicar problemas de saude sem receio de consequencias negativas', 'likert_1_5', 'negative', 1.0, true, true, 1),
  ('04441dbc-9bd8-5643-9d65-1c1f9b29fd5c', 'd023e56f-3ea5-5dda-8951-464fe759b427', 'Percebo preocupacao da empresa com o bem-estar das pessoas', 'likert_1_5', 'negative', 1.0, true, true, 2),
  ('18ca8e60-01f4-5d13-919e-7be1e5631337', 'd023e56f-3ea5-5dda-8951-464fe759b427', 'Meu ambiente de trabalho encoraja o bem estar fisico, alimentacao saudavel e estilo de vida ativo.', 'likert_1_5', 'negative', 1.0, true, true, 3),
  ('95c3c66f-bc98-51fb-b1e3-327fda720254', '0d5995d1-5c4e-58d5-8fb4-d4a0d237d4e9', 'As informacoes importantes da empresa sao feitas de forma clara e acessivel.', 'likert_1_5', 'negative', 1.0, true, true, 0),
  ('acd5eaed-8121-51ac-ad44-d738f3d9b6ac', '0d5995d1-5c4e-58d5-8fb4-d4a0d237d4e9', 'Existem canais adequados para comunicacao interna', 'likert_1_5', 'negative', 1.0, true, true, 1),
  ('ec5f8b3f-f938-5322-ba50-12e5246afd19', '0d5995d1-5c4e-58d5-8fb4-d4a0d237d4e9', 'Sei a quem recorrer, incluindo o RH ou a lideranca para buscar orientacao ou apoio, quando necessario.', 'likert_1_5', 'negative', 1.0, true, true, 2),
  ('b53d4819-335a-5753-998d-5d24a2d015a3', '6c7d5ba0-3c93-5fec-ad16-f3db8adb947b', 'Considero o clima de trabalho do meu setor positivo', 'likert_1_5', 'negative', 1.0, true, true, 0),
  ('de3099d2-2a96-5eab-9616-92254887932c', '6c7d5ba0-3c93-5fec-ad16-f3db8adb947b', 'Sinto-me motivado(a) para realizar minhas atividades', 'likert_1_5', 'negative', 1.0, true, true, 1),
  ('a84a88f7-0b64-5690-9ac4-e28c50ab8b5f', '6c7d5ba0-3c93-5fec-ad16-f3db8adb947b', 'O trabalho afeta negativamente minha vida pessoal ou familiar', 'likert_1_5', 'negative', 1.0, true, true, 2),
  ('9c197436-4e1e-5e01-a67a-21fc7157a46f', '272abaf6-5f82-54a5-a3a7-5c793ed0af92', 'Meu posto de trabalho permite postura adequada durante a costura.', 'likert_1_5', 'negative', 1.0, true, true, 0),
  ('655667ca-9ef7-54e9-85ad-46cc9e2322f4', '272abaf6-5f82-54a5-a3a7-5c793ed0af92', 'Consigo ajustar cadeira, mesa ou apoio para trabalhar com conforto.', 'likert_1_5', 'negative', 1.0, true, true, 1),
  ('4fcfea68-8e48-5c9f-aba8-8a100d541cfc', '272abaf6-5f82-54a5-a3a7-5c793ed0af92', 'Tenho pausas suficientes para reduzir cansaco fisico e muscular.', 'likert_1_5', 'negative', 1.0, true, true, 2),
  ('f1e74995-dc5e-5799-8766-bbb4ed08896a', '272abaf6-5f82-54a5-a3a7-5c793ed0af92', 'Recebo orientacao sobre postura correta e ergonomia no posto de trabalho.', 'likert_1_5', 'negative', 1.0, true, true, 3),
  ('5b27264f-0f2c-5211-8247-05ad8105c565', '272abaf6-5f82-54a5-a3a7-5c793ed0af92', 'Os movimentos exigidos pela minha atividade nao causam desconforto excessivo.', 'likert_1_5', 'negative', 1.0, true, true, 4),
  ('f95e4b48-2f32-5716-b400-9c12d0acf2e9', '272abaf6-5f82-54a5-a3a7-5c793ed0af92', 'Os equipamentos que utilizo favorecem um trabalho seguro e confortavel.', 'likert_1_5', 'negative', 1.0, true, true, 5),
  ('b2422f6a-53b0-502d-906d-9939dd57072b', '272abaf6-5f82-54a5-a3a7-5c793ed0af92', 'Tenho espaco adequado para executar meus movimentos com seguranca.', 'likert_1_5', 'negative', 1.0, true, true, 6),
  ('f1aab4ad-5fef-597e-99a6-43b6ab51d11e', '272abaf6-5f82-54a5-a3a7-5c793ed0af92', 'Sinto que a organizacao do posto ajuda a prevenir dores e lesoes.', 'likert_1_5', 'negative', 1.0, true, true, 7),
  ('1795d66b-b095-55ff-a306-2e2b77d583ef', '0f10bae9-09fb-52ec-bf5d-614b8cd88096', 'A ventilacao do ambiente de trabalho e adequada durante a jornada.', 'likert_1_5', 'negative', 1.0, true, true, 0),
  ('95625eaa-f84f-5592-8282-4bbf68738b21', '0f10bae9-09fb-52ec-bf5d-614b8cd88096', 'A temperatura do local de trabalho permanece confortavel na maior parte do tempo.', 'likert_1_5', 'negative', 1.0, true, true, 1),
  ('e0e4b59b-19e7-5b3c-a196-dfe5a261636a', '0f10bae9-09fb-52ec-bf5d-614b8cd88096', 'O ruido do ambiente nao dificulta minha concentracao ou comunicacao.', 'likert_1_5', 'negative', 1.0, true, true, 2),
  ('f2de02a2-3130-565c-a4ac-f629f374cfbb', '0f10bae9-09fb-52ec-bf5d-614b8cd88096', 'A iluminacao do meu posto e suficiente para realizar minhas atividades com seguranca.', 'likert_1_5', 'negative', 1.0, true, true, 3),
  ('b8ae5fc5-c939-50e5-b48a-8cb2a601f3a0', '0f10bae9-09fb-52ec-bf5d-614b8cd88096', 'Percebo que o ambiente e mantido limpo e organizado durante a rotina.', 'likert_1_5', 'negative', 1.0, true, true, 4),
  ('fb420a8c-abfb-5bf9-8608-82b7ff76fbe4', '0f10bae9-09fb-52ec-bf5d-614b8cd88096', 'As condicoes gerais do ambiente contribuem para minha seguranca no trabalho.', 'likert_1_5', 'negative', 1.0, true, true, 5),
  ('cf6f0252-42b0-5fad-ab4d-235658fb900f', '683cbd7f-4ab8-5c58-b6cb-fbaa75d16f42', 'Recebo orientacao segura para lidar com materiais e residuos do processo.', 'likert_1_5', 'negative', 1.0, true, true, 0),
  ('cfb76548-c76d-50e0-a72c-6b8bbc02c396', '683cbd7f-4ab8-5c58-b6cb-fbaa75d16f42', 'Tenho acesso aos EPIs necessarios quando existe risco de contato com substancias ou contaminantes.', 'likert_1_5', 'negative', 1.0, true, true, 1),
  ('af886ba6-60ed-587b-9843-7bcaea647b0a', '683cbd7f-4ab8-5c58-b6cb-fbaa75d16f42', 'Os materiais utilizados no processo sao armazenados e manuseados com seguranca.', 'likert_1_5', 'negative', 1.0, true, true, 2),
  ('fdf46b2a-b39f-5c6a-adde-18319f7638b0', '683cbd7f-4ab8-5c58-b6cb-fbaa75d16f42', 'Se houver contato com material contaminante, sei exatamente como agir.', 'likert_1_5', 'negative', 1.0, true, true, 3),
  ('304e8bea-2cce-5bb6-8b83-eaaf43bcdde0', '683cbd7f-4ab8-5c58-b6cb-fbaa75d16f42', 'Percebo que a empresa monitora e controla adequadamente os riscos quimicos e biologicos.', 'likert_1_5', 'negative', 1.0, true, true, 4),
  ('00c4eaf2-c86c-51cb-9667-8349503a24ee', 'aee4bb60-7021-5350-968e-703eae6033a9', 'Consigo alternar movimentos ou tarefas para reduzir repeticao excessiva.', 'likert_1_5', 'negative', 1.0, true, true, 0),
  ('0f2ffb7b-fc3f-531b-a237-9a06e4dde550', 'aee4bb60-7021-5350-968e-703eae6033a9', 'A repeticao das minhas atividades nao gera fadiga excessiva ao longo do turno.', 'likert_1_5', 'negative', 1.0, true, true, 1),
  ('c274a0eb-21a8-59fc-9b84-15e93b29b5c7', 'aee4bb60-7021-5350-968e-703eae6033a9', 'Tenho suporte para comunicar desconforto relacionado a movimentos repetitivos.', 'likert_1_5', 'negative', 1.0, true, true, 2),
  ('e950fdea-a045-5a2c-be34-5da128f89df7', 'aee4bb60-7021-5350-968e-703eae6033a9', 'A organizacao do trabalho ajuda a prevenir desgaste por repetitividade.', 'likert_1_5', 'negative', 1.0, true, true, 3);

select 'Questionarios' as tipo, count(*) as total from public.questionnaires
union all
select 'Secoes', count(*) from public.questionnaire_sections
union all
select 'Perguntas', count(*) from public.questionnaire_questions
union all
select 'Campanhas', count(*) from public.campaigns;

commit;
