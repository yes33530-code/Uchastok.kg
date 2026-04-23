-- Public-facing infrastructure checkboxes for listings.
-- Originally authored as 009_infrastructure_fields.sql (created infra_road);
-- 010_rename_infra_road_to_sewer.sql then renamed infra_road -> infra_sewer.
-- This file is the consolidated final state: idempotent, creates infra_sewer
-- directly, and safe to run on a fresh database or on one where 010 already ran.
alter table plots add column if not exists infra_electricity boolean null;
alter table plots add column if not exists infra_water       boolean null;
alter table plots add column if not exists infra_gas         boolean null;
alter table plots add column if not exists infra_sewer       boolean null;
