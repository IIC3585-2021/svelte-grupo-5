<script>
  import { each } from "svelte/internal";
  import { filters } from '../store.js'
  import { get } from 'svelte/store'

  const deleteFilter = (filter) => {
    console.log("delete filter from button");
    let filtersObjects = get(filters)
    filtersObjects.map(filterObject => {
       if (filterObject.name === filter.name){
         filterObject.applied = false;
       }
     })
    filters.set(filtersObjects);
  };

  const clearFilters = () => {
    console.log("clear filters from button");
    applied.set([]);
    let filtersObjects = get(filters)
    filtersObjects.map(filterObject => {
       filterObject.applied = false; 
    })
    filters.set(filtersObjects);
  };
</script>

<main>
  <h1>Applied Filters</h1>
  {#each $filters as filter}
    {#if filter.applied === true}
      <div>
        {filter.name}
        <button on:click={deleteFilter(filter)}>Delete</button>
      </div>
    {/if}
  {/each}
  <button on:click={clearFilters}>Clear All</button>
</main>

<style>
</style>
