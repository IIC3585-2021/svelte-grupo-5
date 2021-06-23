<script>
  import { each } from "svelte/internal";
  import DogCard from "./DogCard.svelte";
  import { favoriteCount, dogs } from "../store.js";
  import { get } from "svelte/store";
</script>

<main>
  <h1>Favorite Dogs List ({$favoriteCount})</h1>
  <div>
    {#if $favoriteCount != undefined}
      {#each $dogs as dog}
        {#if dog.isFavorite == true}
          <DogCard
            extra={true}
            favorite={dog.isFavorite}
            {dog}
            bg={"lightpink"}
          />
        {/if}
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
