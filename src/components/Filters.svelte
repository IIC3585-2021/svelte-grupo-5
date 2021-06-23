<script>
  import { each } from "svelte/internal";
  import { get } from 'svelte/store'
  import { filters } from '../store.js'
  const addFilter = (filter) => {
    console.log("add filter from button");
    let filtersObjects = get(filters)
    filtersObjects.map(filterObject => {
       if (filterObject.name === filter.name){
         filterObject.applied = true;
       }
     })
    filters.set(filtersObjects)
  };
</script>

<main>
  <h1>Breed Group Filters</h1>
  {#each $filters as filter}
    <div>
      {filter.name}
      <button on:click={addFilter(filter)} disabled='{filter.applied}'>Add Filter</button>
    </div>

  {/each}
</main>

<style>
</style>
