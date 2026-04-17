-- Public-facing infrastructure checkboxes for listings
alter table plots add column if not exists infra_electricity boolean null;
alter table plots add column if not exists infra_water       boolean null;
alter table plots add column if not exists infra_gas         boolean null;
alter table plots add column if not exists infra_road        boolean null;
