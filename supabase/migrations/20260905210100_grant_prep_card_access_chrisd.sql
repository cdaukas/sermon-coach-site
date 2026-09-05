-- Explicit grant: chrisd@gtn.org only.
-- auth.uid() does not resolve in the SQL editor; use the UUID.
update public.profiles
set prep_card_access = true
where id = '381edea4-dd32-41b4-9616-8da065e1d0d2';
