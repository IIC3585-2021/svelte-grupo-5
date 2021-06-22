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
      <DogCard favorite={false} filtered={false} {dog} />
      {/each}
    {/if}
    <!-- <h1>Dogs List</h1>
    {#await $dogs}
          Loading Dogs...
    {:then allDogs}
      {#each allDogs as dog}
      <DogCard favorite={true} filtered={false} {dog} />
      {/each}
    {:catch error}
      <p style="color: red">{error.message}</p>
    {/await} -->
</main>

<style>
</style>
