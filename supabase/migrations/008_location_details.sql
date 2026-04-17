-- Precise location / landmarks field
alter table plots add column if not exists location_details text null;
