-- =====================================================================
-- Migração: histórico completo das conversas do WhatsApp
-- Projeto Supabase: chwxepwdsyspcdkalaic
-- Data: 2026-10-06        Rollback: 2026-10-06_whatsapp_mensagens_ROLLBACK.sql
--
-- STATUS: APLICADA em 06/10/2026.
--
-- Contexto: o número da empresa cadastrado na WhatsApp Cloud API não
-- pode ser usado no WhatsApp Web normal (fica reservado para a API).
-- Para o Paulo conseguir ver a conversa completa (não só um resumo em
-- notificacoes), a função whatsapp-webhook agora grava cada mensagem
-- — recebida do cliente ou enviada pelo robô — nesta tabela. A tela
-- whatsapp.html lê daqui para montar a conversa, estilo chat.
--
-- Só a função (service role) grava; admins e colaboradores só leem.
-- =====================================================================

create table if not exists public.whatsapp_mensagens (
  id         uuid primary key default gen_random_uuid(),
  telefone   text not null,
  lead_id    uuid references public.leads(id) on delete set null,
  direcao    text not null check (direcao in ('recebida','enviada')),
  texto      text not null,
  criado_em  timestamptz not null default now()
);

create index if not exists whatsapp_mensagens_telefone_idx
  on public.whatsapp_mensagens (telefone, criado_em);

create policy "Mensagens admin le"
  on public.whatsapp_mensagens for select to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

create policy "Mensagens colaborador le"
  on public.whatsapp_mensagens for select to authenticated
  using (exists (select 1 from public.colaboradores c where c.user_id = auth.uid()));
