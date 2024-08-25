import type { RequestHandler } from '@sveltejs/kit';
import { realtimeLeagueData, type RealtimeLeagueData } from '../../../stores';

// todo: calculate auto sub

type LeagueData = {
	standings: {
		results: {
			entry: number;
			entry_name: string;
			event_total: number;
			rank: number;
			last_rank: number;
			total: number;
			rank_sort: number;
			id: number;
		}[];
	};
}

type CurrentTeam = {
	picks: {
		element: number;
		position: number;
		multiplier: number;
		is_captain: boolean;
		is_vice_captain: boolean;
	}[];
}

export type LiveData = {
	elements: {
		id: number;
		stats: {
			total_points: number;
			bonus: number;
		};
	}[];
}

let leagueData: LeagueData;
let liveData: LiveData;

const leagueId = 1156081;
// todo: calculate game week
const gameweek = 2;

const fetchLeagueData = async () => {
    console.log('fetching league data');
    try {
        const response = await fetch(import.meta.env.VITE_FPL_API_HOST + "leagues-classic/" + leagueId + "/standings/");
        leagueData = await response.json();
        realtimeLeagueData.set(leagueData.standings.results.map(team => ({
            name: team.entry_name,
            points: team.total - team.event_total,
        })));
    } catch (e) {
        console.error('Failed to fetch league data:', e);
    }
}

const fetchRealtimeScores = async () => {
    console.log('Fetching realtime scores...');
    try {
        const liveResponse = await fetch(import.meta.env.VITE_FPL_API_HOST + "event/" + gameweek + "/live/");
        liveData = await liveResponse.json() as LiveData;
    } catch (e) {
        console.error('Failed to fetch live data:', e);
    }
    let updatedTeams: RealtimeLeagueData = [];
    for (const team of leagueData.standings.results) {
        const teamData = leagueData.standings.results.find(t => t.entry === team.entry)!;
        let currentPoints = (teamData.total - teamData.event_total) || 0;
        try {
            // todo: cache this
            const currentTeamResponse = await fetch(import.meta.env.VITE_FPL_API_HOST + "entry/" + team.entry + "/event/" + gameweek + "/picks/"); 
            const currentTeam = await currentTeamResponse.json() as CurrentTeam;

            for (const pick of currentTeam.picks) {
                const player = liveData.elements.find(player => player.id === pick.element);
                if (player) {
                    currentPoints += player.stats.total_points * pick.multiplier;
                }
            }
            updatedTeams.push({ name: team.entry_name, points: currentPoints });
        } catch (error) {
            console.error('Failed to fetch data for team', error);
        }
    }
    realtimeLeagueData.set(updatedTeams);
}

export const GET: RequestHandler = async ({ request }) => {
    await fetchLeagueData();
    await fetchRealtimeScores();
    setInterval(fetchRealtimeScores, 60000); 

    return new Response(
        new ReadableStream({
            start(controller) {
                const encoder = new TextEncoder();
                realtimeLeagueData.subscribe((data) => {
                    const sorted = data.sort((a, b) => b.points - a.points);
                    controller.enqueue(`data: ${JSON.stringify(sorted)}\n\n`);
                });
            }
        }),
        { 
            headers: new Headers({
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            }) 
        }
    );
};
