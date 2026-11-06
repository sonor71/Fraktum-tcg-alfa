-- Allow the explicit D20 Awakening selection in 3-player rooms.
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


