<script>
  import { each } from "svelte/internal";
  // import filters from 'svelte/store/filters'
  // import {addFilter} from 'svelte/store/applied'
  let filters = ["1", "2"];

  const addFilter = (filter) => {
    console.log("add filter from button");
  };
</script>

<main>
  <h1>Breed Group Filters</h1>
  {#each filters as filter}
    <div>
      {filter}
      <button on:click={addFilter(filter)}>Add Filter</button>
    </div>
  {/each}
</main>

<style>
</style>
