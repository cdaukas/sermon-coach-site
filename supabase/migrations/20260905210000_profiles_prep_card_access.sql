-- Prep card allowlist (mirrors profiles.growth_access).
alter table profiles
  add column prep_card_access boolean not null default false;
