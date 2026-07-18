-- CareOS Suite — Family / next-of-kin portal
-- Run this AFTER schema.sql.
--
-- How this works: each client gets a random, unguessable token. A family
-- member with the link (containing the token) can view a read-only
-- summary of that ONE client's care plan and recent visits — nothing else.
--
-- This does NOT open up the clients/care_plans/visit_notes tables to
-- public read. Instead, everything goes through a single Postgres
-- function (`get_family_portal`) that only returns data matching the
-- exact token it's given. The function runs with elevated privileges
-- (security definer) but only the app's anon key can call it, and only
-- ever gets back the one client's data tied to that token.

alter table clients
  add column if not exists family_access_token uuid not null default gen_random_uuid();

create or replace function get_family_portal(p_token uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  result json;
begin
  select json_build_object(
    'client', json_build_object(
      'id', c.id,
      'name', c.name,
      'care_need', c.care_need
    ),
    'care_plan', json_build_object(
      'goals', cp.goals,
      'needs', cp.needs,
      'risks', cp.risks
    ),
    'visit_notes', (
      select coalesce(json_agg(
               json_build_object('note', vn.note, 'created_at', vn.created_at)
               order by vn.created_at desc
             ), '[]'::json)
      from (
        select * from visit_notes
        where client_id = c.id
        order by created_at desc
        limit 10
      ) vn
    )
  )
  into result
  from clients c
  left join care_plans cp on cp.client_id = c.id
  where c.family_access_token = p_token;

  return result;
end;
$$;

-- Only allow this one function to be called by the public (anon) key —
-- the underlying tables themselves stay locked to authenticated users.
grant execute on function get_family_portal(uuid) to anon;
