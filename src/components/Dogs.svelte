<script>
  import { each } from "svelte/internal";
  import DogCard from "./DogCard.svelte";
  import { loading, dogs } from '../store.js'
  import { get } from "svelte/store";


</script>

<main>
  <h1>Dogs List</h1>
  {#if $loading === true}
        Loading Dogs...
    {:else if $dogs != undefined}
      {#each $dogs as dog}
      <DogCard extra={false} favorite={dog.isFavorite} {dog} />
      {/each}
    {/if}
</main>

<style>
</style>
