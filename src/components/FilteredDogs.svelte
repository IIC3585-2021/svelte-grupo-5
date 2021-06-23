<script>
  import DogCard from "./DogCard.svelte";
  import { dogs } from "../store.js";
</script>

<main>
  <h1>Filtered Dogs</h1>
  {#if $dogs.length > 0}
    <div>
      {#each $dogs as dog}
        {#if dog.isFiltered == true}
          <DogCard
            extra={false}
            favorite={dog.isFavorite}
            {dog}
            bg={"yellow"}
          />
        {/if}
      {/each}
    </div>
  {/if}
</main>

<style>
  div {
    display: flex;
    overflow: scroll;
    height: auto;
    width: auto;
  }
</style>
