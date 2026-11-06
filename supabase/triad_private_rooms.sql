-- FRAKTUM TCG: isolated 3-player private rooms. Does not modify existing 1v1 tables.
create table if not exists public.triad_rooms (
  id uuid primary key default gen_random_uuid(),
  invite_code text not null unique check (invite_code ~ '^[A-F0-9]{6}$'),
  seed integer not null check (seed > 0),
  status text not null default 'waiting' check (status in ('waiting','ready','finished','cancelled')),
  player_a uuid not null references auth.users(id),
  player_b uuid references auth.users(id),
  player_c uuid references auth.users(id),
  snapshot_a jsonb not null,
  snapshot_b jsonb,
  snapshot_c jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint triad_distinct_players check (
    (player_b is null or player_b <> player_a)
    and (player_c is null or (player_c <> player_a and player_c <> player_b))
  )
);
create table if not exists public.triad_match_events (
  id bigint generated always as identity primary key,
  room_id uuid not null references public.triad_rooms(id) on delete cascade,
  actor text not null check (actor in ('a','b','c')),
  actor_user_id uuid not null references auth.users(id),
  action jsonb not null check (jsonb_typeof(action) = 'object'),
  client_action_id text not null,
  created_at timestamptz not null default now(),
  unique (room_id, actor_user_id, client_action_id)
);
create index if not exists triad_match_events_room_seq on public.triad_match_events(room_id, id);
create index if not exists triad_rooms_player_a on public.triad_rooms(player_a);
create index if not exists triad_rooms_player_b on public.triad_rooms(player_b);
create index if not exists triad_rooms_player_c on public.triad_rooms(player_c);

alter table public.triad_rooms enable row level security;
alter table public.triad_match_events enable row level security;
revoke all on public.triad_rooms from anon, authenticated;
revoke all on public.triad_match_events from anon, authenticated;
grant select on public.triad_rooms to authenticated;
grant select on public.triad_match_events to authenticated;
drop policy if exists triad_rooms_read_participants on public.triad_rooms;
create policy triad_rooms_read_participants on public.triad_rooms for select to authenticated
  using ((select auth.uid()) in (player_a, player_b, player_c));
drop policy if exists triad_events_read_participants on public.triad_match_events;
create policy triad_events_read_participants on public.triad_match_events for select to authenticated
  using (exists (
    select 1 from public.triad_rooms r where r.id = room_id
      and (select auth.uid()) in (r.player_a, r.player_b, r.player_c)
  ));

create or replace function public.create_triad_room(p_snapshot jsonb)
returns public.triad_rooms language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_room public.triad_rooms;
  v_code text;
  v_tries integer := 0;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  if jsonb_typeof(p_snapshot->'deck') is distinct from 'array'
     or jsonb_array_length(p_snapshot->'deck') <> 20 then
    raise exception 'INVALID_DECK'; end if;
  loop
    v_tries := v_tries + 1;
    v_code := upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    insert into public.triad_rooms(invite_code, seed, player_a, snapshot_a)
    values(v_code, floor(random() * 2147483646 + 1)::integer, v_user, p_snapshot)
    on conflict (invite_code) do nothing returning * into v_room;
    exit when v_room.id is not null;
    if v_tries >= 10 then raise exception 'ROOM_CODE_EXHAUSTED'; end if;
  end loop;
  return v_room;
end;
$$;

create or replace function public.join_triad_room(p_code text, p_snapshot jsonb)
returns public.triad_rooms language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_room public.triad_rooms;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  if jsonb_typeof(p_snapshot->'deck') is distinct from 'array'
     or jsonb_array_length(p_snapshot->'deck') <> 20 then
    raise exception 'INVALID_DECK'; end if;
  select * into v_room from public.triad_rooms
    where invite_code = upper(trim(p_code)) for update;
  if not found then raise exception 'ROOM_NOT_FOUND'; end if;
  if v_user in (v_room.player_a, v_room.player_b, v_room.player_c) then return v_room; end if;
  if v_room.status <> 'waiting' then raise exception 'ROOM_FULL_OR_STARTED'; end if;
  if v_room.player_b is null then
    update public.triad_rooms set player_b = v_user, snapshot_b = p_snapshot, updated_at = now()
    where id = v_room.id returning * into v_room;
  elsif v_room.player_c is null then
    update public.triad_rooms set player_c = v_user, snapshot_c = p_snapshot, status = 'ready', updated_at = now()
    where id = v_room.id returning * into v_room;
  else
    raise exception 'ROOM_FULL';
  end if;
  return v_room;
end;
$$;

create or replace function public.triad_send_action(p_room_id uuid, p_action jsonb, p_client_action_id text)
returns public.triad_match_events language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_room public.triad_rooms;
  v_seat text;
  v_kind text;
  v_event public.triad_match_events;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_client_action_id is null or length(p_client_action_id) < 8 or length(p_client_action_id) > 128 then
    raise exception 'INVALID_ACTION_ID'; end if;
  select * into v_room from public.triad_rooms where id = p_room_id for update;
  if not found or v_room.status <> 'ready' then raise exception 'ROOM_NOT_READY'; end if;
  if v_user = v_room.player_a then v_seat := 'a';
  elsif v_user = v_room.player_b then v_seat := 'b';
  elsif v_user = v_room.player_c then v_seat := 'c';
  else raise exception 'NOT_ROOM_PARTICIPANT'; end if;
  v_kind := p_action->>'type';
  if jsonb_typeof(p_action) <> 'object'
     or v_kind not in ('ROLL', 'PLAY', 'END', 'NEXT', 'CONCEDE', 'CHAT', 'CHOOSE_AWAKENING')
     or p_action->>'seat' is distinct from v_seat
     or (v_kind = 'NEXT' and v_seat <> 'a') then
    raise exception 'INVALID_ACTION'; end if;
  if v_kind = 'CHAT' and length(coalesce(p_action->>'text','')) > 500 then
    raise exception 'MESSAGE_TOO_LONG'; end if;
  insert into public.triad_match_events(room_id, actor, actor_user_id, action, client_action_id)
  values(p_room_id, v_seat, v_user, p_action, p_client_action_id)
  on conflict (room_id, actor_user_id, client_action_id) do nothing returning * into v_event;
  if v_event.id is null then
    select * into v_event from public.triad_match_events
      where room_id = p_room_id and actor_user_id = v_user and client_action_id = p_client_action_id;
  end if;
  return v_event;
end;
$$;

revoke all on function public.create_triad_room(jsonb) from public, anon;
revoke all on function public.join_triad_room(text, jsonb) from public, anon;
revoke all on function public.triad_send_action(uuid, jsonb, text) from public, anon;
grant execute on function public.create_triad_room(jsonb) to authenticated;
grant execute on function public.join_triad_room(text, jsonb) to authenticated;
grant execute on function public.triad_send_action(uuid, jsonb, text) to authenticated;

-- Polling works without Realtime; publish events when the publication exists.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'triad_rooms') then
      alter publication supabase_realtime add table public.triad_rooms;
    end if;
    if not exists (select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'triad_match_events') then
      alter publication supabase_realtime add table public.triad_match_events;
    end if;
  end if;
end;
$$;
