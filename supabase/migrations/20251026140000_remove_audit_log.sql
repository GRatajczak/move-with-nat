-- migration: remove audit_log and partitions if present
-- purpose: honor decision to drop audit trail from schema
-- affected: tables (public.audit_log, public.audit_log_default), partitions (public.audit_log_yyyymm*)

do $$
declare
  part record;
begin
  -- drop known default partition if exists
  if to_regclass('public.audit_log_default') is not null then
    execute 'drop table if exists public.audit_log_default cascade';
  end if;

  -- drop dynamically named monthly partitions matching audit_log_YYYYMM
  for part in
    select n.nspname as schema_name, c.relname as table_name
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and c.relname ~ '^audit_log_\\d{6}$'
  loop
    execute format('drop table if exists %I.%I cascade', part.schema_name, part.table_name);
  end loop;

  -- finally drop the parent table if it exists
  if to_regclass('public.audit_log') is not null then
    execute 'drop table if exists public.audit_log cascade';
  end if;
end $$;


