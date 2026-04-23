-- Legacy rename: early envs created infra_road in the old 009 migration and
-- this file renamed it to infra_sewer. The final-state column is now created
-- directly in 016_infrastructure_fields.sql, so this migration is kept only
-- for historical reproducibility and is a no-op on any env where infra_road
-- no longer exists (fresh setups, or envs that already ran it).
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'plots'
      and column_name = 'infra_road'
  ) then
    alter table plots rename column infra_road to infra_sewer;
  end if;
end$$;
