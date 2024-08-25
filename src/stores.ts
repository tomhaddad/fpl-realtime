import { writable } from "svelte/store";

export type RealtimeLeagueData = {
	name: string;
	points: number;
}[];

export const realtimeLeagueData = writable<RealtimeLeagueData>([]);