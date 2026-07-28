-- Display name for mentor invite preview; not collected at signup.

alter table public.profiles
  add column display_name text null;

comment on column public.profiles.display_name is
  'The name a preacher shows to people he mentors. Null until he first creates a mentoring invite, at which point he is prompted. Not collected at signup because as of 2026-07-28 no name existed anywhere for any of the 137 accounts and adding it to signup would change the form for every user to serve a feature few use. Read by preview_mentor_invite. Never fall back to the mentor email if null.';
