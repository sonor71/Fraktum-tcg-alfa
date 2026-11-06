import type { RealtimeChannel } from "@supabase/supabase-js";
import { requireSupabase, supabase, syncSupabaseSessionFromLauncher } from "./supabaseClient";
import type { TriadAction, TriadLoadout, TriadSeat } from "../game/triad/triadEngine";

export type TriadRoom = {
  id: string; invite_code: string; seed: number; status: "waiting" | "ready" | "finished" | "cancelled";
  player_a: string; player_b: string | null; player_c: string | null;
  snapshot_a: TriadLoadout; snapshot_b: TriadLoadout | null; snapshot_c: TriadLoadout | null;
  created_at: string;
};
export type TriadEvent = {
  id: number; room_id: string; actor: TriadSeat; actor_user_id: string;
  action: TriadAction | { type: "CHAT"; text: string; seat: TriadSeat };
  client_action_id: string;
};
export type TriadNetworkAction = TriadEvent["action"];

async function withUser() {
  const client = requireSupabase();
  await syncSupabaseSessionFromLauncher();
  const { data, error } = await client.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Для приватной комнаты войди в FRAKTUM Cloud в профиле.");
  return { client, user: data.user };
}
export function seatForTriadRoom(room: TriadRoom, userId: string): TriadSeat | null {
  if (room.player_a === userId) return "a";
  if (room.player_b === userId) return "b";
  if (room.player_c === userId) return "c";
  return null;
}
export function roomTriadLoadouts(room: TriadRoom): Record<TriadSeat, TriadLoadout> | null {
  if (room.status !== "ready" && room.status !== "finished") return null;
  if (!room.snapshot_a || !room.snapshot_b || !room.snapshot_c) return null;
  return { a: room.snapshot_a, b: room.snapshot_b, c: room.snapshot_c };
}
export async function currentTriadUserId(): Promise<string> {
  const { user } = await withUser();
  return user.id;
}
export async function createTriadRoom(snapshot: TriadLoadout): Promise<TriadRoom> {
  const { client } = await withUser();
  const { data, error } = await client.rpc("create_triad_room", { p_snapshot: snapshot });
  if (error) throw new Error("Не удалось создать комнату: " + error.message);
  return data as TriadRoom;
}
export async function joinTriadRoom(code: string, snapshot: TriadLoadout): Promise<TriadRoom> {
  const { client } = await withUser();
  const normalized = code.trim().toUpperCase().replace(/[^A-F0-9]/g, "");
  if (normalized.length !== 6) throw new Error("Код комнаты должен содержать 6 символов.");
  const { data, error } = await client.rpc("join_triad_room", { p_code: normalized, p_snapshot: snapshot });
  if (error) throw new Error("Не удалось присоединиться: " + error.message);
  return data as TriadRoom;
}
export async function fetchTriadRoom(roomId: string): Promise<TriadRoom | null> {
  const { client } = await withUser();
  const { data, error } = await client.from("triad_rooms").select("*").eq("id", roomId).maybeSingle();
  if (error) throw error;
  return data as TriadRoom | null;
}
export async function fetchTriadEvents(roomId: string): Promise<TriadEvent[]> {
  const { client } = await withUser();
  const { data, error } = await client.from("triad_match_events").select("*")
    .eq("room_id", roomId).order("id", { ascending: true }).limit(5000);
  if (error) throw error;
  return (data ?? []) as TriadEvent[];
}
export async function sendTriadAction(roomId: string, action: TriadNetworkAction): Promise<TriadEvent> {
  const { client } = await withUser();
  const clientActionId = crypto.randomUUID();
  const { data, error } = await client.rpc("triad_send_action", {
    p_room_id: roomId, p_action: action, p_client_action_id: clientActionId,
  });
  if (error) throw new Error("Не удалось выполнить действие: " + error.message);
  return data as TriadEvent;
}
export function subscribeTriadRoom(roomId: string, notify: () => void) {
  if (!supabase) return () => undefined;
  const client = supabase;
  const channel: RealtimeChannel = client.channel("triad:" + roomId)
    .on("postgres_changes", { event: "*", schema: "public", table: "triad_rooms", filter: "id=eq." + roomId }, notify)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "triad_match_events", filter: "room_id=eq." + roomId }, notify)
    .subscribe();
  return () => { void client.removeChannel(channel); };
}
