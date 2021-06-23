<script>
  import DogCard from "./DogCard.svelte";
  import { loading, dogs } from "../store.js";
</script>

<main>
  <h1>Dogs List</h1>
  <div>
    {#if $loading === true}
      Loading Dogs...
    {:else if $dogs != undefined}
      {#each $dogs as dog}
        <DogCard extra={false} favorite={dog.isFavorite} {dog} />
      {/each}
    {/if}
  </div>
</main>

<style>
  div {
    display: flex;
    overflow: scroll;
    height: auto;
    width: auto;
  }
</style>
