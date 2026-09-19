-- =====================================================================
-- Migração: admins explícitos no RLS + endurecimento de funções
-- Projeto Supabase: chwxepwdsyspcdkalaic
-- Data: 2026-09-19        Rollback: 2026-09-19_admins_explicitos_rls_ROLLBACK.sql
--
-- STATUS: PREPARADA, NÃO APLICADA. Revisar antes de rodar em produção.
--
-- Problema: as políticas "apenas admin" liberam acesso a QUALQUER usuário
-- logado que não esteja em perfis_restaurante. Hoje só existe 1 usuário
-- assim, mas uma conta nova (cadastro aberto, convite errado) ganharia
-- acesso total a leads, CRM e financeiro.
--
-- Solução: tabela `admins` com lista explícita e políticas que exigem
-- estar nela. Restaurantes continuam sem acesso; contas novas também.
-- =====================================================================

begin;

-- 1) Tabela de admins ---------------------------------------------------
create table if not exists public.admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  criado_em  timestamptz not null default now()
);

alter table public.admins enable row level security;

-- Cada usuário só enxerga a própria linha (necessário para as políticas
-- abaixo funcionarem sem função SECURITY DEFINER). Ninguém escreve pela API.
drop policy if exists "Usuario ve o proprio registro admin" on public.admins;
create policy "Usuario ve o proprio registro admin"
  on public.admins for select to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.admins from anon;
revoke insert, update, delete, truncate, references, trigger on public.admins from authenticated;

-- 2) Cadastra como admin quem hoje tem acesso (não é restaurante) -------
insert into public.admins (user_id)
select u.id
from auth.users u
where not exists (select 1 from public.perfis_restaurante p where p.user_id = u.id)
on conflict (user_id) do nothing;

-- Trava de segurança: hoje deve haver exatamente 1 admin. Se houver outro
-- número, aborta tudo (a transação inteira é desfeita) para você revisar.
do $$
declare n int;
begin
  select count(*) into n from public.admins;
  if n <> 1 then
    raise exception 'Esperava exatamente 1 admin, encontrei %. Revise auth.users antes de aplicar.', n;
  end if;
end $$;

-- 3) Políticas: trocar "não é restaurante" por "está em admins" ---------
-- leads
drop policy if exists "Leads apenas admin" on public.leads;
create policy "Leads apenas admin" on public.leads
  for all to authenticated
  using      (exists (select 1 from public.admins a where a.user_id = (select auth.uid())))
  with check (exists (select 1 from public.admins a where a.user_id = (select auth.uid())));

-- crm_contatos
drop policy if exists "CRM apenas admin" on public.crm_contatos;
create policy "CRM apenas admin" on public.crm_contatos
  for all to authenticated
  using      (exists (select 1 from public.admins a where a.user_id = (select auth.uid())))
  with check (exists (select 1 from public.admins a where a.user_id = (select auth.uid())));

-- crm_estagio_historico
drop policy if exists "CRM historico apenas admin" on public.crm_estagio_historico;
create policy "CRM historico apenas admin" on public.crm_estagio_historico
  for all to authenticated
  using      (exists (select 1 from public.admins a where a.user_id = (select auth.uid())))
  with check (exists (select 1 from public.admins a where a.user_id = (select auth.uid())));

-- crm_interacoes
drop policy if exists "CRM interacoes apenas admin" on public.crm_interacoes;
create policy "CRM interacoes apenas admin" on public.crm_interacoes
  for all to authenticated
  using      (exists (select 1 from public.admins a where a.user_id = (select auth.uid())))
  with check (exists (select 1 from public.admins a where a.user_id = (select auth.uid())));

-- financeiro_cobrancas
drop policy if exists "Financeiro apenas admin" on public.financeiro_cobrancas;
create policy "Financeiro apenas admin" on public.financeiro_cobrancas
  for all to authenticated
  using      (exists (select 1 from public.admins a where a.user_id = (select auth.uid())))
  with check (exists (select 1 from public.admins a where a.user_id = (select auth.uid())));

-- sugestao_dia (escrita; a leitura pública para anon não muda)
drop policy if exists "Sugestao do dia apenas admin escreve" on public.sugestao_dia;
create policy "Sugestao do dia apenas admin escreve" on public.sugestao_dia
  for all to authenticated
  using      (exists (select 1 from public.admins a where a.user_id = (select auth.uid())))
  with check (exists (select 1 from public.admins a where a.user_id = (select auth.uid())));

-- avaliacoes (leitura: admin vê tudo; restaurante vê só as suas)
drop policy if exists "Leitura autenticada filtrada por restaurante" on public.avaliacoes;
create policy "Leitura autenticada filtrada por restaurante" on public.avaliacoes
  for select to authenticated
  using (
    exists (select 1 from public.admins a where a.user_id = (select auth.uid()))
    or restaurante = (
      select p.restaurante from public.perfis_restaurante p
      where p.user_id = (select auth.uid())
    )
  );
-- (a política "Permitir insercao publica" para anon continua como está)

-- 4) Funções (avisos do advisor) ----------------------------------------
-- rls_auto_enable é o gatilho de evento "ensure_rls"; ele dispara sem
-- depender do EXECUTE de anon/authenticated, então revogar é seguro.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

-- Fixa o search_path (o corpo só usa now(), que vive em pg_catalog).
alter function public.leads_atualiza_data_atualizacao() set search_path = '';

commit;

-- =====================================================================
-- Depois de aplicar, conferir (como admin, no painel):
--   • Leads, CRM, Financeiro e Avaliações carregam normalmente.
--   • Entrar como restaurante continua redirecionando para o portal e
--     mostra só as avaliações daquele restaurante.
--   • No Supabase: Advisors > Security não deve mais listar rls_auto_enable
--     nem leads_atualiza_data_atualizacao.
-- Fora do SQL (Authentication no painel do Supabase):
--   • Desligar "Allow new users to sign up" (se não houver cadastro público).
--   • Ligar "Leaked password protection".
-- Para adicionar outro admin no futuro:
--   insert into public.admins (user_id) values ('<uuid do usuário>');
-- =====================================================================
