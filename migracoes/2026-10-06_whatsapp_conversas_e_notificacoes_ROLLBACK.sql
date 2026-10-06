-- Desfaz a migração 2026-10-06_whatsapp_conversas_e_notificacoes.sql
-- Atenção: apaga os dados dessas duas tabelas (histórico de conversas
-- do WhatsApp e notificações já geradas). Não afeta a tabela leads.

drop policy if exists "Notificacoes admin le" on public.notificacoes;
drop policy if exists "Notificacoes colaborador le" on public.notificacoes;

drop table if exists public.notificacoes;
drop table if exists public.whatsapp_conversas;
