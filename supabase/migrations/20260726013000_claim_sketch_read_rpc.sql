-- Serialize Sketch claim attach: lock the staging row, insert readiness_reads,
-- then delete staging in one transaction. A concurrent claim for the same
-- token blocks on the row lock, then finds staging gone and returns false.

create or replace function public.claim_sketch_read(
  p_user_id uuid,
  p_token text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token text := nullif(btrim(coalesce(p_token, '')), '');
  v_claim public.sketch_claims%rowtype;
begin
  if p_user_id is null or v_token is null then
    return false;
  end if;

  select *
  into v_claim
  from public.sketch_claims
  where token = v_token
  for update;

  if not found then
    return false;
  end if;

  if v_claim.expires_at < now() then
    return false;
  end if;

  insert into public.readiness_reads (
    user_id,
    sermon_id,
    primary_passage,
    ache,
    big_idea,
    gospel_turn,
    points,
    one_person,
    ending,
    read_output,
    prompt_version,
    mode,
    status_ache,
    status_big_idea,
    status_gospel_turn,
    status_points,
    status_one_person,
    status_ending,
    seam_hub,
    seam_spokes
  ) values (
    p_user_id,
    null,
    v_claim.primary_passage,
    v_claim.ache,
    v_claim.big_idea,
    v_claim.gospel_turn,
    v_claim.points,
    v_claim.one_person,
    v_claim.ending,
    v_claim.read_output,
    v_claim.prompt_version,
    v_claim.mode,
    v_claim.status_ache,
    v_claim.status_big_idea,
    v_claim.status_gospel_turn,
    v_claim.status_points,
    v_claim.status_one_person,
    v_claim.status_ending,
    v_claim.seam_hub,
    v_claim.seam_spokes
  );

  delete from public.sketch_claims
  where token = v_token;

  return true;
end;
$$;

revoke all on function public.claim_sketch_read(uuid, text) from public, anon, authenticated;
grant execute on function public.claim_sketch_read(uuid, text) to service_role;
