<script lang="ts">
  import { type RealtimeLeagueData } from '../stores';
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  export let currentLeagueData = writable<RealtimeLeagueData>([]);

  onMount(() => {
    const eventSource = new EventSource('/api/latest');

    eventSource.onmessage = event => {
      const newData = JSON.parse(event.data);
      currentLeagueData.set(newData);
    };

    eventSource.onerror = error => {
      console.error('Error:', error);
      eventSource.close();
    };
  });
</script>

<main>
  {#if $currentLeagueData.length > 0}
    <ul>
      {#each $currentLeagueData as team}
        <li>
          <strong>{team.name}</strong>: {team.points} points
        </li>
      {/each}
    </ul>
  {:else}
    <p>Loading league data...</p>
  {/if}
</main>
