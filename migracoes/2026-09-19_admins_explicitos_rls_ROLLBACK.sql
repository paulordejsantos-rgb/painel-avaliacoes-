-- =====================================================================
-- ROLLBACK de 2026-09-19_admins_explicitos_rls.sql
-- Restaura as políticas originais ("não é restaurante" = admin), as
-- permissões da função e remove a tabela admins.
-- =====================================================================

begin;

drop policy if exists "Leads apenas admin" on public.leads;
create policy "Leads apenas admin" on public.leads
  for all to authenticated
  using      (not exists (select 1 from public.perfis_restaurante p where p.user_id = auth.uid()))
  with check (not exists (select 1 from public.perfis_restaurante p where p.user_id = auth.uid()));

drop policy if exists "CRM apenas admin" on public.crm_contatos;
create policy "CRM apenas admin" on public.crm_contatos
  for all to authenticated
  using      (not exists (select 1 from public.perfis_restaurante p where p.user_id = auth.uid()))
  with check (not exists (select 1 from public.perfis_restaurante p where p.user_id = auth.uid()));

drop policy if exists "CRM historico apenas admin" on public.crm_estagio_historico;
create policy "CRM historico apenas admin" on public.crm_estagio_historico
  for all to authenticated
  using      (not exists (select 1 from public.perfis_restaurante p where p.user_id = auth.uid()))
  with check (not exists (select 1 from public.perfis_restaurante p where p.user_id = auth.uid()));

drop policy if exists "CRM interacoes apenas admin" on public.crm_interacoes;
create policy "CRM interacoes apenas admin" on public.crm_interacoes
  for all to authenticated
  using      (not exists (select 1 from public.perfis_restaurante p where p.user_id = auth.uid()))
  with check (not exists (select 1 from public.perfis_restaurante p where p.user_id = auth.uid()));

drop policy if exists "Financeiro apenas admin" on public.financeiro_cobrancas;
create policy "Financeiro apenas admin" on public.financeiro_cobrancas
  for all to authenticated
  using      (not exists (select 1 from public.perfis_restaurante p where p.user_id = auth.uid()))
  with check (not exists (select 1 from public.perfis_restaurante p where p.user_id = auth.uid()));

drop policy if exists "Sugestao do dia apenas admin escreve" on public.sugestao_dia;
create policy "Sugestao do dia apenas admin escreve" on public.sugestao_dia
  for all to authenticated
  using      (not exists (select 1 from public.perfis_restaurante p where p.user_id = auth.uid()))
  with check (not exists (select 1 from public.perfis_restaurante p where p.user_id = auth.uid()));

drop policy if exists "Leitura autenticada filtrada por restaurante" on public.avaliacoes;
create policy "Leitura autenticada filtrada por restaurante" on public.avaliacoes
  for select to authenticated
  using (
    not exists (select 1 from public.perfis_restaurante p where p.user_id = auth.uid())
    or restaurante = (select p.restaurante from public.perfis_restaurante p where p.user_id = auth.uid())
  );

-- Estado original da função (EXECUTE liberado por padrão) e do search_path.
grant execute on function public.rls_auto_enable() to public, anon, authenticated;
alter function public.leads_atualiza_data_atualizacao() reset search_path;

drop table if exists public.admins;

commit;
