<script>
  import { each } from "svelte/internal";
  import DogCard from "./DogCard.svelte";
  import { dogs } from '../store.js'

</script>

<main>
  <h1>Dogs List</h1>
  {#each $dogs as dog}
    <DogCard favorite={true} filtered={false} {dog} />
  {/each}
</main>

<style>
</style>
