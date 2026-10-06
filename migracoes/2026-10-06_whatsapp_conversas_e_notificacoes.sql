-- =====================================================================
-- Migração: automação do WhatsApp (menu automático + lead automático)
-- e central de notificações do painel.
-- Projeto Supabase: chwxepwdsyspcdkalaic
-- Data: 2026-10-06        Rollback: 2026-10-06_whatsapp_conversas_e_notificacoes_ROLLBACK.sql
--
-- STATUS: APLICADA em 06/10/2026.
--
-- Contexto: a função whatsapp-webhook agora manda uma saudação com menu
-- (1/2/3) para quem escreve pela primeira vez, cria um lead automático
-- na aba Leads e avisa o painel. Duas tabelas novas:
--
-- 1) whatsapp_conversas: guarda o estado da conversa de cada número
--    (já mandou o menu? qual opção escolheu?). Só a função (service
--    role) acessa — RLS ligado automaticamente pelo gatilho ensure_rls,
--    sem nenhuma política, então nem authenticated nem anon enxergam.
--
-- 2) notificacoes: avisos simples (novo contato, pedido de suporte,
--    pedido para falar com o Paulo) que aparecem no sino do cabeçalho
--    e na página notificacoes.html. Quem grava é sempre a função
--    (service role, ignora RLS); admins e colaboradores só leem.
-- =====================================================================

create table if not exists public.whatsapp_conversas (
  telefone      text primary key,
  lead_id       uuid references public.leads(id) on delete set null,
  estado        text not null default 'novo',
  nome_perfil   text,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.notificacoes (
  id         uuid primary key default gen_random_uuid(),
  tipo       text not null,
  titulo     text not null,
  mensagem   text,
  lead_id    uuid references public.leads(id) on delete set null,
  criado_em  timestamptz not null default now()
);

create policy "Notificacoes admin le"
  on public.notificacoes for select to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

create policy "Notificacoes colaborador le"
  on public.notificacoes for select to authenticated
  using (exists (select 1 from public.colaboradores c where c.user_id = auth.uid()));
