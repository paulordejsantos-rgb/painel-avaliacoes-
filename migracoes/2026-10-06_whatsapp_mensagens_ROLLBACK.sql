-- Desfaz a migração 2026-10-06_whatsapp_mensagens.sql
-- Atenção: apaga todo o histórico de conversas do WhatsApp já guardado.

drop policy if exists "Mensagens admin le" on public.whatsapp_mensagens;
drop policy if exists "Mensagens colaborador le" on public.whatsapp_mensagens;
drop table if exists public.whatsapp_mensagens;
